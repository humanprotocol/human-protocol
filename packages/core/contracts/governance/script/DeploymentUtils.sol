pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/wormhole/IWormholeRelayer.sol";

abstract contract DeploymentUtils is Script {
    address public magistrateAddress = vm.envAddress("MAGISTRATE_ADDRESS");
    uint16 public hubChainId = uint16(vm.envUint("HUB_WORMHOLE_CHAIN_ID"));
    uint16 public targetSecondsPerBlock = uint16(vm.envUint("HUB_SECONDS_PER_BLOCK"));
    address public hubAutomaticRelayerAddress = vm.envAddress("HUB_AUTOMATIC_RELAYER_ADDRESS");

    uint256 public deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address public deployerAddress = vm.addr(deployerPrivateKey);


    function getProposalExecutionData() public view returns(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description) {
        address hmTokenAddress = vm.envAddress("HM_TOKEN_ADDRESS");

        description = vm.envString("DESCRIPTION");

        bytes memory encodedCall = abi.encodeCall(IERC20.transfer, (address(deployerAddress), 50));
        targets = new address[](1);
        values = new uint256[](1);
        calldatas = new bytes[](1);
        targets[0] = address(hmTokenAddress);
        calldatas[0] = encodedCall;

        return (targets, values, calldatas, description);
    }
}
