// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PropertyToken.sol";
import "./interfaces/IWhitelist.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "hardhat/console.sol";

/// @title PropertyFactory
/// @notice Factory contract for creating new PropertyToken contracts
contract PropertyFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    error NotWhitelisted(address account);
    error NotValidator(address account);

    /// @notice Structure containing property token information
    /// @param tokenAddress Address of the PropertyToken contract
    /// @param isApproved Whether the property has been approved by the validator
    struct PropertyInfo {
        address tokenAddress;
        bool isApproved;
    }

    string public name;
    string public symbol;
    address public paymentToken;
    address public admin;
    address public validator;
    address public eurcTokenAddress;
    address public whitelistContract;

    PropertyInfo[] public properties;
    mapping(address => PropertyInfo[]) public userProperties;
    address[] public propertyCreators;

    event PropertyCreated(
        address indexed propertyToken,
        address indexed creator,
        string title,
        string location,
        uint256 price
    );

    event PropertySubmitted(address indexed creator, address indexed propertyToken);
    event PropertyApproved(address indexed propertyToken);
    event PropertyRejected(address indexed propertyToken);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /// @notice Initializes the PropertyFactory contract
    /// @param _name Name of the factory
    /// @param _symbol Symbol of the factory
    /// @param _paymentToken Address of the EURC token contract
    /// @param _admin Address of the admin
    /// @param _validator Address of the validator
    /// @param _whitelistContract Address of the whitelist contract
    function initialize(
        string memory _name,
        string memory _symbol,
        address _paymentToken,
        address _admin,
        address _validator,
        address _whitelistContract
    ) public initializer {
        __Ownable_init(msg.sender);
        
        name = _name;
        symbol = _symbol;
        paymentToken = _paymentToken;
        admin = _admin;
        validator = _validator;
        eurcTokenAddress = _paymentToken;
        whitelistContract = _whitelistContract;
    }

    /// @notice Creates a new PropertyToken contract
    /// @param _title Title of the property
    /// @param _description Description of the property
    /// @param _location Location of the property
    /// @param _imageUrl URL of the property image
    /// @param _price Price of the property
    /// @param _totalSupply Total supply of the property
    /// @param _tokenName Name of the token
    /// @param _tokenSymbol Symbol of the token
    function createProperty(
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price,
        uint256 _totalSupply,
        string memory _tokenName,
        string memory _tokenSymbol
    ) public returns (address) {
        console.log("Creating property with title:", _title);
        console.log("Description:", _description);
        console.log("Location:", _location);
        console.log("Image URL:", _imageUrl);
        console.log("Price:", _price);
        console.log("Total Supply:", _totalSupply);
        console.log("Token Name:", _tokenName);
        console.log("Token Symbol:", _tokenSymbol);
        console.log("Sender:", msg.sender);
        
        // Check if sender is whitelisted first
        if (!IWhitelist(whitelistContract).isWhitelisted(msg.sender)) {
            revert NotWhitelisted(msg.sender);
        }

        // Create initialization parameters
        PropertyToken.InitParams memory initParams = PropertyToken.InitParams({
            name: _tokenName,
            symbol: _tokenSymbol,
            title: _title,
            description: _description,
            location: _location,
            imageUrl: _imageUrl,
            price: _price,
            totalSupply: _totalSupply,
            initialOwner: msg.sender,
            eurcTokenAddress: eurcTokenAddress,
            whitelistContract: whitelistContract
        });

        // Deploy new PropertyToken with proxy
        console.log("Deploying new PropertyToken...");
        bytes memory initData = abi.encodeWithSelector(
            PropertyToken.initialize.selector,
            initParams
        );

        PropertyToken propertyToken = new PropertyToken();
        address proxy = address(new ERC1967Proxy(
            address(propertyToken),
            initData
        ));

        console.log("PropertyToken created at:", proxy);

        // Add property to storage
        properties.push(PropertyInfo({
            tokenAddress: proxy,
            isApproved: false
        }));

        userProperties[msg.sender].push(PropertyInfo({
            tokenAddress: proxy,
            isApproved: false
        }));

        propertyCreators.push(msg.sender);

        emit PropertyCreated(
            proxy,
            msg.sender,
            _title,
            _location,
            _price
        );

        emit PropertySubmitted(msg.sender, proxy);
        
        console.log("Property creation complete");
        return proxy;
    }

    /// @notice Approves a property token
    /// @param propertyToken Address of the property token to approve
    function approveProperty(address propertyToken) public {
        if (msg.sender != validator) {
            revert NotValidator(msg.sender);
        }

        for (uint256 i = 0; i < properties.length; i++) {
            if (properties[i].tokenAddress == propertyToken) {
                properties[i].isApproved = true;
                
                // Update in user properties as well
                address creator = propertyCreators[i];
                PropertyInfo[] storage userProps = userProperties[creator];
                for (uint256 j = 0; j < userProps.length; j++) {
                    if (userProps[j].tokenAddress == propertyToken) {
                        userProps[j].isApproved = true;
                        break;
                    }
                }
                
                emit PropertyApproved(propertyToken);
                return;
            }
        }
        revert("Property not found");
    }

    /// @notice Get a human-readable description of a Solidity panic code
    /// @param code The panic code
    /// @return A string describing the panic
    function getPanicReason(uint code) internal pure returns (string memory) {
        if (code == 0x01) return "Assertion failed";
        if (code == 0x11) return "Arithmetic overflow/underflow";
        if (code == 0x12) return "Division or modulo by zero";
        if (code == 0x21) return "Invalid enum value";
        if (code == 0x22) return "Storage slot out of bounds";
        if (code == 0x31) return "Pop on empty array";
        if (code == 0x32) return "Array index out of bounds";
        if (code == 0x41) return "Memory allocation failed";
        if (code == 0x51) return "Zero-initialized variable";
        return "Unknown panic code";
    }

    /// @notice Get the total number of properties
    /// @return The number of properties
    function getPropertyCount() public view returns (uint256) {
        return properties.length;
    }

    /// @notice Get all properties
    /// @return Array of PropertyInfo structs
    function getAllProperties() public view returns (PropertyInfo[] memory) {
        return properties;
    }

    /// @notice Get properties created by a specific user
    /// @param user Address of the user
    /// @return Array of PropertyInfo structs
    function getUserProperties(address user) public view returns (PropertyInfo[] memory) {
        return userProperties[user];
    }

    /// @notice Get all property creators
    /// @return Array of addresses of property creators
    function getPropertyCreators() public view returns (address[] memory) {
        return propertyCreators;
    }
}
