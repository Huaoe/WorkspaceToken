// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

/// @title PropertyToken
/// @notice This contract represents a tokenized real estate property
/// @dev Inherits from ERC20 and Ownable for token functionality and access control
contract PropertyToken is ERC20, Ownable {
    /// @notice Structure containing all property details
    /// @param title Name of the property
    /// @param description Detailed description of the property
    /// @param location Physical location of the property
    /// @param imageUrl URL to the property's image
    /// @param price Price in EURC (6 decimals)
    /// @param isActive Whether the property is currently active for trading
    struct Property {
        string title;
        string description;
        string location;
        string imageUrl;
        uint256 price; // Price in EURC (6 decimals)
        bool isActive;
    }

    Property public propertyDetails;
    uint256 public immutable totalSupply_;
    IERC20 public eurcToken;
    uint256 public constant EURC_DECIMALS = 6;

    event PropertyTokenized(
        string title,
        string location,
        uint256 price,
        address indexed owner
    );

    /// @notice Emitted when tokens are purchased
    /// @param buyer Address of the token buyer
    /// @param amount Amount of tokens purchased
    /// @param eurcPaid Amount of EURC paid for the tokens
    event TokensPurchased(
        address indexed buyer,
        uint256 amount,
        uint256 eurcPaid
    );

    /// @notice Emitted when tokens are sold
    /// @param seller Address of the token seller
    /// @param amount Amount of tokens sold
    /// @param eurcReceived Amount of EURC received for the tokens
    event TokensSold(
        address indexed seller,
        uint256 amount,
        uint256 eurcReceived
    );

    /// @notice Creates a new PropertyToken contract
    /// @param _name Name of the token
    /// @param _symbol Symbol of the token
    /// @param _title Title of the property
    /// @param _description Description of the property
    /// @param _location Location of the property
    /// @param _imageUrl URL of the property image
    /// @param _price Price of the property in EURC
    /// @param _totalSupply Total supply of tokens
    /// @param initialOwner Address of the initial owner
    /// @param _eurcTokenAddress Address of the EURC token contract
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price,
        uint256 _totalSupply,
        address initialOwner,
        address _eurcTokenAddress
    ) ERC20(_name, _symbol) Ownable(initialOwner) {
        console.log("Creating PropertyToken with title:", _title);
        console.log("Price:", _price);
        console.log("Total supply:", _totalSupply);
        console.log("Initial owner:", initialOwner);
        console.log("EURC token:", _eurcTokenAddress);

        // Input validation
        require(
            bytes(_title).length > 0 && bytes(_title).length <= 20,
            "Invalid title length"
        );
        require(
            bytes(_description).length > 0 && bytes(_description).length <= 50,
            "Invalid description length"
        );
        require(
            bytes(_location).length > 0 && bytes(_location).length <= 256,
            "Invalid location length"
        );
        require(
            bytes(_imageUrl).length > 0 && bytes(_imageUrl).length <= 100,
            "Invalid image URL length"
        );
        require(_price > 0, "Price must be greater than 0");
        require(_totalSupply > 0, "Total supply must be greater than 0");
        require(initialOwner != address(0), "Invalid owner address");
        require(_eurcTokenAddress != address(0), "Invalid EURC token address");

        propertyDetails = Property({
            title: _title,
            description: _description,
            location: _location,
            imageUrl: _imageUrl,
            price: _price,
            isActive: true
        });

        totalSupply_ = _totalSupply;
        eurcToken = IERC20(_eurcTokenAddress);

        // Mint all tokens to the contract owner
        _mint(initialOwner, _totalSupply);

        emit PropertyTokenized(_title, _location, _price, initialOwner);
        console.log("PropertyToken created successfully");
    }

    /// @notice Allows users to purchase tokens
    /// @param _amount Amount of tokens to purchase
    function purchaseTokens(uint256 _amount) external {
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

        // Calculate EURC amount needed (considering 6 decimals for EURC)
        uint256 eurcAmount = (_amount * propertyDetails.price) /
            (10 ** (decimals() - EURC_DECIMALS));
        console.log("=== Debug EURC Amount Calculation ===");
        console.log("Input amount (wei):", _amount);
        console.log("Property price (EURC with 6 decimals):", propertyDetails.price);
        console.log("Token decimals:", decimals());
        console.log("EURC decimals:", EURC_DECIMALS);
        console.log("Decimal adjustment:", 10 ** (decimals() - EURC_DECIMALS));
        console.log("Calculated EURC amount:", eurcAmount);

        // Check allowance and balance
        uint256 currentAllowance = eurcToken.allowance(
            msg.sender,
            address(this)
        );
        uint256 buyerBalance = eurcToken.balanceOf(msg.sender);
        console.log("=== Debug Allowance and Balance ===");
        console.log("Current allowance (6 decimals):", currentAllowance);
        console.log("Buyer balance (6 decimals):", buyerBalance);
        console.log("Required amount (raw):", eurcAmount);
        console.log("Allowance check:", currentAllowance * 10 ** 6);
        console.log("Balance check:", buyerBalance * 10 ** 6);

        require(
            currentAllowance * 10 ** 6 >= eurcAmount,
            "Insufficient EURC allowance"
        );
        require(
            buyerBalance * 10 ** 6 >= eurcAmount,
            "Insufficient EURC balance"
        );

        console.log("=== Debug Transfer ===");
        console.log("Transfer amount (6 decimals):", eurcAmount / 10 ** 6);
        console.log("Transferring EURC from buyer to owner...");
        console.log("From:", msg.sender);
        console.log("To:", owner());
        console.log("Amount (EURC):", eurcAmount);

        // Transfer EURC from buyer to token owner
        require(
            eurcToken.transferFrom(msg.sender, owner(), eurcAmount / 10 ** 6),
            "EURC transfer failed"
        );
        console.log("EURC transfer successful");

        console.log("Transferring property tokens to buyer...");
        // Transfer property tokens to buyer
        _transfer(owner(), msg.sender, _amount);
        console.log("Property token transfer successful");

        emit TokensPurchased(
            msg.sender,
            _amount / 10 ** 6,
            eurcAmount / 10 ** 6
        );
        console.log("=== purchaseTokens completed successfully ===");
    }

    /// @notice Allows users to sell tokens
    /// @param amount Amount of tokens to sell
    function sellTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient token balance");

        // Calculate EURC amount to receive
        uint256 eurcAmount = (amount * propertyDetails.price) /
            (10 ** (decimals() - EURC_DECIMALS));

        // Burn the property tokens
        _burn(msg.sender, amount);

        // Transfer EURC to seller
        require(
            eurcToken.transfer(msg.sender, eurcAmount),
            "EURC transfer failed"
        );

        emit TokensSold(msg.sender, amount, eurcAmount);
    }

    function getPropertyDetails()
        public
        view
        returns (
            string memory title,
            string memory description,
            string memory location,
            string memory imageUrl,
            uint256 price,
            bool isActive
        )
    {
        return (
            propertyDetails.title,
            propertyDetails.description,
            propertyDetails.location,
            propertyDetails.imageUrl,
            propertyDetails.price,
            propertyDetails.isActive
        );
    }

    /// @notice Sets the property status
    /// @param _isActive Whether the property is currently active for trading
    function setPropertyStatus(bool _isActive) public onlyOwner {
        propertyDetails.isActive = _isActive;
    }

    /// @notice Updates the property price
    /// @param _newPrice New price of the property in EURC
    function updatePrice(uint256 _newPrice) public onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        propertyDetails.price = _newPrice;
    }

    /// @notice Returns the EURC token address
    /// @return Address of the EURC token contract
    function getEURCToken() public view returns (address) {
        return address(eurcToken);
    }

    /// @notice Returns the property price
    /// @return Price of the property in EURC
    function getPrice() public view returns (uint256) {
        return propertyDetails.price;
    }

    /// @notice Returns the total circulating balance of tokens
    /// @return Total amount of tokens in circulation
    function getTotalCirculatingBalance() public view returns (uint256) {
        return totalSupply() - balanceOf(address(0));
    }
}
