import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { 
    StakingFactory,
    PropertyFactory,
    PropertyToken,
    StakingRewards,
    MockEURC,
    Whitelist
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("StakingFactory", function () {
    let stakingFactory: StakingFactory;
    let propertyFactory: PropertyFactory;
    let mockEURC: MockEURC;
    let propertyToken: PropertyToken;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let staker: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    const rewardsDuration = 365 * 24 * 60 * 60; // 1 year in seconds
    const rewardsAmount = ethers.parseUnits("1000", 6); // 1000 EURC

    const propertyDetails = {
        name: "Test Property Token",
        symbol: "TPT",
        title: "Test Property",
        description: "A test property",
        location: "Test Location",
        imageUrl: "https://test.com/image.jpg",
        price: ethers.parseUnits("100", 6) // 100 EURC
    };

    async function deployContractsFixture() {
        [owner, admin, staker, addr1, addr2] = await ethers.getSigners();

        // Deploy MockEURC
        const MockEURC = await ethers.getContractFactory("MockEURC");
        mockEURC = await MockEURC.deploy(owner.address);
        
        // Mint initial tokens to owner for staking rewards
        await mockEURC.mint(owner.address, ethers.parseUnits("10000", 6));

        // Deploy Whitelist
        const Whitelist = await ethers.getContractFactory("Whitelist");
        const whitelist = await upgrades.deployProxy(Whitelist, [owner.address]);

        // Deploy PropertyFactory
        const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
        propertyFactory = await upgrades.deployProxy(PropertyFactory, [
            "Property Token",  // name prefix
            "PT",             // symbol prefix
            await mockEURC.getAddress(), // payment token
            owner.address,    // admin
            owner.address,    // validator
            await whitelist.getAddress() // whitelist contract
        ]);

        // Deploy StakingFactory
        const StakingFactory = await ethers.getContractFactory("StakingFactory");
        stakingFactory = await StakingFactory.deploy(
            await mockEURC.getAddress(),
            owner.address
        );

        // Add owner to whitelist
        await whitelist.addToWhitelist(owner.address);

        // Create a property token
        await propertyFactory.createProperty(
            propertyDetails.title,
            propertyDetails.description,
            propertyDetails.location,
            propertyDetails.imageUrl,
            propertyDetails.price,
            ethers.parseUnits("100", 18), // totalSupply
            propertyDetails.name,
            propertyDetails.symbol
        );

        // Get the created property token
        const propertyCount = await propertyFactory.getPropertyCount();
        const propertyInfo = await propertyFactory.properties(Number(propertyCount) - 1);
        propertyToken = await ethers.getContractAt("PropertyToken", propertyInfo.tokenAddress);

        // Approve the property
        await propertyFactory.approveProperty(propertyInfo.tokenAddress);
    }

    beforeEach(async function () {
        await loadFixture(deployContractsFixture);
    });

    describe("Deployment", function () {
        it("Should set the correct rewards token", async function () {
            expect(await stakingFactory.rewardsToken()).to.equal(await mockEURC.getAddress());
        });

        it("Should set the correct owner", async function () {
            expect(await stakingFactory.owner()).to.equal(owner.address);
        });
    });

    describe("Creating Staking Rewards", function () {
        it("Should create a new StakingRewards contract", async function () {
            // Transfer tokens to StakingFactory for rewards
            await mockEURC.transfer(await stakingFactory.getAddress(), rewardsAmount);
            
            const tx = await stakingFactory.createStakingRewards(
                await propertyToken.getAddress(),
                rewardsDuration,
                rewardsAmount
            );
            const receipt = await tx.wait();

            // Find StakingRewardsCreated event
            const event = receipt?.logs.find(
                log => log.topics[0] === ethers.id("StakingRewardsCreated(address,address)")
            );
            expect(event).to.not.be.undefined;

            // Verify event parameters
            const propertyTokenAddress = await propertyToken.getAddress();
            expect(event?.topics[1].toLowerCase()).to.equal(
                ethers.zeroPadValue(propertyTokenAddress, 32).toLowerCase()
            );

            // Verify the contract was created and mapped correctly
            const stakingAddress = await stakingFactory.getStakingRewards(propertyTokenAddress);
            expect(stakingAddress).to.not.equal(ethers.ZeroAddress);

            // Verify the StakingRewards contract parameters
            const stakingRewards = await ethers.getContractAt("StakingRewards", stakingAddress) as StakingRewards;
            expect(await stakingRewards.stakingToken()).to.equal(propertyTokenAddress);
            expect(await stakingRewards.rewardsToken()).to.equal(await mockEURC.getAddress());
            expect(await stakingRewards.duration()).to.equal(rewardsDuration);
            expect(await mockEURC.balanceOf(stakingAddress)).to.equal(rewardsAmount);
        });

        it("Should not allow creating duplicate staking contracts", async function () {
            // Transfer tokens for both attempts
            await mockEURC.transfer(await stakingFactory.getAddress(), rewardsAmount * 2n);
            
            // First creation should succeed
            await stakingFactory.createStakingRewards(
                await propertyToken.getAddress(),
                rewardsDuration,
                rewardsAmount
            );

            // Second creation should fail
            await expect(
                stakingFactory.createStakingRewards(
                    await propertyToken.getAddress(),
                    rewardsDuration,
                    rewardsAmount
                )
            ).to.be.revertedWith("Staking already exists");
        });

        it("Should not allow creating staking with zero duration", async function () {
            await mockEURC.transfer(await stakingFactory.getAddress(), rewardsAmount);
            await expect(
                stakingFactory.createStakingRewards(
                    await propertyToken.getAddress(),
                    0,
                    rewardsAmount
                )
            ).to.be.revertedWith("Duration must be greater than 0");
        });

        it("Should not allow creating staking with zero rewards", async function () {
            await expect(
                stakingFactory.createStakingRewards(
                    await propertyToken.getAddress(),
                    rewardsDuration,
                    0
                )
            ).to.be.rejectedWith("reward rate = 0");
        });

        it("Should not allow creating staking with insufficient rewards balance", async function () {
            await expect(
                stakingFactory.createStakingRewards(
                    await propertyToken.getAddress(),
                    rewardsDuration,
                    rewardsAmount
                )
            ).to.be.revertedWith("Insufficient rewards balance");
        });

        it("Should not allow non-owner to create staking contracts", async function () {
            await mockEURC.transfer(await stakingFactory.getAddress(), rewardsAmount);
            await expect(
                stakingFactory.connect(addr1).createStakingRewards(
                    await propertyToken.getAddress(),
                    rewardsDuration,
                    rewardsAmount
                )
            ).to.be.revertedWithCustomError(stakingFactory, "OwnableUnauthorizedAccount")
             .withArgs(addr1.address);
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            // Transfer tokens before creating staking
            await mockEURC.transfer(await stakingFactory.getAddress(), rewardsAmount);
            
            await stakingFactory.createStakingRewards(
                await propertyToken.getAddress(),
                rewardsDuration,
                rewardsAmount
            );
        });

        it("Should return correct staking contract address", async function () {
            const stakingAddress = await stakingFactory.getStakingRewards(await propertyToken.getAddress());
            expect(stakingAddress).to.not.equal(ethers.ZeroAddress);
        });

        it("Should return all staking contracts", async function () {
            const contracts = await stakingFactory.getAllStakingContracts();
            expect(contracts.length).to.equal(1);
            expect(contracts[0]).to.equal(
                await stakingFactory.getStakingRewards(await propertyToken.getAddress())
            );
        });

        it("Should correctly check if staking exists", async function () {
            expect(await stakingFactory.hasStakingRewards(await propertyToken.getAddress())).to.be.true;
            expect(await stakingFactory.hasStakingRewards(ethers.ZeroAddress)).to.be.false;
        });

        it("Should return correct contract count", async function () {
            expect(await stakingFactory.getStakingContractsCount()).to.equal(1);
        });
    });
});
