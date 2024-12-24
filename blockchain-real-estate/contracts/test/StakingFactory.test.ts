import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { 
    StakingFactory,
    PropertyFactory,
    MockEURCUpgradeable,
    Whitelist
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("StakingFactory", function () {
    let stakingFactory: StakingFactory;
    let propertyFactory: PropertyFactory;
    let mockEURC: MockEURCUpgradeable;
    let propertyToken: any;
    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let staker: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    const rewardsDuration = 365 * 24 * 60 * 60; // 1 year in seconds
    const rewardRate = 1000000000n; // 1 billion units per second
    const rewardsAmount = rewardRate * BigInt(rewardsDuration); // Total rewards needed

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
        const MockEURC = await ethers.getContractFactory("MockEURCUpgradeable");
        mockEURC = await upgrades.deployProxy(MockEURC, [owner.address], {
            initializer: "initialize",
            kind: 'transparent'
        }) as unknown as MockEURCUpgradeable;
        
        // Mint initial tokens to owner for staking rewards
        await mockEURC.mint(owner.address, rewardsAmount);

        // Deploy Whitelist
        const Whitelist = await ethers.getContractFactory("Whitelist");
        const whitelist = await upgrades.deployProxy(Whitelist, [owner.address]);

        // Deploy PropertyFactory
        const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
        propertyFactory = (await upgrades.deployProxy(PropertyFactory, [
            owner.address,    // validator
            await whitelist.getAddress(), // whitelist contract
            await mockEURC.getAddress()  // EURC token
        ])) as unknown as PropertyFactory;

        // Deploy StakingFactory
        const StakingFactory = await ethers.getContractFactory("StakingFactory");
        stakingFactory = (await upgrades.deployProxy(StakingFactory, [
            await mockEURC.getAddress()
        ], {
            initializer: "initialize",
            kind: 'uups'
        })) as unknown as StakingFactory;

        // Add owner and staker to whitelist
        await whitelist.addToWhitelist(owner.address);
        await whitelist.addToWhitelist(staker.address);

        // Create a property token
        await propertyFactory.createProperty(
            propertyDetails.name,     // _tokenName
            propertyDetails.symbol,   // _tokenSymbol
            propertyDetails.title,    // _title
            propertyDetails.description, // _description
            propertyDetails.location, // _location
            propertyDetails.imageUrl, // _imageUrl
            propertyDetails.price,    // _price
            ethers.parseUnits("100", 18) // _totalSupply
        );

        // Get the created property token
        const propertyCount = await propertyFactory.getPropertyCount();
        const propertyInfo = await propertyFactory.properties(Number(propertyCount) - 1);
        propertyToken = await ethers.getContractAt("PropertyToken", propertyInfo.tokenAddress);

        // Approve the property
        await propertyFactory.approveProperty(propertyInfo.tokenAddress);

        // Transfer some tokens to the staker for testing
        const transferAmount = ethers.parseUnits("50", 18); // Transfer 50 tokens
        await propertyToken.transfer(staker.address, transferAmount);

        // Approve tokens for staking
        await propertyToken.connect(staker).approve(await stakingFactory.getAddress(), transferAmount);

        return { stakingFactory, propertyFactory, mockEURC, propertyToken, whitelist };
    }

    beforeEach(async function () {
        const { stakingFactory: sf, propertyFactory: pf, mockEURC: me, propertyToken: pt } = await loadFixture(deployContractsFixture);
        stakingFactory = sf;
        propertyFactory = pf;
        mockEURC = me;
        propertyToken = pt;
    });

    describe("Deployment", function () {
        it("Should set the correct EURC token", async function () {
            expect(await stakingFactory.eurcToken()).to.equal(await mockEURC.getAddress());
        });

        it("Should set the correct owner", async function () {
            expect(await stakingFactory.owner()).to.equal(owner.address);
        });
    });

    describe("Creating Staking Rewards", function () {
        beforeEach(async function() {
            // Fund the factory with rewards
            await mockEURC.approve(await stakingFactory.getAddress(), rewardsAmount);
            await stakingFactory.fundContract(rewardsAmount);
        });

        it("Should create a new StakingRewards contract", async function () {
            // Create staking contract
            const tx = await stakingFactory.createStakingContract(
                await propertyToken.getAddress(),
                rewardRate,
                rewardsDuration
            );
            const receipt = await tx.wait();

            // Get the StakingContractCreated event
            const event = receipt?.logs.find(
                (log: any) => log.fragment?.name === "StakingContractCreated"
            );
            expect(event).to.not.be.undefined;

            // Verify the staking contract was created correctly
            const stakingInfo = await stakingFactory.stakingContracts(await propertyToken.getAddress());
            expect(stakingInfo.contractAddress).to.not.equal(ethers.ZeroAddress);

            // Verify the staking contract parameters
            const stakingContract = await ethers.getContractAt("StakingRewards", stakingInfo.contractAddress);
            expect(await stakingContract.stakingToken()).to.equal(await propertyToken.getAddress());
            expect(await stakingContract.rewardToken()).to.equal(await mockEURC.getAddress());
        });

        it("Should fail if property token is zero address", async function () {
            await expect(stakingFactory.createStakingContract(
                ethers.ZeroAddress,
                rewardRate,
                rewardsDuration
            )).to.be.revertedWith("StakingFactory: property token is zero address");
        });

        it("Should fail if staking contract already exists", async function () {
            // Create first staking contract
            await stakingFactory.createStakingContract(
                await propertyToken.getAddress(),
                rewardRate,
                rewardsDuration
            );

            // Try to create another staking contract for the same property token
            await expect(stakingFactory.createStakingContract(
                await propertyToken.getAddress(),
                rewardRate,
                rewardsDuration
            )).to.be.revertedWith("StakingFactory: staking contract already exists for this property token");
        });

        it("Should fail if called by non-owner", async function () {
            await expect(stakingFactory.connect(addr1).createStakingContract(
                await propertyToken.getAddress(),
                rewardRate,
                rewardsDuration
            )).to.be.revertedWithCustomError(stakingFactory, "OwnableUnauthorizedAccount")
              .withArgs(addr1.address);
        });
    });
});
