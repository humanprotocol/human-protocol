pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Wrapper.sol';

contract VHMToken is ERC20, ERC20Permit, ERC20Votes, ERC20Wrapper {
    constructor(
        IERC20 wrappedToken
    )
        ERC20('vHMToken', 'vHMT')
        ERC20Permit('vHMToken')
        ERC20Wrapper(wrappedToken)
    {}

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return 'mode=timestamp';
    }

    // The functions below are overrides required by Solidity.

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function decimals()
        public
        view
        virtual
        override(ERC20Wrapper, ERC20)
        returns (uint8)
    {
        return super.decimals();
    }

    function nonces(
        address owner
    ) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
