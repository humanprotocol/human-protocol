// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Context.sol';

/**
 * @dev This contract is based on OpenZeppelin's access/Ownable.sol contract.
 * The only thing changed is the removal of `renounceOwnership()` function and name of the variables.
 */
abstract contract Magistrate is Context {
    address private _magistrate;

    event MagistrateChanged(
        address indexed previousMagistrate,
        address indexed newMagistrate
    );

    /**
     * @dev Initializes the contract setting the provided address as the initial magistrate.
     */
    constructor(address magistrate_) {
        _transferMagistrate(magistrate_);
    }

    /**
     * @dev Throws if called by any account other than the magistrate.
     */
    modifier onlyMagistrate() {
        _checkMagistrate();
        _;
    }

    /**
     * @dev Returns the address of the current magistrate.
     */
    function magistrate() public view virtual returns (address) {
        return _magistrate;
    }

    /**
     * @dev Throws if the sender is not the magistrate.
     */
    function _checkMagistrate() internal view virtual {
        require(
            magistrate() == _msgSender(),
            'Magistrate: caller is not the magistrate'
        );
    }

    /**
     * @dev Transfers magistrate of the contract to a new account (`newMagistrate`).
     * Can only be called by the current magistrate.
     */
    function transferMagistrate(
        address newMagistrate
    ) public virtual onlyMagistrate {
        require(
            newMagistrate != address(0),
            'Magistrate: new magistrate is the zero address'
        );
        _transferMagistrate(newMagistrate);
    }

    /**
     * @dev Transfers magistrate to a new account (`newMagistrate`).
     * Internal function without access restriction.
     */
    function _transferMagistrate(address newMagistrate) internal virtual {
        address oldMagistrate = _magistrate;
        _magistrate = newMagistrate;
        emit MagistrateChanged(oldMagistrate, newMagistrate);
    }
}
