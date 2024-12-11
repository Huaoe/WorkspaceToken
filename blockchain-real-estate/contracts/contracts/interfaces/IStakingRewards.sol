// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IStakingRewards {
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    function initialize(
        address _admin,
        address _rewardToken,
        address _stakingToken,
        uint256 _rewardRate
    ) external;

    function stake(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getReward() external;
    function exit() external;
    
    function earned(address account) external view returns (uint256);
    function getRewardRate() external view returns (uint256);
    function getTotalStaked() external view returns (uint256);
    function getStakedBalance(address account) external view returns (uint256);
    function updateRewardRate(uint256 _rewardRate) external;
}
