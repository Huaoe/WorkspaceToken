import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";

describe("StakingFactory", function () {
  let stakingFactory: Contract;
  let eurcToken: Contract;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let factoryAddress: string;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock EURC token using upgrades plugin
    const MockEURC = await ethers.getContractFactory("MockEURCUpgradeable");
    eurcToken = await upgrades.deployProxy(MockEURC, [owner.address], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await eurcToken.waitForDeployment();

    // Deploy StakingFactory
    const StakingFactory = await ethers.getContractFactory("StakingFactory");
    stakingFactory = await upgrades.deployProxy(StakingFactory, [await eurcToken.getAddress()], {
      kind: 'uups',
      initializer: 'initialize'
    });
    await stakingFactory.waitForDeployment();
    factoryAddress = await stakingFactory.getAddress();

    // Mint some EURC tokens
    await eurcToken.mint(owner.address, ethers.parseUnits("10000", 6));
    await eurcToken.mint(addr1.address, ethers.parseUnits("1000", 6));
    await eurcToken.mint(addr2.address, ethers.parseUnits("1000", 6));
  });

  it("Should set the correct EURC token address", async function () {
    expect(await stakingFactory.eurcToken()).to.equal(await eurcToken.getAddress());
  });

  it("Should create a new staking contract", async function () {
    const propertyToken = "0x1234567890123456789012345678901234567890";
    const rewardRate = ethers.parseUnits("1", 6); // 1 EURC per second
    const duration = 31536000; // 1 year in seconds

    const tx = await stakingFactory.createStakingContract(propertyToken, rewardRate, duration);
    const receipt = await tx.wait();

    // Get the StakingContractCreated event
    const event = receipt.logs.find(
      (log: any) => log.fragment && log.fragment.name === 'StakingContractCreated'
    );
    expect(event).to.not.be.undefined;

    // Verify the contract info is stored correctly
    const stakingContractInfo = await stakingFactory.stakingContracts(propertyToken);
    expect(stakingContractInfo.isActive).to.be.true;
    expect(stakingContractInfo.rewardRate).to.equal(rewardRate);
    expect(stakingContractInfo.duration).to.equal(duration);
  });

  it("Should fund a staking contract", async function () {
    const propertyToken = "0x1234567890123456789012345678901234567890";
    const rewardRate = ethers.parseUnits("1", 6);
    const duration = 31536000;
    const fundAmount = ethers.parseUnits("1000", 6);

    // Create staking contract
    const tx = await stakingFactory.createStakingContract(propertyToken, rewardRate, duration);
    const receipt = await tx.wait();
    const stakingContractInfo = await stakingFactory.stakingContracts(propertyToken);

    // Approve EURC tokens
    await eurcToken.approve(factoryAddress, fundAmount);

    // Fund the contract
    const fundTx = await stakingFactory.fundStakingContract(propertyToken, fundAmount);
    const fundReceipt = await fundTx.wait();

    // Verify funding event
    const fundEvent = fundReceipt.logs.find(
      (log: any) => log.fragment && log.fragment.name === 'StakingContractFunded'
    );
    expect(fundEvent).to.not.be.undefined;
    expect(fundEvent.args[1]).to.equal(fundAmount);
  });

  it("Should update reward rate", async function () {
    const propertyToken = "0x1234567890123456789012345678901234567890";
    const initialRate = ethers.parseUnits("1", 6);
    const newRate = ethers.parseUnits("2", 6);
    const duration = 31536000;

    // Create staking contract
    const tx = await stakingFactory.createStakingContract(propertyToken, initialRate, duration);
    await tx.wait();
    const stakingContractInfo = await stakingFactory.stakingContracts(propertyToken);

    // Update reward rate
    const updateTx = await stakingFactory.updateRewardRate(propertyToken, newRate);
    const updateReceipt = await updateTx.wait();

    // Verify update event
    const updateEvent = updateReceipt.logs.find(
      (log: any) => log.fragment && log.fragment.name === 'RewardRateUpdated'
    );
    expect(updateEvent).to.not.be.undefined;
    expect(updateEvent.args[1]).to.equal(newRate);
  });

  it("Should revert when creating duplicate staking contract", async function () {
    const propertyToken = "0x1234567890123456789012345678901234567890";
    const rewardRate = ethers.parseUnits("1", 6);
    const duration = 31536000;

    await stakingFactory.createStakingContract(propertyToken, rewardRate, duration);

    await expect(stakingFactory.createStakingContract(propertyToken, rewardRate, duration))
      .to.be.revertedWith("StakingFactory: staking contract already exists for this property token");
  });

  it("Should revert when funding non-existent staking contract", async function () {
    const propertyToken = "0x1234567890123456789012345678901234567890";
    const fundAmount = ethers.parseUnits("1000", 6);

    await expect(stakingFactory.fundStakingContract(propertyToken, fundAmount))
      .to.be.revertedWith("StakingFactory: staking contract does not exist");
  });
});
