// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../contracts/hm-token/HMToken.sol";

contract TransferTokensToTimelock is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address payable governorAddress = payable(vm.envAddress("GOVERNOR_ADDRESS"));
        address hmTokenAddress = vm.envAddress("HM_TOKEN_ADDRESS");
        HMToken hmToken = HMToken(hmTokenAddress);
        MetaHumanGovernor governanceContract = MetaHumanGovernor(governorAddress);
        vm.startBroadcast(deployerPrivateKey);

        hmToken.transfer(governanceContract.timelock(), 1 ether);

        vm.stopBroadcast();
    }
}
