use multiversx_sc::types::Address;
use multiversx_sc_scenario::{DebugApi, rust_biguint, managed_token_id, managed_biguint, managed_address};
use multiversx_sc_scenario::testing_framework::{BlockchainStateWrapper, ContractObjWrapper};
use rewards_pool::RewardsPoolContract;

pub const WASM_PATH: &'static str = "../output/rewards-pool.wasm";
pub const HMT_TOKEN: &[u8] = b"HMT-a9k3l0";
pub const HMT_TOKEN_DECIMALS: u64 = 6;
pub const PROTOCOL_FEE: u64 = 1;  // 1 HMT(digits) * 10^6(decimals) = 1_000_000

pub struct RewardsPoolSetup<Builder>
where
    Builder: 'static + Copy + Fn() -> rewards_pool::ContractObj<DebugApi>
{
    pub b_wrapper: BlockchainStateWrapper,
    pub c_wrapper: ContractObjWrapper<rewards_pool::ContractObj<DebugApi>, Builder>,
    pub mock_wrapper: Address,
    pub owner: Address
}

impl<Builder> RewardsPoolSetup<Builder>
where
    Builder: 'static + Copy + Fn() -> rewards_pool::ContractObj<DebugApi>
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

        let mock_staking_contract = blockchain_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner_address),
            builder,
            WASM_PATH,
        );

        blockchain_wrapper
            .execute_tx(&owner_address, &contract_wrapper, &rust_zero, |sc| {
                sc.init(
                    managed_token_id!(HMT_TOKEN),
                    managed_address!(mock_staking_contract.address_ref()),
                    managed_biguint!(PROTOCOL_FEE) * managed_biguint!(10u64).pow(HMT_TOKEN_DECIMALS as u32),
                )
            })
            .assert_ok();

        Self {
            b_wrapper: blockchain_wrapper,
            c_wrapper: contract_wrapper,
            mock_wrapper: mock_staking_contract.address_ref().clone(),
            owner: owner_address
        }
    }

    pub fn create_address(&mut self) -> Address {
        self.b_wrapper.create_user_account(&rust_biguint!(0u64))
    }

    pub fn set_mock_staker_balance(&mut self, balance: u64) {
        let balance_biguint = rust_biguint!(balance) * rust_biguint!(10u64).pow(HMT_TOKEN_DECIMALS as u32);
        self.b_wrapper.set_esdt_balance(&self.mock_wrapper, HMT_TOKEN, &balance_biguint);
    }

    pub fn check_total_fee(&mut self, expected_fee: u64) {
        self.b_wrapper
            .execute_query(&self.c_wrapper, |sc| {
                let total_fee = sc.total_fee().get();
                assert_eq!(total_fee, managed_biguint!(expected_fee));
            })
            .assert_ok();
    }

    pub fn check_rewards_entry_exists(&mut self, escrow_address: &Address, slasher: &Address, expected_rewards: u64) {
        self.b_wrapper
            .execute_query(&self.c_wrapper, |sc| {
                for reward in  sc.rewards(&managed_address!(escrow_address)).iter() {
                    if reward.slasher == managed_address!(slasher) {
                        assert_eq!(reward.tokens, managed_biguint!(expected_rewards));
                        return;
                    }
                }
            })
            .assert_ok();
    }

    pub fn add_rewards_by_staker(
        &mut self,
        escrow_address: &Address,
        slasher: &Address,
        tokens: u64,
        expected_err: Option<&str>,
    ) {
        let tx = self.b_wrapper
            .execute_tx(&self.mock_wrapper, &self.c_wrapper, &rust_biguint!(0), |sc| {
                sc.add_reward(
                    managed_address!(escrow_address),
                    managed_address!(slasher),
                    managed_biguint!(tokens)
                );
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok(),
        }
    }

    pub fn distribute_rewards(&mut self, escrow_address: &Address) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                sc.distribute_rewards(managed_address!(escrow_address));
            })
            .assert_ok();
    }

    pub fn check_owner_balance(&mut self, balance: u64) {
        self.b_wrapper.check_esdt_balance(&self.owner, HMT_TOKEN, &rust_biguint!(balance));
    }

    pub fn withdraw(&mut self) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                sc.withdraw();
            })
            .assert_ok();
    }

    pub fn make_reward_payment(&mut self, tokens: u64) {
        self.b_wrapper
            .execute_esdt_transfer(
                &self.mock_wrapper,
                &self.c_wrapper,
                &HMT_TOKEN,
                0,
                &rust_biguint!(tokens), |_| {}
            )
            .assert_ok();
    }

}