// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import "../governance/wormhole/IWormholeReceiver.sol";
import "hardhat/console.sol";

contract WormholeMock {
    address public daoSpoke;

    receive() external payable {}

    function setDAOSpokeContract(address _daoSpoke) external {
        daoSpoke = _daoSpoke;
    }

    function quoteEVMDeliveryPrice(
        uint16,
        uint256,
        uint256
    ) external pure returns (uint256, uint256) {
        return (100, 100);
    }

    function sendPayloadToEvm(
        uint16,
        address,
        bytes memory,
        uint256,
        uint256
    ) external payable returns (uint64 sequence) {
        return 100;
    }

    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory additionalVaas, // additionalVaas
        bytes32 sourceAddress, // address that called 'sendPayloadToEvm' (HelloWormhole contract address)
        uint16 sourceChain,
        bytes32 deliveryHash // this can be stored in a mapping deliveryHash => bool to prevent duplicate deliveries
    ) external payable {
        IWormholeReceiver(daoSpoke).receiveWormholeMessages{value: 100}(
            payload,
            additionalVaas,
            sourceAddress,
            sourceChain,
            deliveryHash
        );
    }
}
