// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWhitelist {
    // Events
    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event BatchWhitelistAdded(address[] accounts);
    event BatchWhitelistRemoved(address[] accounts);

    function isWhitelisted(address account) external view returns (bool);
    function addToWhitelist(address account) external;
    function removeFromWhitelist(address account) external;
    function addBatchToWhitelist(address[] calldata accounts) external;
    function removeBatchFromWhitelist(address[] calldata accounts) external;
    function getWhitelistedAddresses() external view returns (address[] memory);
}
