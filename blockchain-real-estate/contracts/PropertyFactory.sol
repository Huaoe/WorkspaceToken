// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PropertyToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract PropertyFactory is Ownable {
    struct PropertyInfo {
        address tokenAddress;
        bool isApproved;
    }

    mapping(address => PropertyInfo[]) public userProperties;
    mapping(address => bool) public approvedProperties;
    
    event PropertySubmitted(address indexed owner, address indexed tokenAddress);
    event PropertyApproved(address indexed tokenAddress);
    event PropertyRejected(address indexed tokenAddress);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createProperty(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price
    ) public returns (address) {
        console.log("Creating property with title:", _title);
        console.log("Description:", _description);
        console.log("Location:", _location);
        console.log("Image URL:", _imageUrl);
        console.log("Price:", _price);
        console.log("Sender:", msg.sender);
        
        // Input validation with detailed error messages
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_title).length <= 20, "Title too long (max 20 chars)");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_description).length <= 50, "Description too long (max 50 chars)");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(bytes(_location).length <= 20, "Location too long (max 20 chars)");
        require(bytes(_imageUrl).length > 0, "Image URL cannot be empty");
        require(bytes(_imageUrl).length <= 100, "Image URL too long (max 100 chars)");
        require(_price > 0, "Price must be greater than 0");
        require(msg.sender != address(0), "Invalid sender address");
        
        PropertyToken newProperty = new PropertyToken(
            _title,
            _description,
            _location,
            _imageUrl,
            _price,
            msg.sender
        );
        
        address propertyAddress = address(newProperty);
        console.log("Property token created at:", propertyAddress);
        
        userProperties[msg.sender].push(PropertyInfo({
            tokenAddress: propertyAddress,
            isApproved: false
        }));
        
        emit PropertySubmitted(msg.sender, propertyAddress);
        return propertyAddress;
    }

    function approveProperty(address _propertyAddress) public onlyOwner {
        require(!approvedProperties[_propertyAddress], "Property already approved");
        
        approvedProperties[_propertyAddress] = true;
        PropertyToken(_propertyAddress).setPropertyStatus(true);
        
        emit PropertyApproved(_propertyAddress);
    }

    function rejectProperty(address _propertyAddress) public onlyOwner {
        require(!approvedProperties[_propertyAddress], "Property already approved");
        
        PropertyToken(_propertyAddress).setPropertyStatus(false);
        
        emit PropertyRejected(_propertyAddress);
    }

    function getUserProperties(address _user) public view returns (PropertyInfo[] memory) {
        return userProperties[_user];
    }

    function isPropertyApproved(address _propertyAddress) public view returns (bool) {
        return approvedProperties[_propertyAddress];
    }
}
