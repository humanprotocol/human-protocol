// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title Upgradeable Proxy for EscrowFactory contract
 * @author Human Protocol
 * @notice Serves as entry point for all functions inside EscrowFactory contract
 */
contract EscrowFactoryUpgradeableProxy is ERC1967Proxy {
    constructor(address _logic, bytes memory _data) payable ERC1967Proxy(_logic, _data) {}

    /**
     * @notice Returns the current implementation address
     */
    function implementation() external view returns (address impl) {
        impl = super._implementation();
    }
}
