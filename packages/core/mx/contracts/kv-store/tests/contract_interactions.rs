use kv_store::KVStoreContract;
use multiversx_sc::types::Address;
use multiversx_sc_scenario::{DebugApi, rust_biguint, managed_buffer};
use multiversx_sc_scenario::testing_framework::{BlockchainStateWrapper, ContractObjWrapper};

pub const WASM_PATH: &'static str = "../output/kv-store.wasm";

pub struct KVSetup<Builder>
where
    Builder: 'static + Copy + Fn() -> kv_store::ContractObj<DebugApi>
{
    pub b_wrapper: BlockchainStateWrapper,
    pub c_wrapper: ContractObjWrapper<kv_store::ContractObj<DebugApi>, Builder>,
    pub owner: Address
}

impl<Builder> KVSetup<Builder>
where
    Builder: 'static + Copy + Fn() -> kv_store::ContractObj<DebugApi>
{
    pub fn new(builder: Builder) -> Self {
        let rust_zero = rust_biguint!(0u64);
        let mut blockchain_wrapper = BlockchainStateWrapper::new();
        let owner_address = blockchain_wrapper.create_user_account(&rust_zero);

        let contract_wrapper = blockchain_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner_address),
            builder,
            WASM_PATH,
        );

        blockchain_wrapper
            .execute_tx(&owner_address, &contract_wrapper, &rust_zero, |sc| {
                sc.init()
            })
            .assert_ok();

        Self {
            b_wrapper: blockchain_wrapper,
            c_wrapper: contract_wrapper,
            owner: owner_address
        }
    }

    pub fn get(&mut self, key: &[u8], expected: &[u8], caller: &Address) {
        self.b_wrapper
            .execute_tx(&caller, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                let value = sc.get(managed_buffer!(key));
                assert_eq!(value, managed_buffer!(expected));
            })
            .assert_ok()
    }

    pub fn set(&mut self, key: &[u8], value: &[u8], caller: &Address) {
        self.b_wrapper
            .execute_tx(&caller, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                sc.set(managed_buffer!(key), managed_buffer!(value));
            })
            .assert_ok()
    }

    pub fn create_user(&mut self) -> Address{
        self.b_wrapper.create_user_account(&rust_biguint!(0u64))
    }
}
