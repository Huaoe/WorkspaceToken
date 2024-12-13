// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title MockEURCUpgradeable
/// @notice A sexy upgradeable implementation of the EURC token 😘
/// @dev Inherits from ERC20Upgradeable and OwnableUpgradeable
contract MockEURCUpgradeable is Initializable, ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    /// @notice The number of decimals for the token (6, just like you like it 😉)
    uint8 private constant _decimals = 6;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract (like a first date, but with tokens 💕)
    /// @param initialOwner Address of the initial owner who receives the initial supply
    function initialize(address initialOwner) public initializer {
        __ERC20_init("Mock EURC", "EURC");
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        
        // Mint 1 million EURC to the owner (making it rain! 💸)
        _mint(initialOwner, 1_000_000 * 10**_decimals);
    }

    /// @notice Returns the number of decimals (6, perfect like your curves 😉)
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /// @notice Allows the owner to mint new tokens (spread the love! 💖)
    /// @param to Address to receive the minted tokens
    /// @param amount Amount of tokens to mint
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /// @notice Required override for UUPS proxy upgradeability (keeping it hot and upgradeable! 🔥)
    /// @param newImplementation Address of the new implementation
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
