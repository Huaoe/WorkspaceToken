const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
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
    MockERC20 = await ethers.getContractFactory("MockEURCUpgradeable");
    stakingToken = await upgrades.deployProxy(MockERC20, [owner.address], {
      initializer: "initialize",
      kind: 'transparent'
    });
    rewardsToken = await upgrades.deployProxy(MockERC20, [owner.address], {
      initializer: "initialize",
      kind: 'transparent'
    });

    // Deploy StakingRewards contract
    StakingRewards = await ethers.getContractFactory("StakingRewards");
    stakingRewards = await upgrades.deployProxy(StakingRewards, [
      await stakingToken.getAddress(),
      await rewardsToken.getAddress(),
      ethers.parseUnits("1", 0), // Initial reward rate of 1 token per second
      7 * 24 * 3600 // 1 week duration
    ], {
      initializer: "initialize",
      kind: 'transparent'
    });

    // Mint tokens to users and contract
    await stakingToken.mint(addr1.address, ethers.parseEther("1000")); // 18 decimals for staking token
    await stakingToken.mint(addr2.address, ethers.parseEther("1000")); // 18 decimals for staking token
    await rewardsToken.mint(await stakingRewards.getAddress(), ethers.parseUnits("10000", 6)); // 6 decimals for rewards token

    // Approve staking contract to spend tokens
    const stakingRewardsAddress = await stakingRewards.getAddress();
    await stakingToken.connect(addr1).approve(stakingRewardsAddress, ethers.parseEther("1000"));
    await stakingToken.connect(addr2).approve(stakingRewardsAddress, ethers.parseEther("1000"));

    // Notify reward rate
    await stakingRewards.notifyRewardRate(ethers.parseUnits("1000", 6));
  });

  describe("Initialization", function () {
    it("Should set the correct staking and rewards token addresses", async function () {
      expect(await stakingRewards.stakingToken()).to.equal(await stakingToken.getAddress());
      expect(await stakingRewards.rewardToken()).to.equal(await rewardsToken.getAddress());
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
        .to.be.revertedWith("StakingRewards: amount = 0");
    });

    it("Should fail if user has insufficient balance", async function () {
      const largeAmount = ethers.parseEther("2000"); // More than minted
      await expect(stakingRewards.connect(addr1).stake(largeAmount))
        .to.be.revertedWith("ERC20InsufficientBalance");
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
        .to.be.revertedWith("StakingRewards: amount = 0");
    });

    it("Should fail if user has insufficient staked balance", async function () {
      await expect(stakingRewards.connect(addr1).withdraw(ethers.parseEther("150")))
        .to.be.revertedWith("StakingRewards: insufficient balance");
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      // Stake tokens
      await stakingRewards.connect(addr1).stake(ethers.parseEther("100"));
      await time.increase(7 * 24 * 3600); // Advance time by 1 week
    });

    it("Should allow users to claim rewards", async function () {
      const initialBalance = await rewardsToken.balanceOf(addr1.address);
      const earned = await stakingRewards.earned(addr1.address);
      
      await stakingRewards.connect(addr1).getReward();
      
      const finalBalance = await rewardsToken.balanceOf(addr1.address);
      expect(finalBalance - initialBalance).to.equal(earned);
    });

    it("Should calculate rewards correctly", async function () {
      const rewardRate = await stakingRewards.rewardRate();
      const duration = 7 * 24 * 3600; // 1 week in seconds
      const expectedReward = rewardRate * BigInt(duration);
      
      const earned = await stakingRewards.earned(addr1.address);
      expect(earned).to.be.closeTo(expectedReward, ethers.parseUnits("2000", 0)); // Allow for small rounding differences due to block timing
    });

    it("Should allow users to exit (withdraw all and claim rewards)", async function () {
      const initialStakingBalance = await stakingToken.balanceOf(addr1.address);
      const initialRewardBalance = await rewardsToken.balanceOf(addr1.address);
      const stakedAmount = await stakingRewards.balanceOf(addr1.address);
      const earned = await stakingRewards.earned(addr1.address);

      await stakingRewards.connect(addr1).exit();

      const finalStakingBalance = await stakingToken.balanceOf(addr1.address);
      const finalRewardBalance = await rewardsToken.balanceOf(addr1.address);

      expect(finalStakingBalance - initialStakingBalance).to.equal(stakedAmount);
      expect(finalRewardBalance - initialRewardBalance).to.equal(earned);
      expect(await stakingRewards.balanceOf(addr1.address)).to.equal(0);
    });
  });
});
