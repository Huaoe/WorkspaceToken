const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StakingRewards", function () {
  let StakingRewards;
  let stakingRewards;
  let MockERC20;
  let stakingToken;
  let rewardsToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock ERC20 tokens for staking and rewards
    MockERC20 = await ethers.getContractFactory("MockEURC");
    stakingToken = await MockERC20.deploy(owner.address);
    rewardsToken = await MockERC20.deploy(owner.address);

    // Deploy StakingRewards contract
    StakingRewards = await ethers.getContractFactory("StakingRewards");
    stakingRewards = await StakingRewards.deploy(
      await stakingToken.getAddress(),
      await rewardsToken.getAddress()
    );

    // Mint tokens to users
    await stakingToken.mint(addr1.address, ethers.parseEther("1000"));
    await stakingToken.mint(addr2.address, ethers.parseEther("1000"));
    await rewardsToken.mint(await stakingRewards.getAddress(), ethers.parseEther("10000")); // Rewards pool

    // Approve staking contract to spend tokens
    await stakingToken.connect(addr1).approve(await stakingRewards.getAddress(), ethers.parseEther("1000"));
    await stakingToken.connect(addr2).approve(await stakingRewards.getAddress(), ethers.parseEther("1000"));
  });

  describe("Constructor", function () {
    it("Should set the correct staking and rewards token addresses", async function () {
      expect(await stakingRewards.stakingToken()).to.equal(await stakingToken.getAddress());
      expect(await stakingRewards.rewardsToken()).to.equal(await rewardsToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await stakingRewards.owner()).to.equal(owner.address);
    });
  });

  describe("Staking", function () {
    it("Should allow users to stake tokens", async function () {
      await stakingRewards.connect(addr1).stake(ethers.parseEther("100"));
      expect(await stakingRewards.balanceOf(addr1.address)).to.equal(ethers.parseEther("100"));
      expect(await stakingRewards.totalSupply()).to.equal(ethers.parseEther("100"));
    });

    it("Should fail if staking amount is zero", async function () {
      await expect(stakingRewards.connect(addr1).stake(0))
        .to.be.revertedWith("amount = 0");
    });

    it("Should fail if user has insufficient balance", async function () {
      const largeAmount = ethers.parseEther("2000"); // More than minted
      await expect(stakingRewards.connect(addr1).stake(largeAmount))
        .to.be.reverted;
    });
  });

  describe("Withdrawing", function () {
    beforeEach(async function () {
      await stakingRewards.connect(addr1).stake(ethers.parseEther("100"));
    });

    it("Should allow users to withdraw staked tokens", async function () {
      await stakingRewards.connect(addr1).withdraw(ethers.parseEther("50"));
      expect(await stakingRewards.balanceOf(addr1.address)).to.equal(ethers.parseEther("50"));
      expect(await stakingRewards.totalSupply()).to.equal(ethers.parseEther("50"));
    });

    it("Should fail if withdrawal amount is zero", async function () {
      await expect(stakingRewards.connect(addr1).withdraw(0))
        .to.be.revertedWith("amount = 0");
    });

    it("Should fail if user has insufficient staked balance", async function () {
      await expect(stakingRewards.connect(addr1).withdraw(ethers.parseEther("150")))
        .to.be.reverted;
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      // Setup rewards
      await stakingRewards.connect(owner).setRewardsDuration(7 * 24 * 3600); // 1 week
      const rewardAmount = ethers.parseEther("1000");
      await stakingRewards.connect(owner).notifyRewardAmount(rewardAmount);

      // Stake tokens
      await stakingRewards.connect(addr1).stake(ethers.parseEther("100"));
    });

    it("Should accumulate rewards over time", async function () {
      await time.increase(86400); // Advance 1 day

      const earned = await stakingRewards.earned(addr1.address);
      expect(earned).to.be.gt(0);
    });

    it("Should allow users to claim rewards", async function () {
      await time.increase(86400); // Advance 1 day

      const earnedBefore = await stakingRewards.earned(addr1.address);
      const balanceBefore = await rewardsToken.balanceOf(addr1.address);
      
      await stakingRewards.connect(addr1).getReward();
      
      const balanceAfter = await rewardsToken.balanceOf(addr1.address);
      const earnedAfter = await stakingRewards.earned(addr1.address);
      
      expect(earnedAfter).to.equal(0);
      
      // Use closeTo for approximate comparison due to block timestamp variations
      const balanceDiff = balanceAfter - balanceBefore;
      const tolerance = ethers.parseEther("0.01"); // 1% tolerance
      expect(balanceDiff).to.be.closeTo(earnedBefore, tolerance);
    });

    it("Should distribute rewards proportionally to stake", async function () {
      // Add second staker with double the stake
      await stakingRewards.connect(addr2).stake(ethers.parseEther("200"));
      
      await time.increase(86400); // Advance 1 day

      const earned1 = await stakingRewards.earned(addr1.address);
      const earned2 = await stakingRewards.earned(addr2.address);

      // Convert BigNumber to number for comparison
      const ratio = Number(earned2) / Number(earned1);
      // addr2 should earn approximately twice as much as addr1 (allow 5% deviation)
      expect(ratio).to.be.closeTo(2, 0.1);
    });
  });

  describe("Admin functions", function () {
    it("Should allow owner to set rewards duration", async function () {
      await stakingRewards.connect(owner).setRewardsDuration(14 * 24 * 3600); // 2 weeks
      await expect(stakingRewards.connect(addr1).setRewardsDuration(7 * 24 * 3600))
        .to.be.revertedWith("not authorized");
    });

    it("Should allow owner to notify reward amount", async function () {
      await stakingRewards.connect(owner).setRewardsDuration(7 * 24 * 3600);
      await stakingRewards.connect(owner).notifyRewardAmount(ethers.parseEther("1000"));
      
      await expect(stakingRewards.connect(addr1).notifyRewardAmount(ethers.parseEther("1000")))
        .to.be.revertedWith("not authorized");
    });

    it("Should fail if notifying reward amount with zero duration", async function () {
      // Try to notify reward amount without setting duration (duration = 0)
      await expect(stakingRewards.connect(owner).notifyRewardAmount(ethers.parseEther("1000")))
        .to.be.reverted; // Will revert with division by zero
    });
  });
});
