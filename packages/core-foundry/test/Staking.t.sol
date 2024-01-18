pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/Staking.sol";
import "../src/HMToken.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract StakingTest is Test {
    Staking public staking;
    HMToken public hmToken;

    address owner = address(0x1);
    address acc1 = address(0x2);

    // address stakingProxy = vm.envAddress("STAKING_PROXY");

    function setUp() public {
        // vm.deal(owner, 1);
        vm.startPrank(acc1);
        hmToken = new HMToken(1, 'Human Token', 10, 'HMT');
        vm.stopPrank();
    }

    // function testTransferHMT() public {
    //     vm.prank(owner);
    //     assertEq(hmToken.balanceOf(owner), 1000000000000000000);
    //     vm.prank(owner);
    //     hmToken.transfer(acc1, 600);
    //     uint256 balanceAfterOwner = hmToken.balanceOf(owner);
    //     assertEq(hmToken.balanceOf(acc1), 600);
    //     assertEq(hmToken.balanceOf(owner), balanceAfterOwner);
    // }

    // function testFunctionSelector() external view returns (bytes4) {
    //     return bytes4(keccak256("setMinimumStake(uint256)"));
    // }

    function testStake() public {
        vm.startPrank(owner);
        address implementation = address(new Staking());
        address proxy = address(new ERC1967Proxy(implementation, ""));
        Staking staking = Staking(proxy);
        // Data for the delegatecall
        bytes memory data = abi.encodeWithSelector(Staking.stake.selector, 20000);
        // Execute delegatecall
        (bool success, bytes memory returnData) = proxy.delegatecall(data);
        require(success, "delegatecall to stake failed");

        // Check the stakes mapping
        bytes memory stakesData = abi.encodeWithSelector(Staking.getStaker.selector, owner);
        (bool successData, bytes memory returnStakesData) = proxy.delegatecall(stakesData);

        vm.stopPrank();
    }
}
