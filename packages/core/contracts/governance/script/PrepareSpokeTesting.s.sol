// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MetaHumanGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../src/vhm-token/VHMToken.sol";
import "../src/hm-token/HMToken.sol";
import "./DeploymentUtils.sol";

contract PrepareSpokeTesting is Script, DeploymentUtils {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 secondPrivateKey = vm.envUint("SECOND_PRIVATE_KEY");
        uint256 thirdPrivateKey = vm.envUint("THIRD_PRIVATE_KEY");
        address governorAddress = vm.envAddress("GOVERNOR_ADDRESS");
        address spokeAutomaticRelayerAddress = vm.envAddress("SPOKE_AUTOMATIC_RELAYER_ADDRESS");
        uint16 spokeChainId = uint16(vm.envUint("SPOKE_CHAIN_ID"));
        vm.startBroadcast(deployerPrivateKey);
        address secondAddress = vm.addr(secondPrivateKey);
        address thirdAddress = vm.addr(thirdPrivateKey);

        HMToken hmToken = new HMToken(1000 ether, "HMToken", 18, "HMT");
        hmToken.transfer(secondAddress, 100 ether);
        hmToken.transfer(thirdAddress, 100 ether);
        VHMToken voteToken = new VHMToken(IERC20(address(hmToken)));
        new DAOSpokeContract(bytes32(uint256(uint160(governorAddress))), hubChainId, voteToken, targetSecondsPerBlock, spokeChainId, spokeAutomaticRelayerAddress);

        vm.stopBroadcast();

        vm.startBroadcast(secondPrivateKey);
        hmToken.approve(address(voteToken), 20 ether);
        voteToken.depositFor(address(secondAddress), 20 ether);
        vm.stopBroadcast();

        vm.startBroadcast(thirdPrivateKey);
        hmToken.approve(address(voteToken), 20 ether);
        voteToken.depositFor(address(thirdAddress), 20 ether);
        vm.stopBroadcast();
    }
}
