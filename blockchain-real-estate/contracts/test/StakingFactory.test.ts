import { ethers } from "hardhat";
import { expect } from "chai";
import { 
    StakingFactory,
    PropertyFactory,
    PropertyToken,
    StakingRewards,
    MockEURC
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StakingFactory", function () {
    let stakingFactory: StakingFactory;
    let propertyFactory: PropertyFactory;
    let mockEURC: MockEURC;
    let propertyToken: PropertyToken;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    const propertyDetails = {
        name: "Test Property Token",
        symbol: "TPT",
        title: "Test Property",
        description: "A test property",
        location: "Test Location",
        imageUrl: "https://test.com/image.jpg",
        price: ethers.parseUnits("100", 6) // 100 EURC
    };

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy MockEURC
        const MockEURC = await ethers.getContractFactory("MockEURC");
        mockEURC = await MockEURC.deploy(owner.address);

        // Deploy PropertyFactory
        const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
        propertyFactory = await PropertyFactory.deploy();
        await propertyFactory.initialize(
            "Property Token",  // name prefix
            "PT",             // symbol prefix
            await mockEURC.getAddress(), // payment token
            owner.address,    // admin
            owner.address     // validator
        );

        // Deploy StakingFactory
        const StakingFactory = await ethers.getContractFactory("StakingFactory");
        stakingFactory = await StakingFactory.deploy(await mockEURC.getAddress(), owner.address);

        // Create a property token
        await propertyFactory.createProperty(
            propertyDetails.name,
            propertyDetails.symbol,
            propertyDetails.title,
            propertyDetails.description,
            propertyDetails.location,
            propertyDetails.imageUrl,
            propertyDetails.price
        );

        // Get the created property token
        const propertyAddress = (await propertyFactory.getAllProperties())[0];
        propertyToken = await ethers.getContractAt("PropertyToken", propertyAddress) as PropertyToken;

        // Approve the property
        await propertyFactory.approveProperty(propertyAddress);
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
            const tx = await stakingFactory.createStakingRewards(await propertyToken.getAddress());
            const receipt = await tx.wait();

            // Check event emission
            const event = receipt?.logs[0];
            expect(event?.topics[1]).to.include(ethers.zeroPadValue(await propertyToken.getAddress(), 32).slice(2).toLowerCase());

            // Verify the contract was created and mapped correctly
            const stakingAddress = await stakingFactory.getStakingRewards(await propertyToken.getAddress());
            expect(stakingAddress).to.not.equal(ethers.ZeroAddress);

            // Verify the StakingRewards contract parameters
            const stakingRewards = await ethers.getContractAt("StakingRewards", stakingAddress) as StakingRewards;
            expect(await stakingRewards.stakingToken()).to.equal(await propertyToken.getAddress());
            expect(await stakingRewards.rewardsToken()).to.equal(await mockEURC.getAddress());
        });

        it("Should not allow creating duplicate staking contracts", async function () {
            await stakingFactory.createStakingRewards(await propertyToken.getAddress());
            await expect(
                stakingFactory.createStakingRewards(await propertyToken.getAddress())
            ).to.be.revertedWith("Staking already exists");
        });

        it("Should not allow non-owner to create staking contracts", async function () {
            await expect(
                stakingFactory.connect(addr1).createStakingRewards(await propertyToken.getAddress())
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await stakingFactory.createStakingRewards(await propertyToken.getAddress());
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
