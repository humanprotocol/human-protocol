// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import '../interfaces/IStaking.sol';
import '../EscrowFactory.sol';

contract EscrowFactoryV1 is EscrowFactory {
    string public version;

    function setVersion(string memory _newVersion) external {
        version = _newVersion;
    }

    uint256[45] private __gap;
}
