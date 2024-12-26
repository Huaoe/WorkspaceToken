// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PropertyToken.sol";
import "./interfaces/IWhitelist.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract PropertyFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    error NotWhitelisted(address account);
    error NotValidator(address account);

    /// @notice Structure containing property token information
    struct Property {
        address tokenAddress;
        bool isApproved;
    }

    address public validator;
    address public whitelistContract;
    address public eurcTokenAddress;
    Property[] public properties;

    event PropertyCreated(address indexed propertyToken, address indexed creator);
    event PropertyApproved(address indexed propertyToken);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _validator,
        address _whitelistContract,
        address _eurcTokenAddress
    ) public initializer {
        require(_validator != address(0), "Validator cannot be zero address");
        require(_whitelistContract != address(0), "Whitelist cannot be zero address");
        require(_eurcTokenAddress != address(0), "EURC token cannot be zero address");

        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        validator = _validator;
        whitelistContract = _whitelistContract;
        eurcTokenAddress = _eurcTokenAddress;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function createProperty(
        string memory _tokenName,
        string memory _tokenSymbol,
        string memory _title,
        string memory _description,
        string memory _location,
        string memory _imageUrl,
        uint256 _price,
        uint256 _totalSupply
    ) public returns (address) {
        // Check if sender is whitelisted
        bool isWhitelisted = IWhitelist(whitelistContract).isWhitelisted(msg.sender);
        
        if (!isWhitelisted) {
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
            initialOwner: address(this), // Set PropertyFactory as initial owner
            eurcTokenAddress: eurcTokenAddress,
            whitelistContract: whitelistContract
        });

        // Deploy new PropertyToken with proxy
        PropertyToken implementation = new PropertyToken();
        bytes memory initData = abi.encodeWithSelector(
            PropertyToken.initialize.selector,
            initParams
        );

        address proxy = address(new ERC1967Proxy(
            address(implementation),
            initData
        ));

        // Store property information
        properties.push(Property({
            tokenAddress: proxy,
            isApproved: false
        }));

        emit PropertyCreated(proxy, msg.sender);
        return proxy;
    }

    function approveProperty(address propertyToken) public {
        require(msg.sender == validator, "Only validator can approve properties");

        bool found = false;
        address creator;
        for (uint256 i = 0; i < properties.length; i++) {
            if (properties[i].tokenAddress == propertyToken) {
                require(!properties[i].isApproved, "Property already approved");
                properties[i].isApproved = true;
                found = true;

                // Activate the property token
                PropertyToken(propertyToken).updatePropertyStatus(true);
                
                //Get the creator from the event
                creator = PropertyToken(propertyToken).owner();
                
                // Transfer ownership to the creator
                PropertyToken(propertyToken).transferOwnership(creator);
                
                emit PropertyApproved(propertyToken);
                break;
            }
        }
        require(found, "Property not found");
    }

    function getProperties() public view returns (Property[] memory) {
        return properties;
    }

    function getPropertyCount() public view returns (uint256) {
        return properties.length;
    }
}
