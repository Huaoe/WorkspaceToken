// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract PropertyToken is ERC20, Ownable {
    struct Property {
        string title;
        string description;
        string location;
        string imageUrl;
        uint256 price;  // Price in EURC (6 decimals)
        bool isActive;
    }

    Property public propertyDetails;
    uint256 public constant TOTAL_SUPPLY = 1000 * 10**18; // 1000 tokens
    IERC20 public eurcToken;
    uint256 public constant EURC_DECIMALS = 6;
    
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

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price,
        address initialOwner,
        address _eurcTokenAddress
    ) ERC20(_name, _symbol) Ownable(initialOwner) {
        console.log("Creating PropertyToken with title:", _title);
        console.log("Price:", _price);
        console.log("Initial owner:", initialOwner);
        console.log("EURC token:", _eurcTokenAddress);
        
        // Input validation
        require(bytes(_title).length > 0 && bytes(_title).length <= 20, "Invalid title length");
        require(bytes(_description).length > 0 && bytes(_description).length <= 50, "Invalid description length");
        require(bytes(_location).length > 0 && bytes(_location).length <= 256, "Invalid location length");
        require(bytes(_imageUrl).length > 0 && bytes(_imageUrl).length <= 100, "Invalid image URL length");
        require(_price > 0, "Price must be greater than 0");
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

        eurcToken = IERC20(_eurcTokenAddress);
        _mint(initialOwner, TOTAL_SUPPLY);
        
        emit PropertyTokenized(
            propertyDetails.title,
            propertyDetails.location,
            propertyDetails.price,
            initialOwner
        );
        console.log("PropertyToken created successfully");
    }

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
        uint256 eurcAmount = (_amount * propertyDetails.price) / (10 ** (decimals() - EURC_DECIMALS));
        console.log("Property price (EURC):", propertyDetails.price);
        console.log("Token decimals:", decimals());
        console.log("EURC decimals:", EURC_DECIMALS);
        console.log("Total EURC amount needed:", eurcAmount);
        
        // Check allowance and balance
        uint256 currentAllowance = eurcToken.allowance(msg.sender, address(this));
        uint256 buyerBalance = eurcToken.balanceOf(msg.sender);
        console.log("Buyer's EURC allowance:", currentAllowance);
        console.log("Buyer's EURC balance:", buyerBalance);
        
        require(currentAllowance * 10**6 >= eurcAmount, "Insufficient EURC allowance");
        require(buyerBalance * 10**6 >= eurcAmount, "Insufficient EURC balance");

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

    function sellTokens(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient token balance");

        // Calculate EURC amount to receive
        uint256 eurcAmount = (amount * propertyDetails.price) / (10 ** (decimals() - EURC_DECIMALS));

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

    function updatePrice(uint256 _newPrice) public onlyOwner {
        require(_newPrice > 0, "Price must be greater than 0");
        propertyDetails.price = _newPrice;
    }

    function getEURCToken() public view returns (address) {
        return address(eurcToken);
    }

    function getPrice() public view returns (uint256) {
        return propertyDetails.price;
    }

    /// @dev Returns the total amount of tokens that are currently in circulation.
    /// This is the total supply minus the balance of the zero address.
    function getTotalCirculatingBalance() public view returns (uint256) {
        return totalSupply() - balanceOf(address(0));
    }
}
