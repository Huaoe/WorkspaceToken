// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract PropertyToken is ERC20, Ownable {
    struct Property {
        string title;
        string description;
        string location;
        string imageUrl;
        uint256 price;
        bool isActive;
    }

    Property public propertyDetails;
    uint256 public constant TOTAL_SUPPLY = 1000 * 10**18; // 1000 tokens
    
    event PropertyTokenized(
        string title,
        string location,
        uint256 price,
        address indexed owner
    );

    constructor(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price,
        address initialOwner
    ) ERC20("Property Token", "PROP") Ownable(initialOwner) {
        console.log("Creating PropertyToken with title:", _title);
        console.log("Price:", _price);
        console.log("Initial owner:", initialOwner);
        
        // Input validation
        require(bytes(_title).length > 0 && bytes(_title).length <= 20, "Invalid title length");
        require(bytes(_description).length > 0 && bytes(_description).length <= 50, "Invalid description length");
        require(bytes(_location).length > 0 && bytes(_location).length <= 20, "Invalid location length");
        require(bytes(_imageUrl).length > 0 && bytes(_imageUrl).length <= 100, "Invalid image URL length");
        require(_price > 0, "Price must be greater than 0");
        require(initialOwner != address(0), "Invalid owner address");

        propertyDetails = Property({
            title: _title,
            description: _description,
            location: _location,
            imageUrl: _imageUrl,
            price: _price,
            isActive: true
        });

        _mint(initialOwner, TOTAL_SUPPLY);
        
        emit PropertyTokenized(_title, _location, _price, initialOwner);
        console.log("PropertyToken created successfully");
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
}
