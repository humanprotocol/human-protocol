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
    address validator = vm.addr(7);
    address operator = vm.addr(8);
    address operator2 = vm.addr(9);
    address operator3 = vm.addr(10);
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

    /**
     * @dev init Trusted Handlers addresses
     */
    function _initTrustedHandlers() internal {
        trustedHandlers[0] = vm.addr(12);
        trustedHandlers[1] = vm.addr(13);
    }

    /**
     * @dev init a large number of recipients and amounts
     */
    function _initRecipientsAndAmounts(uint16 _maxRecipients) internal returns (address[] memory, uint256[] memory) {
        address[] memory recipients = new address[](_maxRecipients);
        uint256[] memory amounts = new uint256[](_maxRecipients);

        for (uint256 i = 0; i < _maxRecipients; i++) {
            recipients[i] = vm.addr(i);
            amounts[i] = 1;
        }
        return (recipients, amounts);
    }
}
