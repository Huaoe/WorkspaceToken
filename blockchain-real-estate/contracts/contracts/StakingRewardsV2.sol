// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StakingRewardsV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;
    address public factory;

    uint256 public duration;
    uint256 public finishAt;
    uint256 public updatedAt;
    uint256 public rewardRate;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    bool private _locked;

    error ReentrancyGuard();
    error StakingPeriodNotStarted();
    error StakingPeriodEnded();
    error RewardRateNotSet();
    error InvalidAmount();
    error OnlyFactory();

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _stakingToken,
        address _rewardToken,
        uint256 _duration
    ) public initializer {
        require(_stakingToken != address(0), "Staking token address cannot be 0");
        require(_rewardToken != address(0), "Reward token address cannot be 0");
        require(_duration > 0, "Duration must be > 0");
        
        __Ownable_init();
        __UUPSUpgradeable_init();

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        duration = _duration;
        factory = msg.sender;
        
        // Initialize staking period
        updatedAt = block.timestamp;
        finishAt = block.timestamp + _duration;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Only allow the factory to upgrade the implementation
        if (msg.sender != factory) revert OnlyFactory();
    }

    modifier nonReentrant() {
        if (_locked) revert ReentrancyGuard();
        _locked = true;
        _;
        _locked = false;
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

    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    modifier whenStakingStarted() {
        if (block.timestamp > finishAt) revert StakingPeriodEnded();
        if (rewardRate == 0) revert RewardRateNotSet();
        _;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return _min(finishAt, block.timestamp);
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }

        return rewardPerTokenStored + (
            (lastTimeRewardApplicable() - updatedAt) * rewardRate * 1e18 / _totalSupply
        );
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) whenStakingStarted {
        if (amount == 0) revert InvalidAmount();
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        _balances[msg.sender] += amount;
        _totalSupply += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert InvalidAmount();
        _balances[msg.sender] -= amount;
        _totalSupply -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function earned(address account) public view returns (uint256) {
        return (
            _balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18
        ) + rewards[account];
    }

    function getReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function notifyRewardRate(uint256 rate) external onlyFactory updateReward(address(0)) {
        if (rate == 0) revert InvalidAmount();
        rewardRate = rate;
        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;
        emit RewardRateUpdated(rate);
        emit RewardAdded(rate * duration);
    }

    function setDuration(uint256 _duration) external onlyFactory {
        if (_duration == 0) revert InvalidAmount();
        if (finishAt >= block.timestamp) revert StakingPeriodNotStarted();
        duration = _duration;
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }
}