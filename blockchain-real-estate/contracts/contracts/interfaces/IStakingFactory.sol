// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IStakingFactory {
    struct StakingInfo {
        address stakingAddress;
        address propertyToken;
        uint256 rewardRate;
        uint256 totalStaked;
    }

    event StakingCreated(
        address indexed stakingAddress,
        address indexed propertyToken,
        uint256 rewardRate
    );

    function initialize(
        address _admin,
        address _rewardToken
    ) external;

    function createStaking(
        address _propertyToken,
        uint256 _rewardRate
    ) external returns (address);

    function getStakingInfo(address _stakingAddress) external view returns (StakingInfo memory);
    function getAllStakingContracts() external view returns (address[] memory);
    function isValidStakingContract(address _stakingAddress) external view returns (bool);
}
