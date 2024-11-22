// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockEURC is ERC20, Ownable {
    uint8 private constant _decimals = 6;

    constructor(address initialOwner) ERC20("Mock EURC", "EURC") Ownable(initialOwner) {
        // Mint 1 million EURC to the deployer
        _mint(initialOwner, 1_000_000 * 10**_decimals);
    }

    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
