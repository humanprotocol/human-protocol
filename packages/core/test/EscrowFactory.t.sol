pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "../src/Escrow.sol";
import "../src/EscrowFactory.sol";
import "./CoreUtils.t.sol";
import "./Helpers/EscrowFactoryUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

interface EscrowFactoryEvents {
    event Launched(address token, address escrow);
    event LaunchedV2(address token, address escrow, string jobRequesterId);
}

contract EscrowFactoryTest is CoreUtils, EscrowFactoryEvents {
    EscrowFactoryUpgradeableProxy public escrowFactoryProxy;

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

    // function testEmitEventOnLaunched() public {
    //     vm.startPrank(operator);
    //     uint256 stakeAmount = 10;
    //     staking.stake(stakeAmount);
    //     address[] memory newTrusted = new address[](2);
    //     newTrusted[0] = vm.addr(203);
    //     newTrusted[1] = vm.addr(204);
    //     vm.expectEmit();
    //     emit LaunchedV2(address(hmToken), escrowFactory.lastEscrow(), jobRequesterId);
    //     escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);
    //     vm.stopPrank();
    // }

    function testFindEscrowFromDepoyedEscrow() public {
        vm.startPrank(operator);
        uint256 stakeAmount = 10;
        staking.stake(stakeAmount);
        address[] memory newTrusted = new address[](2);
        newTrusted[0] = vm.addr(203);
        newTrusted[1] = vm.addr(204);
        escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);
        address escrowAddress = escrowFactory.lastEscrow();
        Escrow escrow = Escrow(escrowAddress);
        assertEq(escrowFactory.hasEscrow(escrowAddress), true);
    }

    function testOperatorCreateAnotherEscrowAfterAllocationOfStakes() public {
        vm.startPrank(operator);
        uint256 stakeAmount = 10;
        staking.stake(stakeAmount);
        address[] memory newTrusted = new address[](2);
        newTrusted[0] = vm.addr(203);
        newTrusted[1] = vm.addr(204);
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);
        Escrow escrow = Escrow(escrowAddress);
        staking.allocate(escrowAddress, stakeAmount / 2);
        address anotherEscrow = escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);
        assertEq(escrowFactory.hasEscrow(anotherEscrow), true);
        assertEq(escrow.token(), address(hmToken));
        vm.stopPrank();
    }

    function testFail_NoEscrowWithAllocatingAllStakes() public {
        vm.startPrank(operator);
        uint256 stakeAmount = 10;
        staking.stake(stakeAmount);
        address[] memory newTrusted = new address[](1);
        newTrusted[0] = accounts[6];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);
        Escrow escrow = Escrow(escrowAddress);
        staking.allocate(escrowAddress, stakeAmount);
        vm.expectRevert("NEED_STAKE_TOKENS_TO_CREATE_ESCROW");
        address anotherEscrow = escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);
        vm.stopPrank();
    }

    function testCreateEscrowStakingMoreTokens() public {
        vm.startPrank(operator);
        uint256 stakeAmount = 10;
        staking.stake(stakeAmount);
        address[] memory newTrusted = new address[](1);
        newTrusted[0] = accounts[6];
        address escrowAddress = escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);
        Escrow escrow = Escrow(escrowAddress);
        staking.allocate(escrowAddress, stakeAmount);
        staking.stake(stakeAmount);
        address anotherEscrow = escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);
        vm.stopPrank();
        assertEq(escrow.token(), address(hmToken));
        assertEq(escrowFactory.hasEscrow(anotherEscrow), true);
    }

    function testFail_RejectNonOwnerUpgrades() public {
        vm.startPrank(owner);
        address escrowFactoryImpl = address(new EscrowFactory());
        bytes memory escrowFactoryData = abi.encodeWithSelector(EscrowFactory.initialize.selector, address(staking));
        address escrowFactoryProxy = address(new ERC1967Proxy(escrowFactoryImpl, escrowFactoryData));
        escrowFactory = EscrowFactory(escrowFactoryProxy);
        vm.stopPrank();

        // Use another address to upgrade
        vm.startPrank(operator);
        EscrowFactory proxy = EscrowFactory(payable(escrowFactoryProxy));
        address newEscrowFactory = address(new EscrowFactory());
        vm.expectRevert("OWNABLE: CALLER_IS_NOT_OWNER");
        proxy.upgradeTo(newEscrowFactory);
    }

    function testOwnerUpgradeEscrowFactory() public {
        vm.startPrank(owner);
        address escrowFactoryImpl = address(new EscrowFactory());
        bytes memory escrowFactoryData = abi.encodeWithSelector(EscrowFactory.initialize.selector, address(staking));
        escrowFactoryProxy = new EscrowFactoryUpgradeableProxy(escrowFactoryImpl, escrowFactoryData);
        // escrowFactory = EscrowFactory(address(escrowFactoryProxy));
        EscrowFactory proxy = EscrowFactory(payable(address(escrowFactoryProxy)));
        address newEscrowFactory = address(new EscrowFactory());
        assertEq(escrowFactoryProxy.implementation(), escrowFactoryImpl);
        proxy.upgradeTo(newEscrowFactory);
        assertNotEq(escrowFactoryProxy.implementation(), escrowFactoryImpl);
        assertEq(escrowFactoryProxy.implementation(), newEscrowFactory);
        vm.stopPrank();
    }

    function testHaveSameStorage() public {
        vm.startPrank(operator);
        uint256 stakeAmount = 10;
        staking.stake(stakeAmount);
        address[] memory newTrusted = new address[](2);
        newTrusted[0] = vm.addr(203);
        newTrusted[1] = vm.addr(204);
        escrowFactory.createEscrow(address(hmToken), newTrusted, jobRequesterId);

        address escrowFactoryImpl = address(new EscrowFactory());
        bytes memory escrowFactoryData = abi.encodeWithSelector(EscrowFactory.initialize.selector, address(staking));
        escrowFactoryProxy = new EscrowFactoryUpgradeableProxy(escrowFactoryImpl, escrowFactoryData);
        address oldLastEscrow = escrowFactory.lastEscrow();
        address oldImplementationAddress = escrowFactoryProxy.implementation();
        EscrowFactory proxy = EscrowFactory(payable(address(escrowFactoryProxy)));
        address newEscrowFactory = address(new EscrowFactory());
        proxy.upgradeTo(newEscrowFactory);

        assertNotEq(escrowFactoryProxy.implementation(), oldImplementationAddress);
        assertEq(escrowFactory.lastEscrow(), oldLastEscrow);
    }
}
