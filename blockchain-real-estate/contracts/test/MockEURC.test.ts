import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { MockEURC } from "../typechain-types";

describe("MockEURC Distribution", function () {
  // We define a fixture to reuse the same setup in every test
  async function deployMockEURCFixture() {
    // Get test accounts
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    // Deploy MockEURC
    const MockEURC = await ethers.getContractFactory("MockEURC");
    const mockEURC = await MockEURC.deploy(owner.address);

    return { mockEURC, owner, addr1, addr2, addr3, addr4 };
  }

  describe("Distribution", function () {
    it("Should distribute tokens to test addresses", async function () {
      const { mockEURC, owner, addr1, addr2, addr3, addr4 } = await loadFixture(deployMockEURCFixture);

      // Amount to distribute to each address (1000 EURC)
      const distributionAmount = ethers.parseUnits("1000", 6);

      // Transfer tokens to test addresses
      await mockEURC.transfer(addr1.address, distributionAmount);
      await mockEURC.transfer(addr2.address, distributionAmount);
      await mockEURC.transfer(addr3.address, distributionAmount);
      await mockEURC.transfer(addr4.address, distributionAmount);

      // Verify balances
      expect(await mockEURC.balanceOf(addr1.address)).to.equal(distributionAmount);
      expect(await mockEURC.balanceOf(addr2.address)).to.equal(distributionAmount);
      expect(await mockEURC.balanceOf(addr3.address)).to.equal(distributionAmount);
      expect(await mockEURC.balanceOf(addr4.address)).to.equal(distributionAmount);
    });

    it("Should allow transfers between test addresses", async function () {
      const { mockEURC, addr1, addr2 } = await loadFixture(deployMockEURCFixture);

      // Initial distribution to addr1
      const initialAmount = ethers.parseUnits("1000", 6);
      await mockEURC.transfer(addr1.address, initialAmount);

      // Transfer from addr1 to addr2
      const transferAmount = ethers.parseUnits("500", 6);
      await mockEURC.connect(addr1).transfer(addr2.address, transferAmount);

      // Verify balances
      expect(await mockEURC.balanceOf(addr1.address)).to.equal(initialAmount - transferAmount);
      expect(await mockEURC.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should track total supply correctly", async function () {
      const { mockEURC } = await loadFixture(deployMockEURCFixture);

      const expectedTotalSupply = ethers.parseUnits("1000000", 6); // 1M EURC
      expect(await mockEURC.totalSupply()).to.equal(expectedTotalSupply);
    });

    it("Should handle large number of transfers", async function () {
      const { mockEURC, owner, addr1, addr2 } = await loadFixture(deployMockEURCFixture);

      // Initial distribution
      const initialAmount = ethers.parseUnits("10000", 6);
      await mockEURC.transfer(addr1.address, initialAmount);

      // Perform multiple transfers
      const transferAmount = ethers.parseUnits("100", 6);
      for (let i = 0; i < 10; i++) {
        await mockEURC.connect(addr1).transfer(addr2.address, transferAmount);
        await mockEURC.connect(addr2).transfer(addr1.address, transferAmount / 2n);
      }

      // Final balance for addr1 should be initial amount minus (transferAmount / 2 * 10)
      const expectedAddr1Balance = initialAmount - (transferAmount * 5n);
      expect(await mockEURC.balanceOf(addr1.address)).to.equal(expectedAddr1Balance);

      // Final balance for addr2 should be (transferAmount / 2 * 10)
      const expectedAddr2Balance = transferAmount * 5n;
      expect(await mockEURC.balanceOf(addr2.address)).to.equal(expectedAddr2Balance);
    });
  });

  describe("Permissions", function () {
    it("Should not allow transfers exceeding balance", async function () {
      const { mockEURC, addr1, addr2 } = await loadFixture(deployMockEURCFixture);

      // Try to transfer without any balance
      const transferAmount = ethers.parseUnits("100", 6);
      await expect(
        mockEURC.connect(addr1).transfer(addr2.address, transferAmount)
      ).to.be.revertedWithCustomError(mockEURC, "ERC20InsufficientBalance");
    });

    it("Should allow approved transfers", async function () {
      const { mockEURC, owner, addr1, addr2 } = await loadFixture(deployMockEURCFixture);

      // Initial distribution to addr1
      const initialAmount = ethers.parseUnits("1000", 6);
      await mockEURC.transfer(addr1.address, initialAmount);

      // Approve addr2 to spend addr1's tokens
      const approvalAmount = ethers.parseUnits("500", 6);
      await mockEURC.connect(addr1).approve(addr2.address, approvalAmount);

      // addr2 transfers tokens from addr1
      await mockEURC.connect(addr2).transferFrom(addr1.address, addr2.address, approvalAmount);

      // Verify balances
      expect(await mockEURC.balanceOf(addr1.address)).to.equal(initialAmount - approvalAmount);
      expect(await mockEURC.balanceOf(addr2.address)).to.equal(approvalAmount);
    });
  });
});
