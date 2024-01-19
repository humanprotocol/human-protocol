pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Escrow.sol";
import "../src/HMToken.sol";


contract CoreUtils is Test {    


    address owner = vm.addr(1);
    address launcher = vm.addr(2);
    address reputationOracle = vm.addr(3);
    address recordingOracle = vm.addr(4);
    address exchangeOracle = vm.addr(5);
    address externalAddress = vm.addr(6);
    address[] restAccounts = new address[](2);
    address[] trustedHandlers = new address[](2);

    /**
     * @dev fund accounts with Ether
     */
    function _fundEther() internal {
        vm.deal(owner, 100 ether);
        vm.deal(launcher, 100 ether);
        vm.deal(reputationOracle, 100 ether);
        vm.deal(recordingOracle, 100 ether);
        vm.deal(exchangeOracle, 100 ether);
        vm.deal(externalAddress, 100 ether);
        vm.deal(restAccounts[0], 100 ether);
        vm.deal(trustedHandlers[0], 100 ether);
    }

    function _initTrustedHandlers() internal {
        trustedHandlers[0] = vm.addr(12);
        trustedHandlers[1] = vm.addr(13);
        // vm.prank(owner);
        // escrow = new Escrow(address(0), launcher, payable(owner), 100, trustedHandlers);
        // escrow.addTrustedHandlers(trustedHandlers);
    }
}
