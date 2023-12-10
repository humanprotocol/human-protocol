// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract HubUpdateSpokeContracts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address payable governorAddress = payable(vm.envAddress("GOVERNOR_ADDRESS"));

        address[] memory emptyAddressArray = new address[](0);
        uint256[] memory emptyUintArray = new uint256[](0);
        address[] memory spokeAddresses = vm.envOr("SPOKE_ADDRESSES", ",", emptyAddressArray);
        uint256[] memory spokeChainIds = vm.envOr("SPOKE_WORMHOLE_CHAIN_IDS", ",", emptyUintArray);

        require(spokeAddresses.length == spokeChainIds.length, "Please provide same amount of addresses as chain ids");

        CrossChainGovernorCountingSimple.CrossChainAddress[] memory spokeContracts = new CrossChainGovernorCountingSimple.CrossChainAddress[](spokeAddresses.length);
        for (uint i = 0; i < spokeAddresses.length; i++) {
            spokeContracts[i] = CrossChainGovernorCountingSimple.CrossChainAddress(bytes32(uint256(uint160(spokeAddresses[i]))), uint16(spokeChainIds[i]));
        }

        vm.startBroadcast(deployerPrivateKey);
        MetaHumanGovernor governanceContract = MetaHumanGovernor(governorAddress);

        governanceContract.updateSpokeContracts(spokeContracts);
        vm.stopBroadcast();
    }
}
