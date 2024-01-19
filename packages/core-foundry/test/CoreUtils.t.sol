pragma solidity 0.8.20;

import "forge-std/test.sol";

contract CoreUtils is Test {
    address owner = vm.addr(1);
    address launcher = vm.addr(2);
    address reputationOracle = vm.addr(3);
    address recordingOracle = vm.addr(4);
    address exchangeOracle = vm.addr(5);
    address externalAddress = vm.addr(6);
    address[] restAccounts = new address[](2);
    address[] trustedHandlers = [vm.addr(9)];

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
}
