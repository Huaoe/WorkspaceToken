import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { PropertyFactory, MockEURC, PropertyToken, Whitelist, IPropertyFactory } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

interface PropertyInfo {
  tokenAddress: string;
  isApproved: boolean;
}

describe("PropertyFactory", function () {
  async function deployContractsFixture() {
    const [owner, admin, seller, buyer, validator, nonWhitelisted] = await ethers.getSigners();

    // Deploy MockEURC
    const MockEURC = await ethers.getContractFactory("MockEURC");
    const mockEURC = await MockEURC.deploy(owner.address);
    await mockEURC.waitForDeployment();

    // Deploy Whitelist
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const whitelist = await upgrades.deployProxy(Whitelist, [owner.address]);
    await whitelist.waitForDeployment();

    // Add seller to whitelist
    await whitelist.addToWhitelist(seller.address);

    // Deploy PropertyFactory
    const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
    const propertyFactory = await upgrades.deployProxy(PropertyFactory, [
      "RealEstateToken",  // _name
      "RET",             // _symbol
      await mockEURC.getAddress(),  // _paymentToken (EURC)
      owner.address,     // _admin
      validator.address, // _validator
      await whitelist.getAddress()  // _whitelistContract
    ]);
    await propertyFactory.waitForDeployment();

    // Mint some EURC tokens to seller and approve PropertyFactory
    const mintAmount = ethers.parseUnits("1000", 6); // 1000 EURC
    await mockEURC.mint(seller.address, mintAmount);
    await mockEURC.connect(seller).approve(await propertyFactory.getAddress(), mintAmount);

    return {
      propertyFactory,
      mockEURC,
      whitelist,
      owner,
      admin,
      seller,
      buyer,
      validator,
      nonWhitelisted
    };
  }

  describe("Initialization", function () {
    it("should initialize with correct values", async function () {
      const { mockEURC, propertyFactory, whitelist, owner } = await loadFixture(deployContractsFixture);
      expect(await propertyFactory.name()).to.equal("RealEstateToken");
      expect(await propertyFactory.symbol()).to.equal("RET");
      expect(await propertyFactory.paymentToken()).to.equal(await mockEURC.getAddress());
      expect(await propertyFactory.admin()).to.equal(owner.address);
      expect(await propertyFactory.whitelistContract()).to.equal(await whitelist.getAddress());
    });

    it("should not allow reinitialization", async function () {
      const { propertyFactory, mockEURC, owner, validator, whitelist } = await loadFixture(deployContractsFixture);
      await expect(propertyFactory.initialize(
        "RealEstateToken",
        "RET",
        await mockEURC.getAddress(),
        owner.address,
        validator.address,
        await whitelist.getAddress()
      )).to.be.reverted;
    });
  });

  describe("Whitelist Integration", function () {
    it("should not allow non-whitelisted addresses to create properties", async function () {
      const { propertyFactory, nonWhitelisted } = await loadFixture(deployContractsFixture);
      
      await expect((propertyFactory.connect(nonWhitelisted) as IPropertyFactory).createProperty(
        "Test Property",
        "Test Description",
        "Test Location",
        "https://test.com/image.jpg",
        ethers.parseUnits("100", 6), // 100 EURC
        ethers.parseUnits("100", 18), // 100 tokens
        "Test Property - RET", 
        "RET-TP" 
      )).to.be.revertedWithCustomError(propertyFactory, "NotWhitelisted");
    });

    it("should allow whitelisted addresses to create properties", async function () {
      const { propertyFactory, seller } = await loadFixture(deployContractsFixture);
      
      const tx = await (propertyFactory.connect(seller) as IPropertyFactory).createProperty(
        "Test Property",
        "Test Description",
        "Test Location",
        "https://test.com/image.jpg",
        ethers.parseUnits("100", 6), // 100 EURC
        ethers.parseUnits("100", 18), // 100 tokens
        "Test Property - RET", 
        "RET-TP" 
      );

      await tx.wait();
      
      // Get the created property token address
      const propertyCount = await propertyFactory.getPropertyCount();
      expect(propertyCount).to.equal(1);
      
      const propertyInfo = await propertyFactory.properties(0);
      const propertyToken = await ethers.getContractAt("PropertyToken", propertyInfo.tokenAddress);
      
      // Verify the property token was initialized correctly
      expect(await propertyToken.name()).to.equal("Test Property - RET");
      expect(await propertyToken.symbol()).to.equal("RET-TP");
    });
  });

  describe("Property Management", function () {
    it("should create a new property listing", async function () {
      const { propertyFactory, seller } = await loadFixture(deployContractsFixture);
      
      const tx = await (propertyFactory.connect(seller) as IPropertyFactory).createProperty(
        "Test Property",
        "Test Description",
        "Test Location",
        "https://test.com/image.jpg",
        ethers.parseUnits("100", 6), // 100 EURC
        ethers.parseUnits("100", 18), // 100 tokens
        "Test Property - RET", 
        "RET-TP" 
      );

      await tx.wait();

      const propertyCount = await propertyFactory.getPropertyCount();
      expect(propertyCount).to.equal(1);

      const propertyInfo = await propertyFactory.properties(0);
      const propertyToken = await ethers.getContractAt("PropertyToken", propertyInfo.tokenAddress);
      
      expect(await propertyToken.name()).to.equal("Test Property - RET");
      expect(await propertyToken.symbol()).to.equal("RET-TP");
      
      const details = await propertyToken.propertyDetails();
      expect(details.title).to.equal("Test Property");
      expect(details.description).to.equal("Test Description");
      expect(details.location).to.equal("Test Location");
      expect(details.imageUrl).to.equal("https://test.com/image.jpg");
      expect(details.price).to.equal(ethers.parseUnits("100", 6));
      expect(details.isActive).to.be.true;
    });
  });
});
