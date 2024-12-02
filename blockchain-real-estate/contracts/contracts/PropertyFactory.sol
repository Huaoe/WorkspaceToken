// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PropertyToken.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

/// @title PropertyFactory
/// @notice Factory contract for creating and managing PropertyToken contracts
/// @dev Implements upgradeable pattern and access control
contract PropertyFactory is Initializable, OwnableUpgradeable {
    /// @notice Structure containing property token information
    /// @param tokenAddress Address of the PropertyToken contract
    /// @param isApproved Approval status of the property
    struct PropertyInfo {
        address tokenAddress;
        bool isApproved;
    }

    mapping(address => PropertyInfo[]) public userProperties;
    mapping(address => bool) public approvedProperties;
    address[] private propertyCreators;
    address public eurcTokenAddress;
    string public name;
    string public symbol;
    address public admin;
    address public validator;
    address public paymentToken;
    
    /// @notice Emitted when a new property is submitted for approval
    /// @param owner Address of the property owner
    /// @param tokenAddress Address of the created PropertyToken contract
    event PropertySubmitted(address indexed owner, address indexed tokenAddress);
    
    /// @notice Emitted when a property is approved
    /// @param tokenAddress Address of the approved PropertyToken contract
    event PropertyApproved(address indexed tokenAddress);
    
    /// @notice Emitted when a property is rejected
    /// @param tokenAddress Address of the rejected PropertyToken contract
    event PropertyRejected(address indexed tokenAddress);
    
    /// @notice Emitted when the EURC token address is updated
    /// @param newAddress New address of the EURC token
    event EURCTokenUpdated(address indexed newAddress);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the PropertyFactory contract
    /// @param _name Name prefix for created PropertyTokens
    /// @param _symbol Symbol prefix for created PropertyTokens
    /// @param _paymentToken Address of the payment token (EURC)
    /// @param _admin Address of the admin
    /// @param _validator Address of the validator
    function initialize(
        string memory _name,
        string memory _symbol,
        address _paymentToken,
        address _admin,
        address _validator
    ) public initializer {
        console.log("Initializing PropertyFactory");
        require(_paymentToken != address(0), "Invalid payment token address");
        require(_admin != address(0), "Invalid admin address");
        require(_validator != address(0), "Invalid validator address");
        
        __Ownable_init(_admin);
        
        name = _name;
        symbol = _symbol;
        paymentToken = _paymentToken;
        admin = _admin;
        validator = _validator;
        eurcTokenAddress = _paymentToken;
    }

    /// @notice Creates a new PropertyToken contract
    /// @param _title Title of the property
    /// @param _description Description of the property
    /// @param _location Location of the property
    /// @param _imageUrl URL of the property image
    /// @param _price Price of the property
    /// @param _name Name of the PropertyToken
    /// @param _symbol Symbol of the PropertyToken
    /// @return Address of the created PropertyToken contract
    function createProperty(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price,
        string memory _name,
        string memory _symbol
    ) public returns (address) {
        console.log("Creating property with title:", _title);
        console.log("Description:", _description);
        console.log("Location:", _location);
        console.log("Image URL:", _imageUrl);
        console.log("Price:", _price);
        console.log("Token Name:", _name);
        console.log("Token Symbol:", _symbol);
        console.log("Sender:", msg.sender);
        
        // Input validation with detailed error messages
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(bytes(_imageUrl).length > 0, "Image URL cannot be empty");
        require(bytes(_name).length > 0, "Token name cannot be empty");
        require(bytes(_symbol).length > 0, "Token symbol cannot be empty");
        require(_price > 0, "Price must be greater than 0");

        // Create new property token with EURC support
        PropertyToken newProperty = new PropertyToken(
            _name,
            _symbol,
            _title,
            _description,
            _location,
            _imageUrl,
            _price,
            msg.sender,
            eurcTokenAddress
        );

        address tokenAddress = address(newProperty);
        console.log("Created property token at address:", tokenAddress);
        
        // Store property info under the actual creator's address
        userProperties[msg.sender].push(PropertyInfo({
            tokenAddress: tokenAddress,
            isApproved: false
        }));

        // Add creator to list if not already present
        bool creatorExists = false;
        for (uint i = 0; i < propertyCreators.length; i++) {
            if (propertyCreators[i] == msg.sender) {
                creatorExists = true;
                break;
            }
        }
        if (!creatorExists) {
            propertyCreators.push(msg.sender);
        }

        // Add logging before event emission
        console.log("About to emit PropertySubmitted event");
        console.log("Owner (msg.sender):", msg.sender);
        console.log("Token Address:", tokenAddress);
        
        emit PropertySubmitted(msg.sender, tokenAddress);
        
        console.log("PropertySubmitted event emitted successfully");
        return tokenAddress;
    }

    /// @notice Approves a property
    /// @param _propertyAddress Address of the property to approve
    function approveProperty(address _propertyAddress) public onlyOwner {
        console.log("Approving property. Caller:", msg.sender);
        console.log("Property address:", _propertyAddress);
        console.log("Contract owner:", owner());
        console.log("Number of property creators:", propertyCreators.length);
        
        require(_propertyAddress != address(0), "Invalid property address");
        require(!approvedProperties[_propertyAddress], "Property already approved");

        // Check if the property exists in any user's properties
        bool propertyFound = false;
        for (uint i = 0; i < propertyCreators.length; i++) {
            address creator = propertyCreators[i];
            console.log("Checking creator:", creator);
            PropertyInfo[] storage creatorProperties = userProperties[creator];
            console.log("Creator has", creatorProperties.length, "properties");
            
            for (uint j = 0; j < creatorProperties.length; j++) {
                console.log("Checking property:", creatorProperties[j].tokenAddress);
                if (creatorProperties[j].tokenAddress == _propertyAddress) {
                    propertyFound = true;
                    // Update the approval status in the user's properties
                    creatorProperties[j].isApproved = true;
                    break;
                }
            }
            if (propertyFound) break;
        }
        require(propertyFound, "Property not found in any user's properties");

        approvedProperties[_propertyAddress] = true;
        emit PropertyApproved(_propertyAddress);
    }

    /// @notice Rejects a property
    /// @param _propertyAddress Address of the property to reject
    function rejectProperty(address _propertyAddress) public onlyOwner {
        require(_propertyAddress != address(0), "Invalid property address");
        require(!approvedProperties[_propertyAddress], "Property already approved");

        // Check if the property exists in any user's properties
        bool propertyFound = false;
        for (uint i = 0; i < propertyCreators.length; i++) {
            address creator = propertyCreators[i];
            PropertyInfo[] storage creatorProperties = userProperties[creator];
            for (uint j = 0; j < creatorProperties.length; j++) {
                if (creatorProperties[j].tokenAddress == _propertyAddress) {
                    propertyFound = true;
                    break;
                }
            }
            if (propertyFound) break;
        }
        require(propertyFound, "Property not found in any user's properties");

        emit PropertyRejected(_propertyAddress);
    }

    /// @notice Gets the approval status of a property
    /// @param _propertyAddress Address of the property to check
    /// @return Approval status of the property
    function getPropertyStatus(address _propertyAddress) public view returns (bool) {
        return approvedProperties[_propertyAddress];
    }

    /// @notice Gets the properties of a user
    /// @param _user Address of the user
    /// @return Array of PropertyInfo structs containing the user's properties
    function getUserProperties(address _user) public view returns (PropertyInfo[] memory) {
        return userProperties[_user];
    }

    /// @notice Gets the list of property creators
    /// @return Array of addresses of property creators
    function getPropertyCreators() public view returns (address[] memory) {
        return propertyCreators;
    }

    /// @notice Updates the EURC token address
    /// @param _newEURCToken New address of the EURC token
    function updateEURCToken(address _newEURCToken) public onlyOwner {
        require(_newEURCToken != address(0), "Invalid EURC token address");
        eurcTokenAddress = _newEURCToken;
        emit EURCTokenUpdated(_newEURCToken);
    }
}
