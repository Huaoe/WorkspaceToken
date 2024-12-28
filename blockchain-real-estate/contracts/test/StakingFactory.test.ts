import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StakingFactory", function () {
  let stakingFactory: Contract;
  let eurcToken: Contract;
  let propertyToken: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory("MockEURCUpgradeable");
    
    eurcToken = await MockToken.deploy();
    await eurcToken.initialize(owner.address);

    propertyToken = await MockToken.deploy();
    await propertyToken.initialize(owner.address);

    // Deploy StakingFactory implementation
    const StakingFactory = await ethers.getContractFactory("StakingFactory");
    const stakingFactoryImpl = await StakingFactory.deploy();

    // Deploy proxy
    const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
    const initData = StakingFactory.interface.encodeFunctionData("initialize", [
      await eurcToken.getAddress()
    ]);
    const proxy = await ERC1967Proxy.deploy(
      await stakingFactoryImpl.getAddress(),
      initData
    );

    stakingFactory = StakingFactory.attach(await proxy.getAddress());

    // Mint EURC tokens to users
    await eurcToken.mint(owner.address, ethers.parseUnits("10000", 6));
    await eurcToken.mint(addr1.address, ethers.parseUnits("10000", 6));
    await eurcToken.mint(addr2.address, ethers.parseUnits("10000", 6));

    // Approve StakingFactory to spend EURC
    await eurcToken.approve(await stakingFactory.getAddress(), ethers.parseUnits("10000", 6));
    await eurcToken.connect(addr1).approve(await stakingFactory.getAddress(), ethers.parseUnits("10000", 6));
    await eurcToken.connect(addr2).approve(await stakingFactory.getAddress(), ethers.parseUnits("10000", 6));
  });

  describe("Initialization", function () {
    it("Should set the correct EURC token address", async function () {
      expect(await stakingFactory.eurcToken()).to.equal(await eurcToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await stakingFactory.owner()).to.equal(owner.address);
    });
  });

  describe("Creating Staking Rewards", function () {
    it("Should create a new StakingRewards contract", async function () {
      const rewardRate = ethers.parseUnits("1000", 6) / BigInt(31536000); // 1000 tokens / 1 year
      const duration = 31536000; // 1 year in seconds

      const tx = await stakingFactory.createStakingContract(
        await propertyToken.getAddress(),
        rewardRate,
        duration
      );
      await tx.wait();

      const stakingContracts = await stakingFactory.getStakingContracts(await propertyToken.getAddress());
      expect(stakingContracts.length).to.equal(1);

      const info = await stakingFactory.stakingContracts(await propertyToken.getAddress());
      expect(info.isActive).to.be.true;
      expect(info.duration).to.equal(duration);
      expect(info.rewardRate).to.equal(rewardRate);
    });

    it("Should emit StakingContractCreated event", async function () {
      const rewardRate = ethers.parseUnits("1000", 6) / BigInt(31536000);
      const duration = 31536000;

      await expect(stakingFactory.createStakingContract(
        await propertyToken.getAddress(),
        rewardRate,
        duration
      )).to.emit(stakingFactory, "StakingContractCreated");
    });

    it("Should revert if property token is zero address", async function () {
      const rewardRate = ethers.parseUnits("1000", 6) / BigInt(31536000);
      const duration = 31536000;

      await expect(stakingFactory.createStakingContract(
        ethers.ZeroAddress,
        rewardRate,
        duration
      )).to.be.revertedWith("StakingFactory: property token is zero address");
    });
  });

  describe("Funding Staking Rewards", function () {
    let stakingContractAddress: string;

    beforeEach(async function () {
      const rewardRate = ethers.parseUnits("1000", 6) / BigInt(31536000);
      const duration = 31536000;

      const tx = await stakingFactory.createStakingContract(
        await propertyToken.getAddress(),
        rewardRate,
        duration
      );
      await tx.wait();

      const stakingContracts = await stakingFactory.getStakingContracts(await propertyToken.getAddress());
      stakingContractAddress = stakingContracts[0];
    });

    it("Should fund a staking contract", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const initialBalance = await eurcToken.balanceOf(stakingContractAddress);

      await stakingFactory.fundStakingContract(await propertyToken.getAddress(), amount);

      const finalBalance = await eurcToken.balanceOf(stakingContractAddress);
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should emit StakingContractFunded event", async function () {
      const amount = ethers.parseUnits("1000", 6);

      await expect(stakingFactory.fundStakingContract(await propertyToken.getAddress(), amount))
        .to.emit(stakingFactory, "StakingContractFunded")
        .withArgs(stakingContractAddress, amount);
    });

    it("Should revert if amount is zero", async function () {
      await expect(stakingFactory.fundStakingContract(await propertyToken.getAddress(), 0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should revert if staking contract does not exist", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const nonExistentToken = await (await MockToken.deploy()).getAddress();

      await expect(stakingFactory.fundStakingContract(nonExistentToken, amount))
        .to.be.revertedWith("StakingFactory: staking contract does not exist");
    });

    it("Should revert if reward rate is too small", async function () {
      const tinyAmount = BigInt(1); // This will result in a very small reward rate
      await expect(stakingFactory.fundStakingContract(await propertyToken.getAddress(), tinyAmount))
        .to.be.revertedWith("StakingFactory: reward rate too small");
    });
  });
});
