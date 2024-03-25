// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import '../governance/wormhole/IWormholeReceiver.sol';
import '../governance/wormhole/IWormholeRelayer.sol';

contract WormholeMock {
    address receiver;

    receive() external payable {}

    function setReceiver(address _receiver) external {
        receiver = _receiver;
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
        uint256,
        uint16,
        address
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
        IWormholeReceiver(receiver).receiveWormholeMessages{value: msg.value}(
            payload,
            additionalVaas,
            sourceAddress,
            sourceChain,
            deliveryHash
        );
    }
}
