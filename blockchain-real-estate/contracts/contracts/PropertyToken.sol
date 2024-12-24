// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IWhitelist.sol";

contract PropertyToken is 
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    error NotWhitelisted();
    error PropertyInactive();
    error InsufficientEURCBalance();
    error InsufficientBalance();
    error InsufficientPropertyTokenBalance();

    struct PropertyDetails {
        string title;
        string description;
        string location;
        string imageUrl;
        uint256 price;
        bool isActive;
    }

    PropertyDetails public propertyDetails;
    IERC20 public eurcToken;
    address public whitelistContract;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 eurcAmount);
    event TokensSold(address indexed seller, uint256 amount, uint256 eurcAmount);
    event PropertyStatusUpdated(bool status);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    struct InitParams {
        string name;
        string symbol;
        string title;
        string description;
        string location;
        string imageUrl;
        uint256 price;
        uint256 totalSupply;
        address initialOwner;
        address eurcTokenAddress;
        address whitelistContract;
    }

    function initialize(InitParams calldata params) public initializer {
        __ERC20_init(params.name, params.symbol);
        __Ownable_init(params.initialOwner);
        __UUPSUpgradeable_init();

        propertyDetails = PropertyDetails({
            title: params.title,
            description: params.description,
            location: params.location,
            imageUrl: params.imageUrl,
            price: params.price,
            isActive: true
        });

        eurcToken = IERC20(params.eurcTokenAddress);
        whitelistContract = params.whitelistContract;

        // Mint tokens to tx.origin (the creator) instead of the owner (PropertyFactory)
        _mint(tx.origin, params.totalSupply);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Purchase property tokens with EURC
    /// @param amount Amount of property tokens to purchase
    function purchaseTokens(uint256 amount) external {
        // Check if buyer is whitelisted
        if (!IWhitelist(whitelistContract).isWhitelisted(msg.sender)) {
            revert NotWhitelisted();
        }

        // Check if property is active
        if (!propertyDetails.isActive) {
            revert PropertyInactive();
        }

        // Calculate EURC amount needed
        uint256 eurcAmount = (amount * propertyDetails.price) / (10 ** decimals());

        // Check if buyer has enough EURC
        if (eurcToken.balanceOf(msg.sender) < eurcAmount) {
            revert InsufficientBalance();
        }

        // Transfer EURC from buyer to owner
        require(eurcToken.transferFrom(msg.sender, owner(), eurcAmount), "EURC transfer failed");

        // Transfer property tokens to buyer
        _transfer(owner(), msg.sender, amount);

        emit TokensPurchased(msg.sender, amount, eurcAmount);
    }

    /// @notice Sell property tokens back for EURC
    /// @param amount Amount of property tokens to sell
    function sellTokens(uint256 amount) external {
        // Check if seller has enough tokens
        if (balanceOf(msg.sender) < amount) {
            revert InsufficientBalance();
        }

        // Check if seller is whitelisted
        if (!IWhitelist(whitelistContract).isWhitelisted(msg.sender)) {
            revert NotWhitelisted();
        }

        // Calculate EURC amount to receive
        uint256 eurcAmount = (amount * propertyDetails.price) / (10 ** decimals());

        // Check if owner has enough EURC
        if (eurcToken.balanceOf(owner()) < eurcAmount) {
            revert InsufficientEURCBalance();
        }

        // Transfer property tokens to owner
        _transfer(msg.sender, owner(), amount);

        // Transfer EURC from owner to seller
        require(eurcToken.transferFrom(owner(), msg.sender, eurcAmount), "EURC transfer failed");

        emit TokensSold(msg.sender, amount, eurcAmount);
    }

    /// @notice Update the property status (active/inactive)
    /// @param status New status to set
    function updatePropertyStatus(bool status) external onlyOwner {
        propertyDetails.isActive = status;
        emit PropertyStatusUpdated(status);
    }

    // Override approve to check whitelist
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        if (!IWhitelist(whitelistContract).isWhitelisted(msg.sender)) {
            revert NotWhitelisted();
        }
        if (!propertyDetails.isActive) {
            revert PropertyInactive();
        }
        return super.approve(spender, amount);
    }

    // Override _update to check whitelist
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (from != address(0) && to != address(0)) { // Skip minting and burning
            if (!IWhitelist(whitelistContract).isWhitelisted(from)) {
                revert NotWhitelisted();
            }
            if (!IWhitelist(whitelistContract).isWhitelisted(to)) {
                revert NotWhitelisted();
            }
            if (!propertyDetails.isActive) {
                revert PropertyInactive();
            }
        }
        super._update(from, to, amount);
    }
}
