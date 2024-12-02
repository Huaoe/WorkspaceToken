// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockEURC
/// @notice A mock implementation of the EURC (Euro Coin) token for testing purposes
/// @dev Inherits from ERC20 and Ownable contracts
contract MockEURC is ERC20, Ownable {
    /// @notice The number of decimals for the token
    uint8 private constant _decimals = 6;

    /// @notice Creates a new MockEURC token
    /// @param initialOwner Address of the initial owner who receives the initial supply
    /// @dev Mints 1 million EURC to the initial owner
    constructor(address initialOwner) ERC20("Mock EURC", "EURC") Ownable(initialOwner) {
        // Mint 1 million EURC to the deployer
        _mint(initialOwner, 1_000_000 * 10**_decimals);
    }

    /// @notice Returns the number of decimals used for token amounts
    /// @return The number of decimals (6)
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /// @notice Allows the owner to mint new tokens
    /// @param to Address to receive the minted tokens
    /// @param amount Amount of tokens to mint
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
