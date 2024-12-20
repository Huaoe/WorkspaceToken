// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

/// @title Whitelist
/// @notice This contract manages whitelisted addresses that can interact with other contracts
/// @dev Inherits from Initializable and OwnableUpgradeable for proxy support
contract Whitelist is Initializable, OwnableUpgradeable {
    // Custom errors
    error InvalidAddress();
    error AddressAlreadyWhitelisted();
    error AddressNotWhitelisted();

    // Mapping of whitelisted addresses
    mapping(address => bool) private _isWhitelisted;
    
    // Array to keep track of all whitelisted addresses
    address[] public whitelistedAddresses;
    
    // Events
    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event BatchWhitelistAdded(address[] accounts);
    event BatchWhitelistRemoved(address[] accounts);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the Whitelist contract
    /// @param initialOwner The address that will own and manage the whitelist
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        console.log("Initializing Whitelist contract with owner:", initialOwner);
    }

    /// @notice Adds a single address to the whitelist
    /// @param account The address to whitelist
    function addToWhitelist(address account) public onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        if (_isWhitelisted[account]) revert AddressAlreadyWhitelisted();

        _isWhitelisted[account] = true;
        whitelistedAddresses.push(account);
        
        emit AddressWhitelisted(account);
        console.log("Added to whitelist:", account);
    }

    /// @notice Removes a single address from the whitelist
    /// @param account The address to remove from whitelist
    function removeFromWhitelist(address account) public onlyOwner {
        if (!_isWhitelisted[account]) revert AddressNotWhitelisted();

        _isWhitelisted[account] = false;
        
        // Remove address from whitelistedAddresses array
        for (uint256 i = 0; i < whitelistedAddresses.length; i++) {
            if (whitelistedAddresses[i] == account) {
                whitelistedAddresses[i] = whitelistedAddresses[whitelistedAddresses.length - 1];
                whitelistedAddresses.pop();
                break;
            }
        }
        
        emit AddressRemovedFromWhitelist(account);
        console.log("Removed from whitelist:", account);
    }

    /// @notice Adds multiple addresses to the whitelist
    /// @param accounts Array of addresses to whitelist
    function addBatchToWhitelist(address[] memory accounts) public onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert InvalidAddress();
            if (!_isWhitelisted[accounts[i]]) {
                _isWhitelisted[accounts[i]] = true;
                whitelistedAddresses.push(accounts[i]);
                emit AddressWhitelisted(accounts[i]);
            }
        }
        emit BatchWhitelistAdded(accounts);
        console.log("Added batch to whitelist, count:", accounts.length);
    }

    /// @notice Removes multiple addresses from the whitelist
    /// @param accounts Array of addresses to remove from whitelist
    function removeBatchFromWhitelist(address[] memory accounts) public onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (!_isWhitelisted[accounts[i]]) revert AddressNotWhitelisted();
            _isWhitelisted[accounts[i]] = false;
            // Remove from whitelistedAddresses array
            for (uint256 j = 0; j < whitelistedAddresses.length; j++) {
                if (whitelistedAddresses[j] == accounts[i]) {
                    whitelistedAddresses[j] = whitelistedAddresses[whitelistedAddresses.length - 1];
                    whitelistedAddresses.pop();
                    break;
                }
            }
            emit AddressRemovedFromWhitelist(accounts[i]);
        }
        emit BatchWhitelistRemoved(accounts);
        console.log("Removed batch from whitelist, count:", accounts.length);
    }

    /// @notice Checks if an address is whitelisted
    /// @param account The address to check
    /// @return bool True if the address is whitelisted, false otherwise
    function isWhitelisted(address account) external view returns (bool) {
        return _isWhitelisted[account];
    }

    /// @notice Gets all whitelisted addresses
    /// @return address[] Array of all whitelisted addresses
    function getWhitelistedAddresses() public view returns (address[] memory) {
        return whitelistedAddresses;
    }

    /// @notice Gets the count of whitelisted addresses
    /// @return uint256 Number of whitelisted addresses
    function getWhitelistedCount() public view returns (uint256) {
        return whitelistedAddresses.length;
    }
}
