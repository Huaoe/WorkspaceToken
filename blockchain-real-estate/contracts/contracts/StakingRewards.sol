// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingRewards is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public duration;
    uint256 public finishAt;
    uint256 public updatedAt;
    uint256 public rewardRate;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _duration
    ) external initializer {
        require(_stakingToken != address(0), "StakingRewards: staking token is zero address");
        require(_rewardToken != address(0), "StakingRewards: reward token is zero address");
        require(_duration > 0, "StakingRewards: duration must be greater than zero");

        __Ownable_init();
        __UUPSUpgradeable_init();

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        duration = _duration;
        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        updatedAt = lastTimeRewardApplicable();

        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        if (block.timestamp > finishAt) {
            return finishAt;
        }
        return block.timestamp;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }

        uint256 timeElapsed = lastTimeRewardApplicable() - updatedAt;
        uint256 rewardAmount = timeElapsed * rewardRate * 1e30;
        uint256 rewardsPerToken = rewardAmount / _totalSupply;
        
        return rewardPerTokenStored + rewardsPerToken;
    }

    function earned(address account) public view returns (uint256) {
        uint256 latestRewardPerToken = rewardPerToken();
        uint256 rewardPerTokenDelta = latestRewardPerToken - userRewardPerTokenPaid[account];
        uint256 newRewards = (_balances[account] * rewardPerTokenDelta) / 1e30;
        return rewards[account] + newRewards;
    }

    function stake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "StakingRewards: amount = 0");
        _totalSupply += amount;
        _balances[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "StakingRewards: amount = 0");
        _totalSupply -= amount;
        _balances[msg.sender] -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function exit() external {
        withdraw(_balances[msg.sender]);
        getReward();
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        require(reward > 0, "StakingRewards: reward = 0");

        if (block.timestamp >= finishAt) {
            rewardRate = reward / duration;
        } else {
            uint256 remaining = finishAt - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / duration;
        }

        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;

        emit RewardAdded(reward);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
