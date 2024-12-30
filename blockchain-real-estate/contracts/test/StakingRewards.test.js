const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("StakingRewards", function () {
  let StakingRewardsV2;
  let stakingRewards;
  let stakingToken;
  let rewardToken;
  let owner;
  let addr1;
  let addr2;
  let stakingRewardsAddress;
  const rewardRate = ethers.parseUnits("1", 6); // 1 EURC per second

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock tokens using upgrades plugin
    const MockToken = await ethers.getContractFactory("MockEURCUpgradeable");
    
    stakingToken = await upgrades.deployProxy(MockToken, [owner.address], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await stakingToken.waitForDeployment();
    
    rewardToken = await upgrades.deployProxy(MockToken, [owner.address], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await rewardToken.waitForDeployment();

    // Deploy StakingRewardsV2
    StakingRewardsV2 = await ethers.getContractFactory("StakingRewardsV2");
    stakingRewards = await upgrades.deployProxy(StakingRewardsV2, [
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      31536000 // 1 year in seconds
    ], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await stakingRewards.waitForDeployment();
    stakingRewardsAddress = await stakingRewards.getAddress();

    // Mint tokens
    await stakingToken.mint(owner.address, ethers.parseEther("10000"));
    await stakingToken.mint(addr1.address, ethers.parseEther("1000"));
    await stakingToken.mint(addr2.address, ethers.parseEther("1000"));
    await rewardToken.mint(stakingRewardsAddress, ethers.parseUnits("10000", 6));

    // Approve spending
    await rewardToken.approve(stakingRewardsAddress, ethers.MaxUint256);
    await stakingToken.approve(stakingRewardsAddress, ethers.MaxUint256);
    await stakingToken.connect(addr1).approve(stakingRewardsAddress, ethers.MaxUint256);
    await stakingToken.connect(addr2).approve(stakingRewardsAddress, ethers.MaxUint256);

    // Set initial reward rate
    await stakingRewards.notifyRewardRate(rewardRate);
  });

  it("Should set the correct staking and rewards token addresses", async function () {
    expect(await stakingRewards.stakingToken()).to.equal(await stakingToken.getAddress());
    expect(await stakingRewards.rewardToken()).to.equal(await rewardToken.getAddress());
  });

  it("Should allow users to stake tokens", async function () {
    const stakeAmount = ethers.parseEther("100");
    await stakingRewards.stake(stakeAmount);
    expect(await stakingRewards.balanceOf(owner.address)).to.equal(stakeAmount);
  });

  it("Should allow users to withdraw staked tokens", async function () {
    const stakeAmount = ethers.parseEther("100");
    await stakingRewards.stake(stakeAmount);
    await stakingRewards.withdraw(stakeAmount);
    expect(await stakingRewards.balanceOf(owner.address)).to.equal(0);
  });

  it("Should track total supply correctly", async function () {
    const stakeAmount = ethers.parseEther("100");
    await stakingRewards.stake(stakeAmount);
    expect(await stakingRewards.totalSupply()).to.equal(stakeAmount);
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      // Stake some tokens
      const stakeAmount = ethers.parseEther("100");
      await stakingRewards.stake(stakeAmount);
    });

    it("Should update reward rate", async function () {
      const newRate = ethers.parseUnits("2", 6); // 2 EURC per second
      await stakingRewards.notifyRewardRate(newRate);
      expect(await stakingRewards.rewardRate()).to.equal(newRate);
    });

    it("Should calculate rewards correctly", async function () {
      // Wait for some time to accrue rewards
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const earned = await stakingRewards.earned(owner.address);
      expect(earned).to.be.gt(0);
    });

    it("Should allow users to claim rewards", async function () {
      // Wait for some time to accrue rewards
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      const earnedBefore = await stakingRewards.earned(owner.address);
      await stakingRewards.getReward();
      const earnedAfter = await stakingRewards.earned(owner.address);

      expect(earnedAfter).to.equal(0);
      expect(await rewardToken.balanceOf(owner.address)).to.be.gt(0);
    });

    it("Should revert if non-factory tries to update reward rate", async function () {
      const newRate = ethers.parseUnits("2", 6);
      await expect(stakingRewards.connect(addr1).notifyRewardRate(newRate))
        .to.be.revertedWithCustomError(stakingRewards, "OnlyFactory");
    });
  });
});
