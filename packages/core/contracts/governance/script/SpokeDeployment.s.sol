// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MetaHumanGovernor.sol";
import "../src/vhm-token/VHMToken.sol";
import "./DeploymentUtils.sol";

contract SpokeDeployment is Script, DeploymentUtils {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address governorAddress = vm.envAddress("GOVERNOR_ADDRESS");
        uint16 chainId = uint16(vm.envUint("SPOKE_WORMHOLE_CHAIN_ID"));
        address vHMTokenAddress = vm.envAddress("SPOKE_VOTE_TOKEN_ADDRESS");
        address spokeAutomaticRelayerAddress = vm.envAddress("SPOKE_AUTOMATIC_RELAYER_ADDRESS");
        VHMToken voteToken = VHMToken(vHMTokenAddress);
        vm.startBroadcast(deployerPrivateKey);

        new DAOSpokeContract(bytes32(uint256(uint160(governorAddress))), hubChainId, voteToken, targetSecondsPerBlock, chainId, spokeAutomaticRelayerAddress);
    }
}
