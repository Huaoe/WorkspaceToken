// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./StakingRewardsV2.sol";

interface IUUPSUpgradeable {
    function upgradeTo(address newImplementation) external;
    function upgradeToAndCall(address newImplementation, bytes memory data) external payable;
}

contract StakingFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    struct StakingContractInfo {
        address contractAddress;
        uint256 rewardRate;
        uint256 duration;
        bool isActive;
    }

    IERC20 public eurcToken;
    address public stakingImplementation;
    mapping(address => StakingContractInfo) public stakingContracts;
    mapping(address => address[]) public propertyStakingContracts;
    address[] public allStakingContracts;

    event StakingContractCreated(address indexed propertyToken, address stakingContract);
    event StakingContractFunded(address indexed stakingContract, uint256 amount);
    event RewardRateUpdated(address indexed stakingContract, uint256 newRate);
    event ImplementationUpgraded(address oldImpl, address newImpl);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _eurcToken) public initializer {
        require(_eurcToken != address(0), "StakingFactory: EURC token is zero address");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        eurcToken = IERC20(_eurcToken);
        
        // Deploy initial implementation
        stakingImplementation = address(new StakingRewardsV2());
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function upgradeImplementation() external onlyOwner {
        address oldImpl = stakingImplementation;
        
        // Deploy new implementation
        address newImpl = address(new StakingRewardsV2());
        stakingImplementation = newImpl;

        // Upgrade all existing proxies
        for (uint i = 0; i < allStakingContracts.length; i++) {
            address proxy = allStakingContracts[i];
            // Use the UUPS upgrade pattern
            IUUPSUpgradeable(proxy).upgradeTo(newImpl);
        }

        emit ImplementationUpgraded(oldImpl, newImpl);
    }

    function createStakingContract(
        address propertyToken,
        uint256 rewardRate,
        uint256 rewardsDuration
    ) external onlyOwner returns (address) {
        require(propertyToken != address(0), "StakingFactory: property token is zero address");
        require(!stakingContracts[propertyToken].isActive, "StakingFactory: staking contract already exists for this property token");
        require(rewardRate > 0, "StakingFactory: reward rate must be greater than 0");
        require(stakingImplementation != address(0), "StakingFactory: implementation not set");

        // Create initialization data
        bytes memory initData = abi.encodeWithSelector(
            StakingRewardsV2.initialize.selector,
            propertyToken,
            address(eurcToken),
            rewardsDuration
        );

        // Deploy proxy
        address proxy = address(new ERC1967Proxy(
            stakingImplementation,
            initData
        ));

        // Store the staking contract info
        stakingContracts[propertyToken] = StakingContractInfo({
            contractAddress: proxy,
            rewardRate: rewardRate,
            duration: rewardsDuration,
            isActive: true
        });

        // Store in arrays for enumeration
        propertyStakingContracts[propertyToken].push(proxy);
        allStakingContracts.push(proxy);

        // Set initial reward rate
        StakingRewardsV2(proxy).notifyRewardRate(rewardRate);

        emit StakingContractCreated(propertyToken, proxy);
        return proxy;
    }

    function updateRewardRate(address propertyToken, uint256 newRate) external onlyOwner {
        require(stakingContracts[propertyToken].isActive, "StakingFactory: staking contract does not exist");
        require(newRate > 0, "StakingFactory: reward rate must be greater than 0");
        
        StakingContractInfo storage info = stakingContracts[propertyToken];
        require(info.contractAddress != address(0), "StakingFactory: invalid staking contract");

        // Update the stored rate
        info.rewardRate = newRate;

        // Update the rate in the staking contract
        StakingRewardsV2(info.contractAddress).notifyRewardRate(newRate);

        emit RewardRateUpdated(info.contractAddress, newRate);
    }

    function fundStakingContract(address propertyToken, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakingContracts[propertyToken].isActive, "StakingFactory: staking contract does not exist");
        
        StakingContractInfo memory info = stakingContracts[propertyToken];
        require(info.contractAddress != address(0), "StakingFactory: invalid staking contract");

        // Transfer EURC tokens from sender to staking contract
        eurcToken.safeTransferFrom(msg.sender, info.contractAddress, amount);

        emit StakingContractFunded(info.contractAddress, amount);
    }

    function getStakingContracts(address propertyToken) external view returns (address[] memory) {
        return propertyStakingContracts[propertyToken];
    }

    function getAllStakingContracts() external view returns (address[] memory) {
        return allStakingContracts;
    }
}