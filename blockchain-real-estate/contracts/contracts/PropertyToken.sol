// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "hardhat/console.sol";
import "./Whitelist.sol";
import "./interfaces/IWhitelist.sol";

/// @title PropertyToken
/// @notice This contract represents a tokenized real estate property
/// @dev Inherits from ERC20Upgradeable and OwnableUpgradeable for proxy support
contract PropertyToken is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @notice Structure containing all property details
    struct PropertyDetails {
        string title;
        string description;
        string location;
        string imageUrl;
        uint256 price; // Price in EURC (6 decimals)
        bool isActive;
    }

    /// @notice Structure for initialization parameters
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

    // Custom errors
    error InsufficientBalance();
    error NotWhitelisted();
    error InvalidAmount();
    error PropertyInactive();
    error InsufficientAllowance();
    error TransferFailed();

    PropertyDetails public propertyDetails;
    IERC20 public eurcToken;
    uint256 public constant EURC_DECIMALS = 6;
    address public whitelistContract;

    event PropertyTokenized(
        string title,
        string location,
        uint256 price,
        address indexed owner
    );

    event TokensPurchased(
        address indexed buyer,
        uint256 amount,
        uint256 eurcPaid
    );

    event TokensSold(
        address indexed seller,
        uint256 amount,
        uint256 eurcReceived
    );

    event PropertyStatusUpdated(bool isActive);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Initializes the PropertyToken contract
    /// @dev This replaces the constructor for proxy deployment
    function initialize(InitParams memory params) public initializer {
        console.log("Initializing PropertyToken with params:");
        console.log("Name:", params.name);
        console.log("Symbol:", params.symbol);
        console.log("Title:", params.title);
        console.log("Description:", params.description);
        console.log("Location:", params.location);
        console.log("Image URL:", params.imageUrl);
        console.log("Price:", params.price);
        console.log("Total Supply:", params.totalSupply);
        console.log("Initial Owner:", params.initialOwner);
        console.log("EURC Token:", params.eurcTokenAddress);
        console.log("Whitelist:", params.whitelistContract);

        // Validate parameters first
        console.log("Validating parameters...");
        require(bytes(params.name).length > 0, "Token name cannot be empty");
        require(bytes(params.name).length <= 100, "Token name too long");
        require(bytes(params.symbol).length > 0, "Token symbol cannot be empty");
        require(bytes(params.symbol).length <= 10, "Token symbol too long");
        
        require(bytes(params.title).length > 0, "Title cannot be empty");
        require(bytes(params.title).length <= 100, "Title too long");
        
        require(bytes(params.description).length > 0, "Description cannot be empty");
        require(bytes(params.description).length <= 500, "Description too long");
        
        require(bytes(params.location).length > 0, "Location cannot be empty");
        require(bytes(params.location).length <= 256, "Location too long");
        
        require(bytes(params.imageUrl).length > 0, "Image URL cannot be empty");
        require(bytes(params.imageUrl).length <= 500, "Image URL too long");
        
        require(params.price > 0, "Price must be greater than 0");
        require(params.totalSupply > 0, "Total supply must be greater than 0");
        require(params.totalSupply <= 1000000 * 10**18, "Total supply exceeds maximum limit");
        
        require(params.initialOwner != address(0), "Initial owner cannot be zero address");
        require(params.eurcTokenAddress != address(0), "EURC token address cannot be zero address");
        require(params.whitelistContract != address(0), "Whitelist contract cannot be zero address");

        // Initialize ERC20 and Ownable
        console.log("Initializing ERC20...");
        __ERC20_init(params.name, params.symbol);
        console.log("Initializing Ownable...");
        __Ownable_init(params.initialOwner);

        // Validate contract interfaces
        console.log("Validating EURC token contract...");
        try IERC20(params.eurcTokenAddress).totalSupply() returns (uint256) {
            console.log("EURC token contract verified");
        } catch {
            revert("Invalid EURC token contract");
        }

        console.log("Validating whitelist contract...");
        try IWhitelist(params.whitelistContract).isWhitelisted(params.initialOwner) returns (bool isWhitelisted) {
            console.log("Initial owner whitelist status:", isWhitelisted);
            require(isWhitelisted, "Initial owner is not whitelisted");
            console.log("Whitelist contract verified");
        } catch {
            revert("Invalid whitelist contract");
        }

        console.log("Setting property details...");
        propertyDetails = PropertyDetails({
            title: params.title,
            description: params.description,
            location: params.location,
            imageUrl: params.imageUrl,
            price: params.price,
            isActive: true
        });

        console.log("Setting contract references...");
        eurcToken = IERC20(params.eurcTokenAddress);
        whitelistContract = params.whitelistContract;

        console.log("Minting initial supply...");
        _mint(params.initialOwner, params.totalSupply);

        console.log("Emitting PropertyTokenized event...");
        emit PropertyTokenized(
            params.title,
            params.location,
            params.price,
            params.initialOwner
        );

        console.log("PropertyToken initialization complete");
    }

    /// @notice Allows users to purchase tokens
    /// @param _amount Amount of tokens to purchase
    function purchaseTokens(uint256 _amount) external {
        if (!Whitelist(whitelistContract).isWhitelisted(msg.sender)) {
            revert NotWhitelisted();
        }
        if (!propertyDetails.isActive) {
            revert PropertyInactive();
        }
        if (_amount == 0) {
            revert InvalidAmount();
        }

        // Calculate EURC amount needed
        uint256 eurcAmount = (_amount * propertyDetails.price) / (10 ** decimals());
        
        // Check EURC balance first
        if (eurcToken.balanceOf(msg.sender) < eurcAmount) {
            revert InsufficientBalance();
        }

        uint256 ownerBalance = balanceOf(owner());
        if (_amount > ownerBalance) {
            revert InsufficientBalance();
        }

        // Check allowance
        if (eurcToken.allowance(msg.sender, address(this)) < eurcAmount) {
            revert InsufficientAllowance();
        }

        // Transfer EURC from buyer to token owner
        bool success = eurcToken.transferFrom(msg.sender, owner(), eurcAmount);
        if (!success) {
            revert TransferFailed();
        }

        // Transfer property tokens to buyer
        _transfer(owner(), msg.sender, _amount);

        emit TokensPurchased(msg.sender, _amount, eurcAmount);
    }

    /// @notice Allows users to sell tokens
    /// @param amount Amount of tokens to sell
    function sellTokens(uint256 amount) external {
        if (amount == 0) {
            revert InvalidAmount();
        }
        if (balanceOf(msg.sender) < amount) {
            revert InsufficientBalance();
        }

        // Calculate EURC amount to receive
        uint256 eurcAmount = (amount * propertyDetails.price) / (10 ** decimals());

        // Burn the property tokens
        _burn(msg.sender, amount);

        // Transfer EURC to seller
        bool success = eurcToken.transfer(msg.sender, eurcAmount);
        if (!success) {
            revert TransferFailed();
        }

        emit TokensSold(msg.sender, amount, eurcAmount);
    }

    /// @notice Updates the property's active status
    /// @param status New status to set
    function updatePropertyStatus(bool status) external onlyOwner {
        propertyDetails.isActive = status;
        emit PropertyStatusUpdated(status);
    }
}
