// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract USDT is ERC20 {
    constructor() ERC20('Tether', 'USDT') {
        _mint(msg.sender, 1000000 * 10 ** 18);
    }
}
