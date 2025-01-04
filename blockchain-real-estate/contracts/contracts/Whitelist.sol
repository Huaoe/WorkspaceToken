// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IWhitelist.sol";
import "hardhat/console.sol";

/// @title Whitelist
/// @notice This contract manages whitelisted addresses that can interact with other contracts
/// @dev Inherits from Initializable and OwnableUpgradeable for proxy support
contract Whitelist is IWhitelist, Initializable, OwnableUpgradeable {
    // Custom errors
    error InvalidAddress();
    error AddressAlreadyWhitelisted();
    error AddressNotWhitelisted();

    // Mapping of whitelisted addresses
    mapping(address => bool) private _whitelisted;
    
    // Array to keep track of all whitelisted addresses
    address[] private _whitelistedAddresses;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the Whitelist contract
    /// @param initialOwner The address that will own and manage the whitelist
    function initialize(address initialOwner) public initializer {
        __Ownable_init();
        console.log("Initializing Whitelist contract with owner:", initialOwner);
    }

    /// @notice Checks if an address is whitelisted
    /// @param account The address to check
    /// @return bool True if the address is whitelisted, false otherwise
    function isWhitelisted(address account) external view override returns (bool) {
        console.log("Checking whitelist status for:", account);
        bool status = _whitelisted[account];
        console.log("Whitelist status:", status);
        return status;
    }

    /// @notice Adds a single address to the whitelist
    /// @param account The address to whitelist
    function addToWhitelist(address account) external override onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        if (_whitelisted[account]) revert AddressAlreadyWhitelisted();

        _whitelisted[account] = true;
        _whitelistedAddresses.push(account);
        
        emit AddressWhitelisted(account);
        console.log("Added to whitelist:", account);
    }

    /// @notice Removes a single address from the whitelist
    /// @param account The address to remove from whitelist
    function removeFromWhitelist(address account) external override onlyOwner {
        if (!_whitelisted[account]) revert AddressNotWhitelisted();

        _whitelisted[account] = false;
        
        // Remove address from whitelistedAddresses array
        for (uint256 i = 0; i < _whitelistedAddresses.length; i++) {
            if (_whitelistedAddresses[i] == account) {
                _whitelistedAddresses[i] = _whitelistedAddresses[_whitelistedAddresses.length - 1];
                _whitelistedAddresses.pop();
                break;
            }
        }
        
        emit AddressRemovedFromWhitelist(account);
        console.log("Removed from whitelist:", account);
    }

    /// @notice Adds multiple addresses to the whitelist
    /// @param accounts Array of addresses to add to whitelist
    function addBatchToWhitelist(address[] calldata accounts) external override onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert InvalidAddress();
            if (!_whitelisted[accounts[i]]) {
                _whitelisted[accounts[i]] = true;
                _whitelistedAddresses.push(accounts[i]);
                emit AddressWhitelisted(accounts[i]);
            }
        }
        emit BatchWhitelistAdded(accounts);
        console.log("Added batch to whitelist, count:", accounts.length);
    }

    /// @notice Removes multiple addresses from the whitelist
    /// @param accounts Array of addresses to remove from whitelist
    function removeBatchFromWhitelist(address[] calldata accounts) external override onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (!_whitelisted[accounts[i]]) revert AddressNotWhitelisted();
            _whitelisted[accounts[i]] = false;
            // Remove from whitelistedAddresses array
            for (uint256 j = 0; j < _whitelistedAddresses.length; j++) {
                if (_whitelistedAddresses[j] == accounts[i]) {
                    _whitelistedAddresses[j] = _whitelistedAddresses[_whitelistedAddresses.length - 1];
                    _whitelistedAddresses.pop();
                    break;
                }
            }
            emit AddressRemovedFromWhitelist(accounts[i]);
        }
        emit BatchWhitelistRemoved(accounts);
        console.log("Removed batch from whitelist, count:", accounts.length);
    }

    /// @notice Gets all whitelisted addresses
    /// @return address[] Array of all whitelisted addresses
    function getWhitelistedAddresses() external view override returns (address[] memory) {
        return _whitelistedAddresses;
    }
}
