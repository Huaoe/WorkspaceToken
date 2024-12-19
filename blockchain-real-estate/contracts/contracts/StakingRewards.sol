// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title StakingRewards
/// @notice A contract for staking tokens and earning rewards
/// @dev Implements a staking mechanism where users can stake tokens and earn rewards over time
contract StakingRewards {
    /// @notice The token that users can stake
    IERC20 public immutable stakingToken;
    /// @notice The token that users receive as rewards
    IERC20 public immutable rewardsToken;

    /// @notice The address of the contract owner
    address public owner;

    /// @notice Duration of rewards to be paid out (in seconds)
    uint256 public duration;
    /// @notice Timestamp of when the rewards finish
    uint256 public finishAt;
    /// @notice Minimum of last updated time and reward finish time
    uint256 public updatedAt;
    /// @notice Reward to be paid out per second
    uint256 public rewardRate;
    /// @notice Sum of (reward rate * dt * 1e18 / total supply)
    uint256 public rewardPerTokenStored;
    /// @notice Mapping of user address to rewardPerTokenStored
    mapping(address => uint256) public userRewardPerTokenPaid;
    /// @notice Mapping of user address to rewards to be claimed
    mapping(address => uint256) public rewards;

    /// @notice Total amount of tokens staked
    uint256 public totalSupply;
    /// @notice Mapping of user address to staked amount
    mapping(address => uint256) public balanceOf;

    /// @notice Creates a new StakingRewards contract
    /// @param _stakingToken Address of the token that can be staked
    /// @param _rewardToken Address of the token given as rewards
    /// @param _rewardRate Reward rate per second
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate
    ) {
        owner = msg.sender;
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        duration = 0; // Will be set via setRewardsDuration
    }

    /// @notice Restricts function access to contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "not authorized");
        _;
    }

    /// @notice Updates the reward state for an account
    /// @param _account Address of the account to update rewards for
    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        updatedAt = lastTimeRewardApplicable();

        if (_account != address(0)) {
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }

        _;
    }

    /// @notice Returns the last time rewards were applicable
    /// @return Timestamp of when rewards were last applicable
    function lastTimeRewardApplicable() public view returns (uint256) {
        return _min(finishAt, block.timestamp);
    }

    /// @notice Returns the reward per token
    /// @return Reward per token
    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }

        return rewardPerTokenStored
            + (rewardRate * (lastTimeRewardApplicable() - updatedAt) * 1e18)
                / totalSupply;
    }

    /// @notice Stakes a specified amount of tokens
    /// @param _amount Amount of tokens to stake
    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        balanceOf[msg.sender] += _amount;
        totalSupply += _amount;
    }

    /// @notice Withdraws a specified amount of tokens
    /// @param _amount Amount of tokens to withdraw
    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        stakingToken.transfer(msg.sender, _amount);
    }

    /// @notice Returns the amount of rewards earned by an account
    /// @param _account Address of the account to check rewards for
    /// @return Amount of rewards earned
    function earned(address _account) public view returns (uint256) {
        return (
            (
                balanceOf[_account]
                    * (rewardPerToken() - userRewardPerTokenPaid[_account])
            ) / 1e18
        ) + rewards[_account];
    }

    /// @notice Claims rewards for an account
    function getReward() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.transfer(msg.sender, reward);
        }
    }

    /// @notice Sets the duration of rewards
    /// @param _duration New duration of rewards
    function setRewardsDuration(uint256 _duration) external onlyOwner {
        require(
            finishAt < block.timestamp || finishAt == 0,
            "reward duration not finished"
        );
        duration = _duration;
    }

    /// @notice Sets the reward rate directly
    /// @param _rate New reward rate per second
    function setRewardRate(uint256 _rate)
        external
        onlyOwner
        updateReward(address(0))
    {
        require(_rate > 0, "reward rate = 0");
        require(
            _rate * duration <= rewardsToken.balanceOf(address(this)),
            "insufficient rewards"
        );

        rewardRate = _rate;
        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;
    }

    /// @notice Returns the minimum of two values
    /// @param x First value
    /// @param y Second value
    /// @return Minimum of x and y
    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }
}
