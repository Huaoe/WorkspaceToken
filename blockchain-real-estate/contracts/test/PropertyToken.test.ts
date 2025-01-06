import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("PropertyToken", function () {
  async function deployTokenFixture() {
    const [owner, buyer1, buyer2] = await ethers.getSigners();

    // Deploy MockEURC
    const MockEURC = await ethers.getContractFactory("MockEURC");
    const mockEURC = await MockEURC.deploy(owner.address);
    await mockEURC.waitForDeployment();

    // Deploy Whitelist
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const whitelist = await upgrades.deployProxy(Whitelist, [owner.address]);
    await whitelist.waitForDeployment();

    // Add owner to whitelist - This is crucial for PropertyToken initialization
    await whitelist.addToWhitelist(owner.address);

    // Property token parameters
    const propertyTitle = "Luxury Villa";
    const propertyDescription = "Beautiful villa by the sea";
    const propertyLocation = "123 Ocean Drive";
    const propertyImageUrl = "https://example.com/villa1.jpg";
    const propertyPrice = ethers.parseUnits("10", 6); // 10 EURC per token
    const totalSupply = ethers.parseUnits("1000", 18); // 1000 tokens with 18 decimals
    const propertyTokenName = "Property Token";
    const propertyTokenSymbol = "PT";

    // Deploy PropertyToken
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await upgrades.deployProxy(PropertyToken, [{
      name: propertyTokenName,
      symbol: propertyTokenSymbol,
      title: propertyTitle,
      description: propertyDescription,
      location: propertyLocation,
      imageUrl: propertyImageUrl,
      price: propertyPrice,
      totalSupply: totalSupply,
      initialOwner: owner.address,
      eurcTokenAddress: await mockEURC.getAddress(),
      whitelistContract: await whitelist.getAddress()
    }]);
    await propertyToken.waitForDeployment();

    // Mint enough EURC to buyers and property token contract for testing
    const eurcAmount = ethers.parseUnits("10000", 6); // 10,000 EURC
    await mockEURC.mint(buyer1.address, eurcAmount);
    await mockEURC.mint(buyer2.address, eurcAmount);
    await mockEURC.mint(await propertyToken.getAddress(), eurcAmount); // For handling sales

    // Approve PropertyToken to spend EURC
    await mockEURC.connect(buyer1).approve(await propertyToken.getAddress(), eurcAmount);
    await mockEURC.connect(buyer2).approve(await propertyToken.getAddress(), eurcAmount);

    return { 
      propertyToken, 
      mockEURC, 
      whitelist,
      owner, 
      buyer1, 
      buyer2,
      propertyTitle,
      propertyDescription,
      propertyLocation,
      propertyImageUrl,
      propertyPrice,
      totalSupply
    };
  }

  describe("Deployment", function () {
    it("Should mint total supply to owner", async function () {
      const { propertyToken, owner, totalSupply } = await loadFixture(deployTokenFixture);
      expect(await propertyToken.balanceOf(owner.address)).to.equal(totalSupply);
    });
  });

  describe("Token Purchase", function () {
    it("Should fail when buyer has insufficient EURC balance", async function () {
      const { propertyToken, mockEURC, buyer1, whitelist, owner, propertyPrice } = await loadFixture(deployTokenFixture);
      
      // Add buyer to whitelist
      await whitelist.addToWhitelist(buyer1.address);
      
      // Reset buyer's EURC balance to a small amount
      await mockEURC.connect(buyer1).transfer(owner.address, await mockEURC.balanceOf(buyer1.address));
      await mockEURC.mint(buyer1.address, ethers.parseUnits("5", 6)); // Only 5 EURC
      
      const purchaseAmount = ethers.parseUnits("1", 18); // Try to buy 1 token (costs 10 EURC)
      await expect(propertyToken.connect(buyer1).purchaseTokens(purchaseAmount))
        .to.be.revertedWithCustomError(propertyToken, "InsufficientBalance");
    });

    it("Should not allow non-whitelisted addresses to purchase tokens", async function () {
      const { propertyToken, buyer1 } = await loadFixture(deployTokenFixture);
      const purchaseAmount = ethers.parseUnits("100", 18);

      await expect(propertyToken.connect(buyer1).purchaseTokens(purchaseAmount))
        .to.be.revertedWithCustomError(propertyToken, "NotWhitelisted");
    });

    it("Should allow whitelisted addresses to purchase tokens", async function () {
      const { propertyToken, mockEURC, whitelist, buyer1, propertyPrice } = await loadFixture(deployTokenFixture);
      
      // Add buyer to whitelist
      await whitelist.addToWhitelist(buyer1.address);
      
      const purchaseAmount = ethers.parseUnits("10", 18); 
      const totalCost = (purchaseAmount * propertyPrice) / ethers.parseUnits("1", 18);
      
      // Approve EURC spending
      await mockEURC.connect(buyer1).approve(await propertyToken.getAddress(), totalCost);
      
      // Purchase tokens
      await expect(propertyToken.connect(buyer1).purchaseTokens(purchaseAmount))
        .to.not.be.reverted;

      expect(await propertyToken.balanceOf(buyer1.address)).to.equal(purchaseAmount);
    });
  });

  describe("Token Sale", function () {
    it("Should allow token holder to sell tokens", async function () {
      const { propertyToken, mockEURC, whitelist, buyer1, owner, propertyPrice } = await loadFixture(deployTokenFixture);
      
      // Add buyer to whitelist
      await whitelist.addToWhitelist(buyer1.address);
      
      const purchaseAmount = ethers.parseUnits("10", 18);
      const totalCost = (purchaseAmount * propertyPrice) / ethers.parseUnits("1", 18);
      
      // First purchase tokens
      await propertyToken.connect(buyer1).purchaseTokens(purchaseAmount);

      // Owner needs to approve EURC for selling
      await mockEURC.connect(owner).approve(await propertyToken.getAddress(), totalCost);
      
      // Then sell them back
      await expect(propertyToken.connect(buyer1).sellTokens(purchaseAmount))
        .to.not.be.reverted;
      
      expect(await propertyToken.balanceOf(buyer1.address)).to.equal(0);
    });

    it("Should fail when trying to sell more tokens than owned", async function () {
      const { propertyToken, buyer1 } = await loadFixture(deployTokenFixture);
      const tokenAmount = ethers.parseUnits("100", 18);
      
      await expect(propertyToken.connect(buyer1).sellTokens(tokenAmount))
        .to.be.revertedWithCustomError(propertyToken, "InsufficientBalance");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update property status", async function () {
      const { propertyToken, owner } = await loadFixture(deployTokenFixture);
      await propertyToken.connect(owner).updatePropertyStatus(false);
      const details = await propertyToken.propertyDetails();
      expect(details.isActive).to.be.false;
    });

    it("Should not allow non-owner to update property status", async function () {
      const { propertyToken, buyer1 } = await loadFixture(deployTokenFixture);
      await expect(propertyToken.connect(buyer1).updatePropertyStatus(true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
