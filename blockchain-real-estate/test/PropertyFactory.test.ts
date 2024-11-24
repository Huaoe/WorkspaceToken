import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { PropertyFactory, MockEURC, PropertyToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PropertyFactory", function () {
  // Test fixture that deploys all contracts
  async function deployContractsFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy MockEURC
    const MockEURC = await ethers.getContractFactory("MockEURC");
    const mockEURC = await MockEURC.deploy(owner.address);
    await mockEURC.waitForDeployment();

    // Deploy PropertyFactory
    const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
    const propertyFactory = await PropertyFactory.deploy(owner.address, await mockEURC.getAddress());
    await propertyFactory.waitForDeployment();

    return { mockEURC, propertyFactory, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { propertyFactory, owner } = await loadFixture(deployContractsFixture);
      expect(await propertyFactory.owner()).to.equal(owner.address);
    });

    it("Should set the correct EURC token address", async function () {
      const { propertyFactory, mockEURC } = await loadFixture(deployContractsFixture);
      expect(await propertyFactory.eurcTokenAddress()).to.equal(await mockEURC.getAddress());
    });
  });

  describe("Property Creation", function () {
    const validPropertyData = {
      title: "Test Property",
      description: "A test property description",
      location: "123 Test St, Test City",
      imageUrl: "https://test.com/image.jpg",
      price: ethers.parseUnits("1000", 6) // 1000 EURC
    };

    it("Should create a property token with valid data", async function () {
      const { propertyFactory, owner } = await loadFixture(deployContractsFixture);
      
      const tx = await propertyFactory.createProperty(
        validPropertyData.title,
        validPropertyData.description,
        validPropertyData.location,
        validPropertyData.imageUrl,
        validPropertyData.price
      );
      
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        log => log.topics[0] === propertyFactory.interface.getEvent("PropertySubmitted").topicHash
      );
      expect(event).to.not.be.undefined;
    });

    it("Should store property info in userProperties mapping", async function () {
      const { propertyFactory, owner } = await loadFixture(deployContractsFixture);
      
      await propertyFactory.createProperty(
        validPropertyData.title,
        validPropertyData.description,
        validPropertyData.location,
        validPropertyData.imageUrl,
        validPropertyData.price
      );

      const properties = await propertyFactory.getUserProperties(owner.address);
      expect(properties).to.have.lengthOf(1);
      expect(properties[0].isApproved).to.be.false;
    });

    it("Should fail with empty title", async function () {
      const { propertyFactory } = await loadFixture(deployContractsFixture);
      
      await expect(propertyFactory.createProperty(
        "",
        validPropertyData.description,
        validPropertyData.location,
        validPropertyData.imageUrl,
        validPropertyData.price
      )).to.be.revertedWith("Title cannot be empty");
    });

    it("Should fail with empty description", async function () {
      const { propertyFactory } = await loadFixture(deployContractsFixture);
      
      await expect(propertyFactory.createProperty(
        validPropertyData.title,
        "",
        validPropertyData.location,
        validPropertyData.imageUrl,
        validPropertyData.price
      )).to.be.revertedWith("Description cannot be empty");
    });

    it("Should fail with zero price", async function () {
      const { propertyFactory } = await loadFixture(deployContractsFixture);
      
      await expect(propertyFactory.createProperty(
        validPropertyData.title,
        validPropertyData.description,
        validPropertyData.location,
        validPropertyData.imageUrl,
        0
      )).to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Property Approval", function () {
    it("Should approve a property", async function () {
      const { propertyFactory, owner } = await loadFixture(deployContractsFixture);
      
      // Create a property first
      await propertyFactory.createProperty(
        "Test Property",
        "Description",
        "Location",
        "https://test.com/image.jpg",
        ethers.parseUnits("1000", 6)
      );

      const properties = await propertyFactory.getUserProperties(owner.address);
      const propertyAddress = properties[0].tokenAddress;

      // Approve the property
      await propertyFactory.approveProperty(propertyAddress);

      // Check if property is approved
      expect(await propertyFactory.getPropertyStatus(propertyAddress)).to.be.true;
    });

    it("Should fail when non-owner tries to approve", async function () {
      const { propertyFactory, user1, owner } = await loadFixture(deployContractsFixture);
      
      // Create a property first
      await propertyFactory.createProperty(
        "Test Property",
        "Description",
        "Location",
        "https://test.com/image.jpg",
        ethers.parseUnits("1000", 6)
      );

      const properties = await propertyFactory.getUserProperties(owner.address);
      const propertyAddress = properties[0].tokenAddress;

      // Try to approve with non-owner account
      await expect(
        propertyFactory.connect(user1).approveProperty(propertyAddress)
      ).to.be.revertedWithCustomError(propertyFactory, "OwnableUnauthorizedAccount");
    });

    it("Should fail to approve non-existent property", async function () {
      const { propertyFactory } = await loadFixture(deployContractsFixture);
      
      const nonExistentAddress = "0x1234567890123456789012345678901234567890";
      await expect(
        propertyFactory.approveProperty(nonExistentAddress)
      ).to.be.revertedWith("Property not found in any user's properties");
    });
  });

  describe("Property Rejection", function () {
    it("Should reject a property", async function () {
      const { propertyFactory, owner } = await loadFixture(deployContractsFixture);
      
      // Create a property first
      await propertyFactory.createProperty(
        "Test Property",
        "Description",
        "Location",
        "https://test.com/image.jpg",
        ethers.parseUnits("1000", 6)
      );

      const properties = await propertyFactory.getUserProperties(owner.address);
      const propertyAddress = properties[0].tokenAddress;

      // Reject the property
      await expect(propertyFactory.rejectProperty(propertyAddress))
        .to.emit(propertyFactory, "PropertyRejected")
        .withArgs(propertyAddress);
    });

    it("Should fail when non-owner tries to reject", async function () {
      const { propertyFactory, user1, owner } = await loadFixture(deployContractsFixture);
      
      // Create a property first
      await propertyFactory.createProperty(
        "Test Property",
        "Description",
        "Location",
        "https://test.com/image.jpg",
        ethers.parseUnits("1000", 6)
      );

      const properties = await propertyFactory.getUserProperties(owner.address);
      const propertyAddress = properties[0].tokenAddress;

      // Try to reject with non-owner account
      await expect(
        propertyFactory.connect(user1).rejectProperty(propertyAddress)
      ).to.be.revertedWithCustomError(propertyFactory, "OwnableUnauthorizedAccount");
    });
  });

  describe("Property Queries", function () {
    it("Should return correct property creators", async function () {
      const { propertyFactory, owner, user1 } = await loadFixture(deployContractsFixture);
      
      // Create properties from different accounts
      await propertyFactory.createProperty(
        "Property 1",
        "Description 1",
        "Location 1",
        "https://test.com/image1.jpg",
        ethers.parseUnits("1000", 6)
      );

      await propertyFactory.connect(user1).createProperty(
        "Property 2",
        "Description 2",
        "Location 2",
        "https://test.com/image2.jpg",
        ethers.parseUnits("2000", 6)
      );

      const creators = await propertyFactory.getPropertyCreators();
      expect(creators).to.have.lengthOf(2);
      expect(creators).to.include(owner.address);
      expect(creators).to.include(user1.address);
    });

    it("Should return correct user properties", async function () {
      const { propertyFactory, owner } = await loadFixture(deployContractsFixture);
      
      // Create multiple properties
      await propertyFactory.createProperty(
        "Property 1",
        "Description 1",
        "Location 1",
        "https://test.com/image1.jpg",
        ethers.parseUnits("1000", 6)
      );

      await propertyFactory.createProperty(
        "Property 2",
        "Description 2",
        "Location 2",
        "https://test.com/image2.jpg",
        ethers.parseUnits("2000", 6)
      );

      const properties = await propertyFactory.getUserProperties(owner.address);
      expect(properties).to.have.lengthOf(2);
      expect(properties[0].isApproved).to.be.false;
      expect(properties[1].isApproved).to.be.false;
    });
  });
});
