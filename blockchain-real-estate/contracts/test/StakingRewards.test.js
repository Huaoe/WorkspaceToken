const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingRewards", function () {
  let StakingRewardsV2;
  let stakingRewards;
  let stakingToken;
  let rewardToken;
  let owner;
  let addr1;
  let addr2;
  let stakingRewardsAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("MockEURCUpgradeable");
    
    stakingToken = await MockToken.deploy();
    await stakingToken.initialize(owner.address);
    
    rewardToken = await MockToken.deploy();
    await rewardToken.initialize(owner.address);

    // Deploy StakingRewardsV2
    StakingRewardsV2 = await ethers.getContractFactory("StakingRewardsV2");
    const stakingRewardsImpl = await StakingRewardsV2.deploy();

    // Deploy proxy
    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const initData = StakingRewardsV2.interface.encodeFunctionData("initialize", [
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      31536000 // 1 year in seconds
    ]);
    const proxy = await ERC1967Proxy.deploy(
      await stakingRewardsImpl.getAddress(),
      initData
    );

    stakingRewardsAddress = await proxy.getAddress();
    stakingRewards = StakingRewardsV2.attach(stakingRewardsAddress);

    // Mint tokens
    await stakingToken.mint(owner.address, ethers.parseEther("10000"));
    await stakingToken.mint(addr1.address, ethers.parseEther("1000"));
    await stakingToken.mint(addr2.address, ethers.parseEther("1000"));

    await rewardToken.mint(owner.address, ethers.parseUnits("10000", 6));

    // Transfer reward tokens to StakingRewards contract
    await rewardToken.transfer(stakingRewardsAddress, ethers.parseUnits("5000", 6));

    // Approve staking
    await stakingToken.approve(stakingRewardsAddress, ethers.parseEther("10000"));
    await stakingToken.connect(addr1).approve(stakingRewardsAddress, ethers.parseEther("1000"));
    await stakingToken.connect(addr2).approve(stakingRewardsAddress, ethers.parseEther("1000"));

    // Set initial reward rate (1000 tokens over 1 year)
    const rewardRate = ethers.parseUnits("1000", 6) / BigInt(31536000); // 1000 tokens / 1 year in seconds
    await stakingRewards.notifyRewardRate(rewardRate);
  });

  describe("Initialization", function () {
    it("Should set the correct staking and rewards token addresses", async function () {
      expect(await stakingRewards.stakingToken()).to.equal(await stakingToken.getAddress());
      expect(await stakingRewards.rewardToken()).to.equal(await rewardToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await stakingRewards.owner()).to.equal(owner.address);
    });
  });

  describe("Staking", function () {
    it("Should accept staking", async function () {
      await stakingRewards.stake(ethers.parseEther("100"));
      expect(await stakingRewards.balanceOf(owner.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should update total supply when staking", async function () {
      await stakingRewards.stake(ethers.parseEther("100"));
      expect(await stakingRewards.totalSupply()).to.equal(ethers.parseEther("100"));
    });

    it("Should emit Staked event", async function () {
      await expect(stakingRewards.stake(ethers.parseEther("100")))
        .to.emit(stakingRewards, "Staked")
        .withArgs(owner.address, ethers.parseEther("100"));
    });
  });

  describe("Withdrawing", function () {
    beforeEach(async function () {
      await stakingRewards.stake(ethers.parseEther("100"));
    });

    it("Should allow withdrawal", async function () {
      await stakingRewards.withdraw(ethers.parseEther("50"));
      expect(await stakingRewards.balanceOf(owner.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should update total supply when withdrawing", async function () {
      await stakingRewards.withdraw(ethers.parseEther("50"));
      expect(await stakingRewards.totalSupply()).to.equal(ethers.parseEther("50"));
    });

    it("Should emit Withdrawn event", async function () {
      await expect(stakingRewards.withdraw(ethers.parseEther("50")))
        .to.emit(stakingRewards, "Withdrawn")
        .withArgs(owner.address, ethers.parseEther("50"));
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      // Stake some tokens
      await stakingRewards.stake(ethers.parseEther("100"));
    });

    it("Should accumulate rewards over time", async function () {
      // Move forward in time
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const earned = await stakingRewards.earned(owner.address);
      expect(earned).to.be.gt(0);
    });

    it("Should allow reward collection", async function () {
      // Move forward in time
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const earnedBefore = await stakingRewards.earned(owner.address);
      await stakingRewards.getReward();
      const earnedAfter = await stakingRewards.earned(owner.address);

      expect(earnedAfter).to.equal(0);
      expect(earnedBefore).to.be.gt(0);
    });

    it("Should emit RewardPaid event", async function () {
      // Move forward in time
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const earned = await stakingRewards.earned(owner.address);
      await expect(stakingRewards.getReward())
        .to.emit(stakingRewards, "RewardPaid")
        .withArgs(owner.address, earned);
    });
  });

  describe("Reward Rate Updates", function () {
    it("Should allow owner to update reward rate", async function () {
      const newRate = ethers.parseUnits("2000", 6) / BigInt(31536000); // 2000 tokens / 1 year
      await stakingRewards.notifyRewardRate(newRate);
      expect(await stakingRewards.rewardRate()).to.equal(newRate);
    });

    it("Should emit RewardAdded event", async function () {
      const newRate = ethers.parseUnits("2000", 6) / BigInt(31536000);
      const duration = await stakingRewards.duration();
      await expect(stakingRewards.notifyRewardRate(newRate))
        .to.emit(stakingRewards, "RewardAdded")
        .withArgs(newRate * duration);
    });

    it("Should revert if non-owner tries to update reward rate", async function () {
      const newRate = ethers.parseUnits("2000", 6) / BigInt(31536000);
      await expect(stakingRewards.connect(addr1).notifyRewardRate(newRate))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
