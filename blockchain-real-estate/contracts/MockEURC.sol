// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockEURC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    constructor(address initialOwner) 
        ERC20("Mock EURC", "EURC") 
        Ownable(initialOwner)
    {
        // Mint initial supply to owner (1,000,000 EURC)
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
