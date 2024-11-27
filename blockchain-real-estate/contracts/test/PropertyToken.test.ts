import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { PropertyToken, MockEURC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("PropertyToken", function () {
  // Fixture that deploys both MockEURC and PropertyToken
  async function deployTokenFixture() {
    const [owner, buyer1, buyer2] = await ethers.getSigners();

    // Deploy MockEURC first
    const MockEURC = await ethers.getContractFactory("MockEURC");
    const mockEURC = await MockEURC.deploy(owner.address);

    // Property token parameters
    const tokenName = "Luxury Villa Token";
    const tokenSymbol = "LVT";
    const propertyTitle = "Luxury Villa #1";
    const propertyDesc = "Beautiful villa with ocean view";
    const propertyLocation = "123 Ocean Drive";
    const propertyImageUrl = "https://example.com/villa1.jpg";
    const propertyPrice = ethers.parseUnits("10", 6); // 10 EURC per token

    // Deploy PropertyToken
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy(
      tokenName,
      tokenSymbol,
      propertyTitle,
      propertyDesc,
      propertyLocation,
      propertyImageUrl,
      propertyPrice,
      owner.address,
      await mockEURC.getAddress()
    );

    return { 
      propertyToken, 
      mockEURC, 
      owner, 
      buyer1, 
      buyer2,
      tokenName,
      tokenSymbol,
      propertyTitle,
      propertyDesc,
      propertyLocation,
      propertyImageUrl,
      propertyPrice
    };
  }

  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      const { propertyToken, tokenName, tokenSymbol } = await loadFixture(deployTokenFixture);
      expect(await propertyToken.name()).to.equal(tokenName);
      expect(await propertyToken.symbol()).to.equal(tokenSymbol);
    });

    it("Should initialize property details correctly", async function () {
      const { propertyToken, propertyTitle, propertyDesc, propertyLocation, propertyImageUrl, propertyPrice } = 
        await loadFixture(deployTokenFixture);
      
      const details = await propertyToken.getPropertyDetails();
      expect(details.title).to.equal(propertyTitle);
      expect(details.description).to.equal(propertyDesc);
      expect(details.location).to.equal(propertyLocation);
      expect(details.imageUrl).to.equal(propertyImageUrl);
      expect(details.price).to.equal(propertyPrice);
      expect(details.isActive).to.be.true;
    });

    it("Should mint total supply to owner", async function () {
      const { propertyToken, owner } = await loadFixture(deployTokenFixture);
      const TOTAL_SUPPLY = ethers.parseUnits("1000", 18); // 1000 tokens
      expect(await propertyToken.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
    });
  });

  describe("Token Purchase", function () {
    it("Should fail when buyer has insufficient EURC balance", async function () {
      const { propertyToken, mockEURC, buyer1 } = await loadFixture(deployTokenFixture);
      const purchaseAmount = ethers.parseUnits("100", 18); // 100 property tokens
      
      // Calculate required EURC amount (price * amount / 10^12)
      // Since property token has 18 decimals and EURC has 6 decimals
      const eurcAmount = (purchaseAmount * ethers.parseUnits("10", 6)) / BigInt(10 ** 12);
      
      // Approve but don't transfer EURC
      await mockEURC.connect(buyer1).approve(await propertyToken.getAddress(), eurcAmount);
      
      await expect(propertyToken.connect(buyer1).purchaseTokens(purchaseAmount))
        .to.be.revertedWith("Insufficient EURC balance");
    });

    it("Should fail when buyer has insufficient EURC allowance", async function () {
      const { propertyToken, mockEURC, owner, buyer1 } = await loadFixture(deployTokenFixture);
      const purchaseAmount = ethers.parseUnits("100", 18);
      const eurcAmount = (purchaseAmount * ethers.parseUnits("10", 6)) / BigInt(10 ** 12);
      
      // Mint EURC to owner first
      await mockEURC.connect(owner).mint(owner.address, eurcAmount * BigInt(2));
      
      // Give buyer EURC but don't approve spending
      await mockEURC.connect(owner).transfer(buyer1.address, eurcAmount);
      
      await expect(propertyToken.connect(buyer1).purchaseTokens(purchaseAmount))
        .to.be.revertedWith("Insufficient EURC allowance");
    });

    it("Should allow token purchase with correct EURC payment", async function () {
      const { propertyToken, mockEURC, owner, buyer1 } = await loadFixture(deployTokenFixture);
      const purchaseAmount = ethers.parseUnits("100", 18); // 100 property tokens
      const eurcAmount = (purchaseAmount * ethers.parseUnits("10", 6)) / BigInt(10 ** 12); // 1000 EURC
      
      // Mint EURC to owner first
      await mockEURC.connect(owner).mint(owner.address, eurcAmount * BigInt(2));
      
      // Give buyer EURC and approve spending
      await mockEURC.connect(owner).transfer(buyer1.address, eurcAmount);
      await mockEURC.connect(buyer1).approve(await propertyToken.getAddress(), eurcAmount);
      
      // Purchase tokens
      await expect(propertyToken.connect(buyer1).purchaseTokens(purchaseAmount))
        .to.emit(propertyToken, "TokensPurchased")
        .withArgs(buyer1.address, purchaseAmount, eurcAmount);
      
      // Verify balances
      expect(await propertyToken.balanceOf(buyer1.address)).to.equal(purchaseAmount);
    });

    it("Should fail when trying to purchase more tokens than available", async function () {
      const { propertyToken, mockEURC, owner, buyer1 } = await loadFixture(deployTokenFixture);
      const tooManyTokens = ethers.parseUnits("1001", 18); // More than total supply
      const eurcAmount = (tooManyTokens * ethers.parseUnits("10", 6)) / BigInt(10 ** 12);
      
      // Mint EURC to owner first
      await mockEURC.connect(owner).mint(owner.address, eurcAmount * BigInt(2));
      
      // Give buyer EURC and approve spending
      await mockEURC.connect(owner).transfer(buyer1.address, eurcAmount);
      await mockEURC.connect(buyer1).approve(await propertyToken.getAddress(), eurcAmount);
      
      await expect(propertyToken.connect(buyer1).purchaseTokens(tooManyTokens))
        .to.be.revertedWith("Not enough tokens available");
    });
  });

  describe("Token Sale", function () {
    it("Should allow token holder to sell tokens", async function () {
      const { propertyToken, mockEURC, owner, buyer1 } = await loadFixture(deployTokenFixture);
      const tokenAmount = ethers.parseUnits("100", 18);
      const eurcAmount = (tokenAmount * ethers.parseUnits("10", 6)) / BigInt(10 ** 12);
      
      // Mint EURC to owner first
      await mockEURC.connect(owner).mint(owner.address, eurcAmount * BigInt(4)); // Double the amount to ensure enough for sale
      
      // First purchase tokens
      await mockEURC.connect(owner).transfer(buyer1.address, eurcAmount);
      await mockEURC.connect(buyer1).approve(await propertyToken.getAddress(), eurcAmount);
      await propertyToken.connect(buyer1).purchaseTokens(tokenAmount);
      
      // Transfer EURC to PropertyToken contract for paying sellers
      await mockEURC.connect(owner).transfer(await propertyToken.getAddress(), eurcAmount);
      
      // Then sell them
      await expect(propertyToken.connect(buyer1).sellTokens(tokenAmount))
        .to.emit(propertyToken, "TokensSold")
        .withArgs(buyer1.address, tokenAmount, eurcAmount);
      
      expect(await propertyToken.balanceOf(buyer1.address)).to.equal(0);
    });

    it("Should fail when trying to sell more tokens than owned", async function () {
      const { propertyToken, buyer1 } = await loadFixture(deployTokenFixture);
      const tokenAmount = ethers.parseUnits("100", 18);
      
      await expect(propertyToken.connect(buyer1).sellTokens(tokenAmount))
        .to.be.revertedWith("Insufficient token balance");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update property status", async function () {
      const { propertyToken, owner } = await loadFixture(deployTokenFixture);
      
      await propertyToken.connect(owner).setPropertyStatus(false);
      const details = await propertyToken.getPropertyDetails();
      expect(details.isActive).to.be.false;
    });

    it("Should allow owner to update price", async function () {
      const { propertyToken, owner } = await loadFixture(deployTokenFixture);
      const newPrice = ethers.parseUnits("20", 6);
      
      await propertyToken.connect(owner).updatePrice(newPrice);
      expect(await propertyToken.getPrice()).to.equal(newPrice);
    });

    it("Should fail when non-owner tries to update property status", async function () {
      const { propertyToken, buyer1 } = await loadFixture(deployTokenFixture);
      
      await expect(propertyToken.connect(buyer1).setPropertyStatus(false))
        .to.be.revertedWithCustomError(propertyToken, "OwnableUnauthorizedAccount");
    });

    it("Should fail when non-owner tries to update price", async function () {
      const { propertyToken, buyer1 } = await loadFixture(deployTokenFixture);
      const newPrice = ethers.parseUnits("20", 6);
      
      await expect(propertyToken.connect(buyer1).updatePrice(newPrice))
        .to.be.revertedWithCustomError(propertyToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should return correct EURC token address", async function () {
      const { propertyToken, mockEURC } = await loadFixture(deployTokenFixture);
      expect(await propertyToken.getEURCToken()).to.equal(await mockEURC.getAddress());
    });

    it("Should return correct circulating supply", async function () {
      const { propertyToken } = await loadFixture(deployTokenFixture);
      const TOTAL_SUPPLY = ethers.parseUnits("1000", 18);
      expect(await propertyToken.getTotalCirculatingBalance()).to.equal(TOTAL_SUPPLY);
    });
  });
});
