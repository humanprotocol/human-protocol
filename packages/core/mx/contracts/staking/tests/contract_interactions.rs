use common_structs::escrow::EscrowStatus;
use multiversx_sc::types::Address;
use multiversx_sc_scenario::{DebugApi, rust_biguint, managed_token_id, managed_biguint, managed_address};
use multiversx_sc_scenario::testing_framework::{ContractObjWrapper, BlockchainStateWrapper};
use rewards_pool_mock::RewardsPoolMockContract;
use escrow_mock::EscrowMockContract;

use staking::StakingContract;

pub const WASM_PATH: &str = "../output/staking.wasm";
pub const ESCROW_MOCK_WASM_PATH: &str = "../../escrow-mock/output/escrow-mock.wasm";
pub const REWARDS_MOCK_WASM_PATH: &str = "../../rewards-pool-mock/output/rewards-pool-mock.wasm";
pub const HMT_TOKEN: &[u8] = b"HMT-a9k3l0";
pub const HMT_TOKEN_DECIMALS: u64 = 6;
pub const MINIMUM_STAKE: u64 = 1;  // 1 HMT(digits) * 10^6(decimals) = 1_000_000
pub const LOCKING_PERIOD: u64 = 5;

pub struct StakerTest {
    pub token_staked: u64,
    pub tokens_allocated: u64,
    pub tokens_locked: u64,
    pub tokens_locked_until: u64,
}

pub struct AllocationTest {
    pub escrow_address: Address,
    pub staker: Address,
    pub tokens: u64,
    pub created_at: u64,
    pub closed_at: u64,
}


pub struct StakingSetup<Builder, MockEscrowBuilder, MockRewardsPoolBuilder>
where
    Builder: 'static + Copy + Fn() -> staking::ContractObj<DebugApi>,
    MockEscrowBuilder: 'static + Copy + Fn() -> escrow_mock::ContractObj<DebugApi>,
    MockRewardsPoolBuilder: 'static + Copy + Fn() -> rewards_pool_mock::ContractObj<DebugApi>
{
    pub b_wrapper: BlockchainStateWrapper,
    pub c_wrapper: ContractObjWrapper<staking::ContractObj<DebugApi>, Builder>,
    pub escrow_mock_wrapper: ContractObjWrapper<escrow_mock::ContractObj<DebugApi>, MockEscrowBuilder>,
    pub rewards_mock_wrapper: ContractObjWrapper<rewards_pool_mock::ContractObj<DebugApi>, MockRewardsPoolBuilder>,
    pub owner: Address
}

impl<Builder, MockEscrowBuilder, MockRewardsPoolBuilder> StakingSetup<Builder, MockEscrowBuilder, MockRewardsPoolBuilder>
where
    Builder: 'static + Copy + Fn() -> staking::ContractObj<DebugApi>,
    MockEscrowBuilder: 'static + Copy + Fn() -> escrow_mock::ContractObj<DebugApi>,
    MockRewardsPoolBuilder: 'static + Copy + Fn() -> rewards_pool_mock::ContractObj<DebugApi>
{
    pub fn new(
        builder: Builder,
        escrow_mock_builder: MockEscrowBuilder,
        rewards_mock_builder: MockRewardsPoolBuilder
    ) -> Self {

        let rust_zero = rust_biguint!(0u64);
        let mut blockchain_wrapper = BlockchainStateWrapper::new();
        let owner_address = blockchain_wrapper.create_user_account(&rust_zero);

        let contract_wrapper = blockchain_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner_address),
            builder,
            WASM_PATH,
        );

        let escrow_mock_wrapper = blockchain_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner_address),
            escrow_mock_builder,
            ESCROW_MOCK_WASM_PATH,
        );

        let rewards_mock_wrapper = blockchain_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner_address),
            rewards_mock_builder,
            REWARDS_MOCK_WASM_PATH,
        );

        blockchain_wrapper
            .execute_tx(&owner_address, &contract_wrapper, &rust_zero, |sc| {
                sc.init(
                    managed_token_id!(HMT_TOKEN),
                    managed_biguint!(MINIMUM_STAKE) * managed_biguint!(10u64).pow(HMT_TOKEN_DECIMALS as u32),
                    LOCKING_PERIOD
                );
            })
            .assert_ok();

        blockchain_wrapper
            .execute_tx(&owner_address, &contract_wrapper, &rust_zero, |sc| {
                sc.set_rewards_pool_address(managed_address!(rewards_mock_wrapper.address_ref()));
            })
            .assert_ok();

        blockchain_wrapper
            .execute_tx(&owner_address, &rewards_mock_wrapper, &rust_zero, |sc| {
                sc.set_staking_contract_address(managed_address!(contract_wrapper.address_ref()));
            })
            .assert_ok();

        blockchain_wrapper
            .execute_tx(&owner_address, &escrow_mock_wrapper, &rust_zero, |sc| {
                sc.set_status(EscrowStatus::Launched);
            })
            .assert_ok();

        Self {
            b_wrapper: blockchain_wrapper,
            c_wrapper: contract_wrapper,
            escrow_mock_wrapper,
            rewards_mock_wrapper,
            owner: owner_address
        }
    }

    pub fn create_address(&mut self) -> Address {
        self.b_wrapper.create_user_account(&rust_biguint!(0u64))
    }

    pub fn set_staker_balance(&mut self, balance: u64, address: &Address) {
        let balance_biguint = rust_biguint!(balance) * rust_biguint!(10u64).pow(HMT_TOKEN_DECIMALS as u32);
        self.b_wrapper.set_esdt_balance(address, HMT_TOKEN, &balance_biguint);
    }

    pub fn stake(
        &mut self,
        caller: &Address,
        amount: u64,
        expected_err: Option<&str>
    ) {
        let tx = self.b_wrapper
            .execute_esdt_transfer(&caller, &self.c_wrapper, HMT_TOKEN, 0, &rust_biguint!(amount), |sc| {
                sc.stake();
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }

    pub fn check_staker_entry(&mut self, address: &Address, staker: &StakerTest) {
        self.b_wrapper.execute_query(&self.c_wrapper, |sc| {
            let managed_staker = sc.stakes(&managed_address!(address)).get();
            assert_eq!(managed_staker.token_staked, managed_biguint!(staker.token_staked));
            assert_eq!(managed_staker.tokens_allocated, managed_biguint!(staker.tokens_allocated));
            assert_eq!(managed_staker.tokens_locked, managed_biguint!(staker.tokens_locked));
            assert_eq!(managed_staker.tokens_locked_until, staker.tokens_locked_until);
        })
        .assert_ok();
    }

    pub fn check_staker_entry_removed(&mut self, address: &Address) {
        self.b_wrapper.execute_query(&self.c_wrapper, |sc| {
            assert!(sc.stakes(&managed_address!(address)).is_empty());
        })
        .assert_ok();
    }

    pub fn unstake(
        &mut self,
        caller: &Address,
        amount: u64,
        expected_err: Option<&str>
    ) {
        let tx = self.b_wrapper
            .execute_tx(&caller, &self.c_wrapper, &rust_biguint!(0), |sc| {
                sc.unstake(managed_biguint!(amount));
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }

    pub fn withdraw(
        &mut self,
        caller: &Address,
        expected_err: Option<&str>
    ) {
        let tx = self.b_wrapper
            .execute_tx(&caller, &self.c_wrapper, &rust_biguint!(0), |sc| {
                sc.withdraw_endpoint();
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }

    pub fn slash(
        &mut self,
        slasher: &Address,
        staker_address: &Address,
        tokens: u64,
        expected_err: Option<&str>
    ) {
        let escrow_address = self.escrow_mock_wrapper.address_ref().clone();
        let tx = self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0), |sc| {
                sc.slash(
                    managed_address!(slasher),
                    managed_address!(staker_address),
                    managed_address!(&escrow_address),
                    managed_biguint!(tokens)
                );
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }

    pub fn allocate(&mut self, caller: &Address, tokens: u64, expected_err: Option<&str>) {
        let escrow_address = self.escrow_mock_wrapper.address_ref().clone();
        let tx = self.b_wrapper
            .execute_tx(&caller, &self.c_wrapper, &rust_biguint!(0), |sc| {
                sc.allocate(
                    managed_address!(&escrow_address),
                    managed_biguint!(tokens)
                );
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }

    pub fn check_allocation(&mut self, allocation: &AllocationTest) {
        let escrow_address = self.escrow_mock_wrapper.address_ref().clone();
        self.b_wrapper
            .execute_query(&self.c_wrapper, |sc| {
                let managed_allocation = sc.allocations(&managed_address!(&escrow_address)).get();
                assert_eq!(managed_allocation.tokens, managed_biguint!(allocation.tokens));
            })
            .assert_ok();
    }

    pub fn set_escrow_mock_status(&mut self, status: EscrowStatus) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.escrow_mock_wrapper, &rust_biguint!(0), |sc| {
                sc.set_status(status);
            })
            .assert_ok();
    }

    pub fn close_allocation(&mut self, caller: &Address, expected_err: Option<&str>) {
        let escrow_address = self.escrow_mock_wrapper.address_ref().clone();
        let tx = self.b_wrapper
            .execute_tx(caller, &self.c_wrapper, &rust_biguint!(0), |sc| {
                sc.close_allocation(managed_address!(&escrow_address));
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }

}