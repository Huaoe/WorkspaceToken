import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ZeroAddress } from "ethers";
import { Whitelist } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Whitelist", function () {
  async function deployWhitelistFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const Whitelist = await ethers.getContractFactory("Whitelist");
    const whitelist = await upgrades.deployProxy(Whitelist, [owner.address]);

    return { whitelist, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { whitelist, owner } = await loadFixture(deployWhitelistFixture);
      expect(await whitelist.owner()).to.equal(owner.address);
    });

    it("Should initialize with empty whitelist", async function () {
      const { whitelist, addr1 } = await loadFixture(deployWhitelistFixture);
      expect(await whitelist.isWhitelisted(addr1.address)).to.be.false;
      expect(await whitelist.getWhitelistedAddresses()).to.be.empty;
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to add addresses", async function () {
      const { whitelist, addr1, addr2 } = await loadFixture(deployWhitelistFixture);
      await expect(whitelist.connect(addr1).addToWhitelist(addr2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to remove addresses", async function () {
      const { whitelist, addr1, addr2 } = await loadFixture(deployWhitelistFixture);
      await expect(whitelist.connect(addr1).removeFromWhitelist(addr2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Adding to Whitelist", function () {
    it("Should add a single address to whitelist", async function () {
      const { whitelist, addr1 } = await loadFixture(deployWhitelistFixture);
      await whitelist.addToWhitelist(addr1.address);
      expect(await whitelist.isWhitelisted(addr1.address)).to.be.true;
      expect(await whitelist.getWhitelistedAddresses()).to.include(addr1.address);
    });

    it("Should not add zero address", async function () {
      const { whitelist } = await loadFixture(deployWhitelistFixture);
      await expect(whitelist.addToWhitelist(ZeroAddress))
        .to.be.revertedWithCustomError(whitelist, "InvalidAddress");
    });

    it("Should not add already whitelisted address", async function () {
      const { whitelist, addr1 } = await loadFixture(deployWhitelistFixture);
      await whitelist.addToWhitelist(addr1.address);
      await expect(whitelist.addToWhitelist(addr1.address))
        .to.be.revertedWithCustomError(whitelist, "AddressAlreadyWhitelisted");
    });

    it("Should add multiple addresses in batch", async function () {
      const { whitelist, addr1, addr2, addr3 } = await loadFixture(deployWhitelistFixture);
      const addresses = [addr1.address, addr2.address, addr3.address];
      await whitelist.addBatchToWhitelist(addresses);

      // Check each address is whitelisted
      for (const addr of addresses) {
        expect(await whitelist.isWhitelisted(addr)).to.be.true;
      }

      // Verify the whitelisted addresses array contains all addresses
      const whitelistedAddresses = await whitelist.getWhitelistedAddresses();
      expect(whitelistedAddresses).to.have.lengthOf(addresses.length);
      for (const addr of addresses) {
        expect(whitelistedAddresses).to.include(addr);
      }
    });
  });

  describe("Removing from Whitelist", function () {
    it("Should remove a single address from whitelist", async function () {
      const { whitelist, addr1 } = await loadFixture(deployWhitelistFixture);
      await whitelist.addToWhitelist(addr1.address);
      await whitelist.removeFromWhitelist(addr1.address);
      expect(await whitelist.isWhitelisted(addr1.address)).to.be.false;
    });

    it("Should not remove non-whitelisted address", async function () {
      const { whitelist, addr1 } = await loadFixture(deployWhitelistFixture);
      await expect(whitelist.removeFromWhitelist(addr1.address))
        .to.be.revertedWithCustomError(whitelist, "AddressNotWhitelisted");
    });

    it("Should remove multiple addresses in batch", async function () {
      const { whitelist, addr1, addr2 } = await loadFixture(deployWhitelistFixture);
      const addresses = [addr1.address, addr2.address];
      
      // First add addresses to whitelist
      await whitelist.addBatchToWhitelist(addresses);
      
      // Then remove them
      await whitelist.removeBatchFromWhitelist(addresses);

      // Verify addresses are removed
      for (const addr of addresses) {
        expect(await whitelist.isWhitelisted(addr)).to.be.false;
      }

      // Verify whitelisted addresses array is empty
      expect(await whitelist.getWhitelistedAddresses()).to.be.empty;
    });
  });

  describe("Events", function () {
    it("Should emit event when adding to whitelist", async function () {
      const { whitelist, addr1 } = await loadFixture(deployWhitelistFixture);
      await expect(whitelist.addToWhitelist(addr1.address))
        .to.emit(whitelist, "AddressWhitelisted")
        .withArgs(addr1.address);
    });

    it("Should emit event when removing from whitelist", async function () {
      const { whitelist, addr1 } = await loadFixture(deployWhitelistFixture);
      await whitelist.addToWhitelist(addr1.address);
      await expect(whitelist.removeFromWhitelist(addr1.address))
        .to.emit(whitelist, "AddressRemovedFromWhitelist")
        .withArgs(addr1.address);
    });

    it("Should emit batch events", async function () {
      const { whitelist, addr1, addr2, addr3 } = await loadFixture(deployWhitelistFixture);
      const addresses = [addr1.address, addr2.address, addr3.address];
      
      // Check batch add events
      const addTx = await whitelist.addBatchToWhitelist(addresses);
      const addReceipt = await addTx.wait();
      
      // Verify individual AddressWhitelisted events
      const addEvents = addReceipt?.logs.filter(
        log => log.fragment?.name === "AddressWhitelisted"
      );
      expect(addEvents).to.have.lengthOf(addresses.length);
      
      // Verify BatchWhitelistAdded event
      const batchAddEvent = addReceipt?.logs.find(
        log => log.fragment?.name === "BatchWhitelistAdded"
      );
      expect(batchAddEvent).to.not.be.undefined;
    });
  });
});
