// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./StakingRewards.sol";

contract StakingFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    struct StakingContractInfo {
        address contractAddress;
        uint256 rewardRate;
        uint256 duration;
        bool isActive;
    }

    IERC20 public eurcToken;
    mapping(address => StakingContractInfo) public stakingContracts;
    mapping(address => address[]) public propertyStakingContracts;
    address[] public allStakingContracts;

    event StakingContractCreated(address indexed propertyToken, address stakingContract);
    event StakingContractFunded(address indexed stakingContract, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _eurcToken) public initializer {
        require(_eurcToken != address(0), "StakingFactory: EURC token is zero address");
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        eurcToken = IERC20(_eurcToken);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function createStakingContract(
        address propertyToken,
        uint256 rewardAmount,
        uint256 rewardsDuration
    ) external onlyOwner returns (address) {
        require(propertyToken != address(0), "StakingFactory: property token is zero address");
        require(!stakingContracts[propertyToken].isActive, "StakingFactory: staking contract already exists for this property token");

        // Deploy implementation
        StakingRewards stakingImplementation = new StakingRewards();

        // Create initialization data
        bytes memory initData = abi.encodeWithSelector(
            StakingRewards.initialize.selector,
            propertyToken,
            address(eurcToken),
            rewardAmount,
            rewardsDuration
        );

        // Deploy proxy
        address proxy = address(new ERC1967Proxy(
            address(stakingImplementation),
            initData
        ));

        // Store the staking contract info
        stakingContracts[propertyToken] = StakingContractInfo({
            contractAddress: proxy,
            rewardRate: rewardAmount,
            duration: rewardsDuration,
            isActive: true
        });

        // Store in arrays for enumeration
        propertyStakingContracts[propertyToken].push(proxy);
        allStakingContracts.push(proxy);

        emit StakingContractCreated(propertyToken, proxy);
        return proxy;
    }

    function fundContract(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(eurcToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit StakingContractFunded(address(this), amount);
    }

    function getStakingContracts(address propertyToken) external view returns (address[] memory) {
        return propertyStakingContracts[propertyToken];
    }

    function getAllStakingContracts() external view returns (address[] memory) {
        return allStakingContracts;
    }
}
