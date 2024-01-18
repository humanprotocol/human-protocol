// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private decimals_;

    /// @notice Creates a new mock ERC20 token.
    /// @param name The name of the token.
    /// @param symbol The symbol of the token.
    /// @param tokenDecimals The number of decimals of the token.
    constructor(string memory name, string memory symbol, uint8 tokenDecimals) ERC20(name, symbol) {
        require(tokenDecimals > 0, "MockERC20: decimals can't be zero");
        decimals_ = tokenDecimals;
    }

    /// @notice Returns the number of decimals of the token.
    /// @return The number of decimals of the token.
    function decimals() public view virtual override returns (uint8) {
        return decimals_;
    }

    /// @notice Mints new tokens for the given account.
    /// @param to The account to mint tokens for.
    /// @param amount The amount of tokens to mint.
    /// @dev Note that anyone can use this function - it is not restricted.
    function mint(address to, uint256 amount) public virtual {
        _mint(to, amount);
    }

    /// @notice Burns tokens from the given account.
    /// @param from The account to burn tokens from.
    /// @param amount The amount of tokens to burn.
    /// @dev Note that anyone can use this function - it is not restricted.
    function burn(address from, uint256 amount) public virtual {
        _burn(from, amount);
    }
}
