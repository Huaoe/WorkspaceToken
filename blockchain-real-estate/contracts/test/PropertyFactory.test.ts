import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { PropertyFactory, MockEURC, PropertyToken } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

interface PropertyInfo {
  tokenAddress: string;
  isApproved: boolean;
}

describe("PropertyFactory", function () {
  // Declare fixture that deploys contracts
  async function deployContractsFixture(): Promise<{
    propertyFactory: PropertyFactory;
    mockEURC: MockEURC;
    owner: SignerWithAddress;
    admin: SignerWithAddress;
    seller: SignerWithAddress;
    buyer: SignerWithAddress;
    validator: SignerWithAddress;
  }> {
    const [owner, admin, seller, buyer, validator] = await ethers.getSigners();

    // Deploy MockEURC
    const MockEURCFactory = await ethers.getContractFactory("MockEURC");
    const mockEURC = (await MockEURCFactory.deploy(owner.address)) as MockEURC;
    await mockEURC.waitForDeployment();

    // Deploy PropertyFactory
    const PropertyFactoryFactory = await ethers.getContractFactory("PropertyFactory");
    const propertyFactory = (await upgrades.deployProxy(
      PropertyFactoryFactory,
      [
        "RealEstateToken",
        "RET",
        await mockEURC.getAddress(),
        admin.address,
        validator.address
      ],
      { initializer: 'initialize' }
    )) as unknown as PropertyFactory;

    await propertyFactory.waitForDeployment();

    // Setup initial state
    await mockEURC.mint(buyer.address, ethers.parseEther("100000") * 2n); // Mint some EURC to buyer
    await mockEURC.connect(buyer).approve(await propertyFactory.getAddress(), ethers.parseEther("100000") * 2n);

    return { mockEURC, propertyFactory, owner, admin, seller, buyer, validator };
  }

  describe("Initialization", function () {
    it("should initialize with correct values", async function () {
      const { mockEURC, propertyFactory, admin, validator } = await loadFixture(deployContractsFixture);
      expect(await propertyFactory.name()).to.equal("RealEstateToken");
      expect(await propertyFactory.symbol()).to.equal("RET");
      expect(await propertyFactory.paymentToken()).to.equal(await mockEURC.getAddress());
      expect(await propertyFactory.admin()).to.equal(admin.address);
      expect(await propertyFactory.validator()).to.equal(validator.address);
    });

    it("should not allow reinitialization", async function () {
      const { mockEURC, propertyFactory, admin, validator } = await loadFixture(deployContractsFixture);
      await expect(
        propertyFactory.initialize(
          "NewToken",
          "NT",
          await mockEURC.getAddress(),
          admin.address,
          validator.address
        )
      ).to.be.revertedWithCustomError(propertyFactory, "InvalidInitialization");
    });
  });

  describe("Property Management", function () {
    const PROPERTY_PRICE = ethers.parseEther("100000"); // 100,000 EURC
    const PROPERTY_ID = 1n;
    const METADATA_URI = "ipfs://QmProperty1";

    it("should create a new property listing", async function () {
      const { propertyFactory, seller } = await loadFixture(deployContractsFixture);
      await propertyFactory.connect(seller).createProperty(
        "Test Property",
        "A test property description",
        "123 Test Street",
        METADATA_URI,
        PROPERTY_PRICE
      );

      const userProperties = await propertyFactory.getUserProperties(seller.address);
      expect(userProperties.length).to.equal(1);
      expect(userProperties[0].isApproved).to.equal(false);

      // Get the token address from the user's properties
      const tokenAddress = userProperties[0].tokenAddress;
      
      // Get the property token contract
      const PropertyToken = await ethers.getContractFactory("PropertyToken");
      const propertyToken = PropertyToken.attach(tokenAddress) as PropertyToken;
      
      // Verify property details
      expect(await propertyToken.getPrice()).to.equal(PROPERTY_PRICE);
      expect(await propertyToken.owner()).to.equal(seller.address);
    });

    it("should emit PropertySubmitted event", async function () {
      const { propertyFactory, seller } = await loadFixture(deployContractsFixture);
      
      const tx = await propertyFactory.connect(seller).createProperty(
        "Test Property",
        "A test property description",
        "123 Test Street",
        METADATA_URI,
        PROPERTY_PRICE
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Get the property info
      const propertyInfo = await propertyFactory.userProperties(seller.address, 0);
      
      // Verify the event
      await expect(tx)
        .to.emit(propertyFactory, "PropertySubmitted")
        .withArgs(seller.address, propertyInfo.tokenAddress);
    });
  });
});
