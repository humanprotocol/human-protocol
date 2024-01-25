pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/Escrow.sol";
import "../src/EscrowFactory.sol";
import "./CoreUtils2.t.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

interface EscrowFactoryEvents {
    event Launched(address token, address escrow);
    event LaunchedV2(address token, address escrow, string jobRequesterId);
}

contract EscrowFactoryTest is CoreUtils2, EscrowFactoryEvents {
    HMToken public hmToken;
    Staking public staking;
    EscrowFactory public escrowFactory;
    Escrow public escrow;

    function setUp() public {
        vm.startPrank(owner);
        hmToken = new HMToken(1000000000, 'Human Token', 18, 'HMT');
        hmToken.transfer(operator, 1000);
        vm.stopPrank();

        //Deploy Staking
        vm.startPrank(operator);
        address stakingImpl = address(new Staking());
        bytes memory stakingData =
            abi.encodeWithSelector(Staking.initialize.selector, address(hmToken), minimumStake, lockPeriod);
        address stakingProxy = address(new ERC1967Proxy(stakingImpl, stakingData));
        staking = Staking(stakingProxy);
        // vm.stopPrank();

        // Approve spend HMT tokens staking contract
        // vm.prank(operator);
        hmToken.approve(address(staking), 1000);

        // Deploy EscrowFactory Contract
        // vm.startPrank(owner);
        address escrowFactoryImpl = address(new EscrowFactory());
        bytes memory escrowFactoryData = abi.encodeWithSelector(EscrowFactory.initialize.selector, address(staking));
        address escrowFactoryProxy = address(new ERC1967Proxy(escrowFactoryImpl, escrowFactoryData));
        escrowFactory = EscrowFactory(escrowFactoryProxy);
        vm.stopPrank();
    }

    function testSetRightCounter() public {
        uint256 initialCounter = escrowFactory.counter();
        assertEq(initialCounter, 0);
    }

    function testFail_NoEscrowWithoutStaking() public {
        vm.startPrank(operator);
        address[] memory trustHandlers = new address[](1);
        trustHandlers[0] = reputationOracle;
        vm.expectRevert("STAKE_HMT_TO_CREATE_ESCROW");
        escrowFactory.createEscrow(address(hmToken), trustHandlers, jobRequesterId);
        vm.stopPrank();
    }

    function testEscrowAfterStaking() public {
        vm.startPrank(operator);
        staking.stake(1000);
        address[] memory trustHandlers = new address[](1);
        trustHandlers[0] = reputationOracle;
        escrowFactory.createEscrow(address(hmToken), trustHandlers, jobRequesterId);
        assertEq(escrowFactory.counter(), 1);
        vm.stopPrank();
    }

    function testEmitEventOnLaunched() public {
        vm.startPrank(operator);
        console.log(hmToken.balanceOf(operator));
        staking.stake(10);
        console.log(hmToken.balanceOf(operator));
        address[] memory newTrusted = new address[](2);
        newTrusted[0] = vm.addr(203);
        newTrusted[1] = vm.addr(204);
        vm.stopPrank();
        vm.prank(owner);
        vm.expectEmit();
        emit LaunchedV2(address(hmToken), escrowFactory.lastEscrow(), jobRequesterId);
        escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);
        vm.stopPrank();
    }

    function testFindEscrowFromDepoyedEscrow() public {}
}
