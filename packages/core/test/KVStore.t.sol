pragma solidity 0.8.20;

import "forge-std/test.sol";
import "../src/HMToken.sol";
import "../src/KVStore.sol";
import "./CoreUtils.t.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

interface KVStoreEvents {
    event DataSaved(address indexed sender, string key, string value);
}

contract KVStoreTest is CoreUtils, KVStoreEvents {
    KVStore public kvStore;

    address account1;
    address account2;

    function setUp() public {
        vm.prank(owner);
        kvStore = new KVStore();
        account1 = vm.addr(1);
        account2 = vm.addr(2);
    }

    function testCorrectValueAddressStoringKeyValuePair() public {
        vm.prank(account1);
        kvStore.set("satoshi", "nakamoto");
        string memory value = kvStore.get((account1), "satoshi");
        assertEq(value, "nakamoto");
    }

    function testCorrectValueForAnotherAddress() public {
        vm.prank(account1);
        kvStore.set("satoshi", "nakamoto");
        vm.prank(account2);
        string memory value = kvStore.get((account1), "satoshi");
        assertEq(value, "nakamoto");
    }

    function testFail_TooLongKey() public {
        vm.prank(account1);
        vm.expectRevert("MAXIMUM_STRING_LENGTH");
        kvStore.set(
            "satoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamoto",
            "nakamoto"
        );
    }

    function testFail_TooLongValue() public {
        vm.prank(account1);
        vm.expectRevert("MAXIMUM_STRING_LENGTH");
        kvStore.set(
            "satoshi",
            "satoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamoto"
        );
    }

    function testOutputsAddressOnDeployment() public {
        address kvStoreAddress = address(kvStore);
        assert(kvStoreAddress != address(0)); // This checks that kvStoreAddress is a non-zero address
        console.log(kvStoreAddress);
    }

    function testStorePublicKeyAndIPFSHash() public {
        vm.startPrank(account1);
        kvStore.set("public_key", "bafkreieadxyvobae4a2ww7tytw37dw2ihvvbujj5npjepurraavtaoczcq");
        string memory value = kvStore.get(account1, "public_key");
        assertEq(value, "bafkreieadxyvobae4a2ww7tytw37dw2ihvvbujj5npjepurraavtaoczcq");
        vm.stopPrank();
    }

    // function testStoreEncryptedValueAndDecryptValue() public {
    //     vm.startPrank(account1);
    //     bytes32 encryptedValue = keccak256(abi.encodePacked("secret_value"));
    //     kvStore.set("satoshi", encryptedValue);
    //     string memory value = kvStore.get(account1, "satoshi");
    //     assertEq(value, "secret_value");
    // }

    function testFail_StoreInvalidPair() public {
        vm.prank(account1);
        vm.expectRevert("KEY_AND_VALUE_MUST_BE_LESS_HAVE_THE_SAME_LENGTH");
        string[] memory keys = new string[](1);
        string[] memory values = new string[](2);
        keys[0] = "private_key1";
        values[0] = "satoshi";
        values[1] = "satoshi";
        kvStore.setBulk(keys, values);
    }

    function testFail_StoreTooManyPairs() public {
        vm.startPrank(account1);
        vm.expectRevert("TOO_MANY_ENTRIES");
        string[] memory keys = new string[](21);
        string[] memory values = new string[](21);
        uint8 array = 21;
        // Fill the array with 21 keys
        for (uint8 i = 0; i < array; ++i) {
            keys[i] = "satoshi";
        }
        // Fill the array with 21 values
        for (uint8 i = 0; i < array; ++i) {
            values[i] = "nakamoto";
        }
        kvStore.setBulk(keys, values);
        vm.stopPrank();
    }

    function testFail_StoreLongKeyValue() public {
        vm.startPrank(account1);

        // Long Values
        string[] memory longKeys = new string[](2);
        string[] memory values = new string[](2);
        longKeys[0] =
            "satoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamoto";
        longKeys[1] =
            "satoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamoto";
        values[0] = "satoshi";
        values[1] = "satoshi";
        vm.expectRevert("MAXIMUM_STRING_LENGTH");
        kvStore.setBulk(longKeys, values);

        // Long Values
        string[] memory keys = new string[](2);
        string[] memory longValues = new string[](2);
        keys[0] = "satoshi";
        keys[1] = "satoshi";
        longValues[0] =
            "satoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamoto";
        longValues[1] =
            "satoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamotosatoshinakamoto";
        vm.expectRevert("MAXIMUM_STRING_LENGTH");
        kvStore.setBulk(keys, longValues);
        vm.stopPrank();
    }

    function testStoresMultipleValuesAndIpfsHash() public {
        vm.startPrank(account1);
        string[] memory keys = new string[](2);
        string[] memory ipfsHash = new string[](2);

        keys[0] = "public_key1";
        keys[1] = "public_key2";

        ipfsHash[0] = "bafkreieadxyvobae4a2ww7tytw37dw2ihvvbujj5npjepurraavtaoczcq";
        ipfsHash[1] = "bafkreieadxyvobae4a2ww7tytw37dw2ihvvbujj5npjepurraavtaoczcq";

        kvStore.setBulk(keys, ipfsHash);

        assertEq(kvStore.get(account1, "public_key1"), "bafkreieadxyvobae4a2ww7tytw37dw2ihvvbujj5npjepurraavtaoczcq");
        assertEq(kvStore.get(account1, "public_key2"), "bafkreieadxyvobae4a2ww7tytw37dw2ihvvbujj5npjepurraavtaoczcq");
    }
}
