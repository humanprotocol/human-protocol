use common_structs::escrow::EscrowStatus;
use escrow::EscrowContract;
use multiversx_sc::types::{Address, MultiValueEncoded};
use multiversx_sc_scenario::{DebugApi, rust_biguint, managed_token_id, managed_address, managed_biguint, managed_buffer};
use multiversx_sc_scenario::testing_framework::{BlockchainStateWrapper, ContractObjWrapper};

pub const HMT_TOKEN: &[u8] = b"HMT-sj19xl";
pub const HMT_DECIMALS: u64 = 6; // Only used for tests purposes as 18 decimal places would overflow u64
pub const WASM_PATH: &'static str = "../output/escrow.wasm";

pub struct EscrowSetup<Builder>
where
    Builder: 'static + Copy + Fn() -> escrow::ContractObj<DebugApi>
{
    pub b_wrapper: BlockchainStateWrapper,
    pub c_wrapper: ContractObjWrapper<escrow::ContractObj<DebugApi>, Builder>,
    pub owner: Address
}

impl<Builder> EscrowSetup<Builder>
where
    Builder: 'static + Copy + Fn() -> escrow::ContractObj<DebugApi>
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

        let bulk_max_count: u64 = (
            rust_biguint!(100u64) * rust_biguint!(10u64).pow(HMT_DECIMALS as u32)
        ).to_string().parse().unwrap();
        blockchain_wrapper
            .execute_tx(&owner_address, &contract_wrapper, &rust_zero, |sc| {
                let mut trusted_handlers = MultiValueEncoded::new();
                trusted_handlers.push(managed_address!(&owner_address));
                sc.init(
                    managed_token_id!(HMT_TOKEN),
                    managed_address!(&owner_address),
                    10000u64,
                    managed_biguint!(bulk_max_count),
                    trusted_handlers,
                )
            })
            .assert_ok();

        Self {
            b_wrapper: blockchain_wrapper,
            c_wrapper: contract_wrapper,
            owner: owner_address
        }
    }

    pub fn add_trusted_handler_as_owner(&mut self, handler: &Address) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                let mut trusted_handlers = MultiValueEncoded::new();
                trusted_handlers.push(managed_address!(handler));
                sc.add_trusted_handlers(trusted_handlers)
            })
            .assert_ok();
    }

    pub fn add_trusted_handler_as_caller(&mut self, handler: &Address, caller: &Address) {
        self.b_wrapper
            .execute_tx(&caller, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                let mut trusted_handlers = MultiValueEncoded::new();
                trusted_handlers.push(managed_address!(handler));
                sc.add_trusted_handlers(trusted_handlers)
            })
            .assert_ok();
    }

    pub fn check_trusted_handler(&mut self, handler: &Address) {
        self.b_wrapper
            .execute_query(&self.c_wrapper, |sc| {
                assert!(sc.trusted_callers().contains(&managed_address!(handler)));
            })
            .assert_ok();
    }

    pub fn create_user_account(&mut self) -> Address {
        self.b_wrapper.create_user_account(&rust_biguint!(0u64))
    }

    pub fn escrow_setup(
        &mut self,
        caller: &Address,
        reputation_oracle: &Address,
        recording_oracle: &Address,
        reputation_oracle_stake: u64,
        recording_oracle_stake: u64,
        url: &[u8],
        hash: &[u8],
        solution_requested: u64,
        expected_err: Option<&str>
    ) {
        let tx = self.b_wrapper
            .execute_tx(&caller, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                sc.setup(
                    managed_address!(reputation_oracle),
                    managed_address!(recording_oracle),
                    reputation_oracle_stake,
                    recording_oracle_stake,
                    managed_buffer!(url),
                    managed_buffer!(hash),
                    solution_requested
                );
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }

    pub fn check_status(&mut self, expected_status: EscrowStatus) {
        self.b_wrapper
            .execute_query(&self.c_wrapper, |sc| {
                assert_eq!(sc.status().get(), expected_status);
            })
            .assert_ok();
    }

    pub fn set_contract_balance(&mut self, balance: u64) {
        self.b_wrapper.set_esdt_balance(&self.c_wrapper.address_ref(), HMT_TOKEN, &rust_biguint!(balance));
    }

    pub fn set_balance(&mut self, handler: &Address, balance: u64) {
        self.b_wrapper.set_esdt_balance(handler, HMT_TOKEN, &rust_biguint!(balance));
    }

    pub fn cancel(&mut self) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                sc.cancel();
            })
            .assert_ok();
    }

    pub fn check_owner_balance(&mut self, expected_balance: u64) {
        self.b_wrapper.check_esdt_balance(&self.owner, HMT_TOKEN, &rust_biguint!(expected_balance));
    }

    pub fn check_balance(&mut self, address: &Address, expected_balance: u64) {
        self.b_wrapper.check_esdt_balance(&address, HMT_TOKEN, &rust_biguint!(expected_balance));
    }

    pub fn store_results(&mut self, caller: &Address, url: &[u8], hash: &[u8]) {
        self.b_wrapper
            .execute_tx(&caller, &self.c_wrapper, &rust_biguint!(0), |sc| {
                sc.store_results_endpoint(managed_buffer!(url), managed_buffer!(hash));
            })
            .assert_ok();
    }

    pub fn check_final_solutions(&mut self, expected_url: &[u8], expected_hash: &[u8]) {
        self.b_wrapper
            .execute_query(&self.c_wrapper, |sc| {
                assert_eq!(sc.final_results_url().get(), managed_buffer!(expected_url));
                assert_eq!(sc.final_results_hash().get(), managed_buffer!(expected_hash));
            })
            .assert_ok();
    }

    pub fn complete(&mut self, expected_err: Option<&str>) {
        let tx = self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                sc.complete();
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }

    pub fn deposit(&mut self, caller: &Address, amount: u64) {
        self.b_wrapper
            .execute_esdt_transfer(&caller, &self.c_wrapper, HMT_TOKEN, 0, &rust_biguint!(amount), |sc| {
                sc.deposit();
            })
            .assert_ok();
    }

    pub fn get_token_amount(&self, amount: u64) -> u64{
        (rust_biguint!(amount) * rust_biguint!(10).pow(HMT_DECIMALS as u32)).to_string().parse().unwrap()
    }

    pub fn bulk_payout(
        &mut self,
        recipients: &Vec<Address>,
        amounts: &Vec<u64>,
        url: &[u8],
        hash: &[u8],
        tx_id: u64,
    ) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0), |sc| {
                let mut recipients_encoded = MultiValueEncoded::new();
                let mut amounts_encoded = MultiValueEncoded::new();
                for recipient in recipients {
                    recipients_encoded.push(managed_address!(recipient));
                }
                for amount in amounts {
                    amounts_encoded.push(managed_biguint!(*amount));
                }
                sc.bulk_payout(
                    recipients_encoded,
                    amounts_encoded,
                    managed_buffer!(url),
                    managed_buffer!(hash),
                    tx_id,
                );
            })
            .assert_ok();
    }

    pub fn abort(&mut self) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0), |sc| {
                sc.abort();
            })
            .assert_ok();
    }
}