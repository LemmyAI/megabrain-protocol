// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testnet testing
 * 6 decimals like real USDC
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;

    constructor(address initialOwner) ERC20("Mock USDC", "mUSDC") Ownable(initialOwner) {
        // Mint 1 million USDC to deployer
        _mint(initialOwner, 1_000_000 * 10**_DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @dev Mint tokens to a specific address (for testing)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Faucet function for testnet users
     */
    function faucet(uint256 amount) external {
        require(amount <= 10_000 * 10**_DECIMALS, "Max 10k USDC per faucet");
        _mint(msg.sender, amount);
    }
}