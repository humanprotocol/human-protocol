use multiversx_sc::types::{Address, MultiValueEncoded, EgldOrEsdtTokenIdentifier};

use multiversx_sc_scenario::multiversx_chain_vm::tx_mock::TxContextRef;
use multiversx_sc_scenario::{DebugApi, rust_biguint, managed_token_id, managed_address};
use multiversx_sc_scenario::testing_framework::{BlockchainStateWrapper, ContractObjWrapper};

use escrow::{self, ContractObj};
use escrow::EscrowContract;

pub const WASM_PATH: &'static str = "output/job.wasm";
pub const HMT_TOKEN: &[u8] = b"HMT-abcdef";
pub const OTHER_TOKEN: &[u8] = b"OTHER-123456";
pub const CF_DEADLINE: u64 = 7 * 24 * 60 * 60;

pub struct ContractSetup<ContractObjBuilder>
where
    ContractObjBuilder: 'static + Copy + Fn() -> escrow::ContractObj<DebugApi>,
{
    // Blockchain specific properties
    pub blockchain_wrapper: BlockchainStateWrapper,
    pub contract_wrapper: ContractObjWrapper<escrow::ContractObj<DebugApi>, ContractObjBuilder>,

    // Contract specific properties
    pub owner_address: Address,
}

/// Setup for the Job Contract. Will initialize the contract builder and initial
/// deploy of the contract
pub fn setup_contract<ContractObjBuilder>(
    cf_builder: ContractObjBuilder
) -> ContractSetup<ContractObjBuilder>
where
    ContractObjBuilder: 'static + Copy + Fn() -> escrow::ContractObj<DebugApi>,
{
    let rust_zero = rust_biguint!(0u64);
    let mut blockchain_wrapper = BlockchainStateWrapper::new();
    let owner_address = blockchain_wrapper.create_user_account(&rust_zero);

    // Create contract wrapper
    let contract_wrapper = blockchain_wrapper.create_sc_account(
        &rust_zero,
        Some(&owner_address),
        cf_builder,
        WASM_PATH,
    );

    // Initialize the job contract closure
    let init_contract = |sc: ContractObj<TxContextRef>| {
        let token = managed_token_id!(HMT_TOKEN);
        let canceller = managed_address!(&owner_address);
        let mut trusted_callers = MultiValueEncoded::new();
        trusted_callers.push(managed_address!(&owner_address));
        sc.init(
            EgldOrEsdtTokenIdentifier::esdt(token),
            canceller,
            CF_DEADLINE,
            trusted_callers
        )
    };

    blockchain_wrapper
        .execute_tx(
            &owner_address,
            &contract_wrapper,
            &rust_zero,
            init_contract
        )
        .assert_ok();

    ContractSetup {
        blockchain_wrapper,
        owner_address,
        contract_wrapper,
    }

}

