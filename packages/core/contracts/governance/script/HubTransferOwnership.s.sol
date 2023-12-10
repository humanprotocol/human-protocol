// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../src/MetaHumanGovernor.sol";

contract HubTransferOwnership is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address payable governorAddress = payable(vm.envAddress("GOVERNOR_ADDRESS"));
        address timelockAddress = vm.envAddress("TIMELOCK_ADDRESS");
        MetaHumanGovernor governanceContract = MetaHumanGovernor(governorAddress);

        vm.startBroadcast(deployerPrivateKey);

        governanceContract.transferOwnership(timelockAddress);

        vm.stopBroadcast();
    }
}
