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
    /// @param stakingToken Address of the PropertyToken
    /// @param stakingRewards Address of the created StakingRewards contract
    event StakingRewardsCreated(
        address indexed stakingToken,
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
    /// @param _stakingToken Address of the PropertyToken contract
    /// @param _duration Duration of the staking period
    /// @param _rewardAmount Total reward amount
    /// @return Address of the created StakingRewards contract
    function createStakingRewards(
        address _stakingToken,
        uint256 _duration,
        uint256 _rewardAmount
    ) external onlyOwner returns (address) {
        require(_stakingToken != address(0), "Invalid property token");
        require(_duration > 0, "Duration must be greater than 0");
        require(_rewardAmount > 0, "Reward amount must be > 0");
        require(propertyToStaking[_stakingToken] == address(0), "Staking already exists");

        // Calculate reward rate per second
        uint256 _rewardRate = _rewardAmount / _duration;
        require(_rewardRate > 0, "Reward rate = 0");

        // Check rewards balance
        require(rewardsToken.balanceOf(address(this)) >= _rewardAmount, "Insufficient rewards balance");

        // Verify it's a valid PropertyToken
        try PropertyToken(_stakingToken).eurcToken() returns (IERC20 eurcToken) {
            require(address(eurcToken) == address(rewardsToken), "Invalid property token");
        } catch {
            revert("Invalid property token");
        }

        // Create new StakingRewards contract
        StakingRewards stakingRewards = new StakingRewards(
            _stakingToken,    // stakingToken (PropertyToken)
            address(rewardsToken),      // rewardsToken (EURC)
            _rewardRate       // reward rate per second
        );

        // Initialize rewards parameters
        stakingRewards.setRewardsDuration(_duration);

        // Transfer rewards to the staking contract
        require(rewardsToken.transfer(address(stakingRewards), _rewardAmount), "Rewards transfer failed");

        // Store the mapping
        propertyToStaking[_stakingToken] = address(stakingRewards);
        stakingContracts.push(address(stakingRewards));

        emit StakingRewardsCreated(_stakingToken, address(stakingRewards));
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
