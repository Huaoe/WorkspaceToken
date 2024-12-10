// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "hardhat/console.sol";
import "./Whitelist.sol";

/// @title PropertyToken
/// @notice This contract represents a tokenized real estate property
/// @dev Inherits from ERC20Upgradeable and OwnableUpgradeable for proxy support
contract PropertyToken is ERC20Upgradeable, OwnableUpgradeable {
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

    PropertyDetails public propertyDetails;
    uint256 public totalSupply_;
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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the PropertyToken contract
    /// @dev This replaces the constructor for proxy deployment
    function initialize(InitParams memory params) public initializer {
        __ERC20_init(params.name, params.symbol);
        __Ownable_init(params.initialOwner);

        console.log("Initializing PropertyToken with title:", params.title);
        console.log("Price:", params.price);
        console.log("Total supply:", params.totalSupply);
        console.log("Initial owner:", params.initialOwner);
        console.log("EURC token:", params.eurcTokenAddress);
        console.log("Whitelist contract:", params.whitelistContract);

        require(
            bytes(params.title).length > 0 && bytes(params.title).length <= 20,
            "Invalid title length"
        );
        require(
            bytes(params.description).length > 0 && bytes(params.description).length <= 50,
            "Invalid description length"
        );
        require(
            bytes(params.location).length > 0 && bytes(params.location).length <= 256,
            "Invalid location length"
        );
        require(
            bytes(params.imageUrl).length > 0 && bytes(params.imageUrl).length <= 100,
            "Invalid image URL length"
        );
        require(params.price > 0, "Price must be greater than 0");
        require(params.totalSupply > 0, "Total supply must be greater than 0");
        require(params.initialOwner != address(0), "Invalid owner address");
        require(params.eurcTokenAddress != address(0), "Invalid EURC token address");
        require(params.whitelistContract != address(0), "Invalid whitelist contract address");

        propertyDetails = PropertyDetails({
            title: params.title,
            description: params.description,
            location: params.location,
            imageUrl: params.imageUrl,
            price: params.price,
            isActive: true
        });

        totalSupply_ = params.totalSupply;
        eurcToken = IERC20(params.eurcTokenAddress);
        whitelistContract = params.whitelistContract;

        // Mint all tokens to the contract owner with 18 decimals
        _mint(params.initialOwner, params.totalSupply * 10**18);

        emit PropertyTokenized(params.title, params.location, params.price, params.initialOwner);
        console.log("PropertyToken initialized successfully");
    }

    /// @notice Modifier to check if the caller is whitelisted
    modifier onlyWhitelisted() {
        require(Whitelist(whitelistContract).isAddressWhitelisted(msg.sender), "Address not whitelisted");
        _;
    }

    /// @notice Allows users to purchase tokens
    /// @param _amount Amount of tokens to purchase
    function purchaseTokens(uint256 _amount) external onlyWhitelisted {
        console.log("=== Starting purchaseTokens ===");
        console.log("Buyer address:", msg.sender);
        console.log("Requested token amount:", _amount);
        console.log("Current owner:", owner());
        console.log("Contract address:", address(this));

        require(propertyDetails.isActive, "Property is not active");
        require(_amount > 0, "Amount must be greater than 0");

        uint256 ownerBalance = balanceOf(owner());
        console.log("Owner's token balance:", ownerBalance);
        require(_amount <= ownerBalance, "Not enough tokens available");

        // Calculate EURC amount needed
        uint256 eurcAmount = (_amount * propertyDetails.price) / (10 ** 18);
        
        console.log("=== Debug EURC Amount Calculation ===");
        console.log("Input amount (wei):", _amount);
        console.log("Property price (EURC with 6 decimals):", propertyDetails.price);
        console.log("Token decimals:", decimals());
        console.log("EURC decimals:", EURC_DECIMALS);
        console.log("Calculated EURC amount (6 decimals):", eurcAmount);

        // Check allowance and balance
        uint256 currentAllowance = eurcToken.allowance(msg.sender, address(this));
        uint256 buyerBalance = eurcToken.balanceOf(msg.sender);
        
        console.log("=== Debug Allowance and Balance ===");
        console.log("Current allowance:", currentAllowance);
        console.log("Required EURC amount:", eurcAmount);
        console.log("Buyer EURC balance:", buyerBalance);

        require(currentAllowance >= eurcAmount, "Insufficient EURC allowance");
        require(buyerBalance >= eurcAmount, "Insufficient EURC balance");

        console.log("=== Debug Transfer ===");
        console.log("Transfer amount (6 decimals):", eurcAmount);
        console.log("Transferring EURC from buyer to owner...");
        console.log("From:", msg.sender);
        console.log("To:", owner());
        console.log("Amount (EURC):", eurcAmount);

        // Transfer EURC from buyer to token owner
        require(eurcToken.transferFrom(msg.sender, owner(), eurcAmount), "EURC transfer failed");
        console.log("EURC transfer successful");

        console.log("Transferring property tokens to buyer...");
        // Transfer property tokens to buyer
        _transfer(owner(), msg.sender, _amount);
        console.log("Property token transfer successful");

        emit TokensPurchased(msg.sender, _amount, eurcAmount);
        console.log("=== purchaseTokens completed successfully ===");
    }

    /// @notice Allows users to sell tokens
    /// @param amount Amount of tokens to sell
    function sellTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient token balance");

        // Calculate EURC amount to receive
        uint256 eurcAmount = (amount * propertyDetails.price) / (10 ** decimals());

        // Burn the property tokens
        _burn(msg.sender, amount);

        // Transfer EURC to seller
        require(eurcToken.transfer(msg.sender, eurcAmount), "EURC transfer failed");

        emit TokensSold(msg.sender, amount, eurcAmount);
    }

    function getPropertyDetails() public view returns (
        string memory title,
        string memory description,
        string memory location,
        string memory imageUrl,
        uint256 price,
        bool isActive
    ) {
        return (
            propertyDetails.title,
            propertyDetails.description,
            propertyDetails.location,
            propertyDetails.imageUrl,
            propertyDetails.price,
            propertyDetails.isActive
        );
    }

    function setPropertyStatus(bool _isActive) public onlyOwner {
        propertyDetails.isActive = _isActive;
    }

    function getEURCToken() public view returns (address) {
        return address(eurcToken);
    }

    /// @notice Returns the property price
    /// @return uint256 The price of the property in EURC
    function getPrice() public view returns (uint256) {
        return propertyDetails.price;
    }
}
