// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StakingRewards.sol";
import "./PropertyToken.sol";

/// @title StakingFactory
/// @notice Factory contract for creating StakingRewards contracts for PropertyTokens
/// @dev Creates and manages StakingRewards contracts for each PropertyToken
contract StakingFactory is Ownable {
    /// @notice EURC token used for rewards
    IERC20 public immutable rewardsToken;

    /// @notice Mapping from PropertyToken address to its StakingRewards contract
    mapping(address => address) public propertyToStaking;
    
    /// @notice Array of all created StakingRewards contracts
    address[] public stakingContracts;

    /// @notice Emitted when a new StakingRewards contract is created
    /// @param propertyToken Address of the PropertyToken
    /// @param stakingRewards Address of the created StakingRewards contract
    event StakingRewardsCreated(
        address indexed propertyToken,
        address indexed stakingRewards
    );

    /// @notice Constructor sets the rewards token (EURC)
    /// @param _rewardsToken Address of the EURC token contract
    /// @param initialOwner Address of the initial owner
    constructor(address _rewardsToken, address initialOwner) Ownable(initialOwner) {
        require(_rewardsToken != address(0), "Invalid rewards token");
        rewardsToken = IERC20(_rewardsToken);
    }

    /// @notice Creates a new StakingRewards contract for a PropertyToken
    /// @param propertyToken Address of the PropertyToken contract
    /// @return Address of the created StakingRewards contract
    function createStakingRewards(address propertyToken) external onlyOwner returns (address) {
        require(propertyToken != address(0), "Invalid property token");
        require(propertyToStaking[propertyToken] == address(0), "Staking already exists");

        // Verify it's a valid PropertyToken
        PropertyToken token = PropertyToken(propertyToken);
        require(token.getEURCToken() == address(rewardsToken), "Invalid property token");

        // Create new StakingRewards contract
        StakingRewards stakingRewards = new StakingRewards(
            address(token),    // stakingToken (PropertyToken)
            address(rewardsToken)  // rewardsToken (EURC)
        );

        // Initialize rewards parameters
        uint256 rewardsDuration = 365 days; // 1 year duration
        uint256 rewardsAmount = 1000 * 10**6; // 1000 EURC (6 decimals)

        // Transfer rewards to staking contract
        require(
            rewardsToken.transfer(address(stakingRewards), rewardsAmount),
            "Failed to transfer rewards"
        );

        // Initialize rewards parameters
        stakingRewards.setRewardsDuration(rewardsDuration);
        stakingRewards.notifyRewardAmount(rewardsAmount);

        // Store the mapping
        propertyToStaking[propertyToken] = address(stakingRewards);
        stakingContracts.push(address(stakingRewards));

        emit StakingRewardsCreated(propertyToken, address(stakingRewards));
        return address(stakingRewards);
    }

    /// @notice Returns the StakingRewards contract for a PropertyToken
    /// @param propertyToken Address of the PropertyToken
    /// @return Address of the associated StakingRewards contract
    function getStakingRewards(address propertyToken) external view returns (address) {
        return propertyToStaking[propertyToken];
    }

    /// @notice Returns all created StakingRewards contracts
    /// @return Array of StakingRewards contract addresses
    function getAllStakingContracts() external view returns (address[] memory) {
        return stakingContracts;
    }

    /// @notice Checks if a StakingRewards contract exists for a PropertyToken
    /// @param propertyToken Address of the PropertyToken
    /// @return True if a StakingRewards contract exists
    function hasStakingRewards(address propertyToken) external view returns (bool) {
        return propertyToStaking[propertyToken] != address(0);
    }

    /// @notice Returns the number of StakingRewards contracts created
    /// @return Number of StakingRewards contracts
    function getStakingContractsCount() external view returns (uint256) {
        return stakingContracts.length;
    }
}
