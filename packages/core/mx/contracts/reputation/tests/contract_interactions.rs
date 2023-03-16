use multiversx_sc::types::{Address, MultiValueEncoded, BigUint};
use multiversx_sc_scenario::{DebugApi, rust_biguint, managed_address, managed_biguint};
use multiversx_sc_scenario::testing_framework::{ContractObjWrapper, BlockchainStateWrapper};
use reputation::ReputationContract;
use reputation::constants::Worker;

pub const WASM_PATH: &'static str = "../output/reputation.wasm";
pub const STAKING_MOCK_WASM_PATH: &'static str = "../../staking-mock/output/staking-mock.wasm";
pub const MINIMUM_STAKE: u64 = 1000000;

pub struct WorkerTest {
    pub worker_address: Address,
    pub reputation: u64,
}

pub struct ReputationSetup<Builder, MockBuilder>
where
    Builder: 'static + Copy + Fn() -> reputation::ContractObj<DebugApi>,
    MockBuilder: 'static + Copy + Fn() -> staking_mock::ContractObj<DebugApi>
{
    pub b_wrapper: BlockchainStateWrapper,
    pub c_wrapper: ContractObjWrapper<reputation::ContractObj<DebugApi>, Builder>,
    pub mock_wrapper: ContractObjWrapper<staking_mock::ContractObj<DebugApi>, MockBuilder>,
    pub owner: Address
}

impl<Builder, MockBuilder> ReputationSetup<Builder, MockBuilder>
where
    Builder: 'static + Copy + Fn() -> reputation::ContractObj<DebugApi>,
    MockBuilder: 'static + Copy + Fn() -> staking_mock::ContractObj<DebugApi>
{
    pub fn new(builder: Builder, mock_builder: MockBuilder, minimum_stake: u64) -> Self {
        let rust_zero = rust_biguint!(0u64);
        let mut b_wrapper = BlockchainStateWrapper::new();
        let owner = b_wrapper.create_user_account(&rust_zero);

        let c_wrapper = b_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner),
            builder,
            WASM_PATH,
        );

        let mock_wrapper = b_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner),
            mock_builder,
            STAKING_MOCK_WASM_PATH
        );

        b_wrapper
            .execute_tx(&owner, &c_wrapper, &rust_zero, |sc| {
                sc.init(managed_address!(mock_wrapper.address_ref()), managed_biguint!(minimum_stake));
            })
            .assert_ok();

        Self {
            b_wrapper,
            c_wrapper,
            mock_wrapper,
            owner
        }
    }

    pub fn add_reputation(
        &mut self,
        caller: &Address,
        workers: &Vec<WorkerTest>,
        expected_err: Option<&str>
    ) {
        let tx = self.b_wrapper
            .execute_tx(caller, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                let mut workers_wrapped = MultiValueEncoded::new();
                for worker in workers {
                    workers_wrapped.push(Worker {
                        worker_address: managed_address!(&worker.worker_address),
                        reputation: worker.reputation
                    });
                }
                sc.add_reputations(workers_wrapped)
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }

    pub fn create_user(&mut self) -> Address{
        self.b_wrapper.create_user_account(&rust_biguint!(0u64))
    }

    pub fn check_reputation(&mut self, worker_address: &Address, expected_reputation: u64) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                let actual_reputation = sc.reputations(&managed_address!(worker_address)).get();
                assert_eq!(actual_reputation, expected_reputation);
            })
            .assert_ok();
    }

    pub fn check_get_reputations_view(&mut self, worker_addresses: Vec<&Address>, expected_workers: &Vec<WorkerTest>) {
        self.b_wrapper.execute_query(&self.c_wrapper, |sc| {
            let mut worker_addresses_wrapped = MultiValueEncoded::new();
            for worker_address in worker_addresses {
                worker_addresses_wrapped.push(managed_address!(worker_address));
            }
            let workers_reputations = sc.get_reputations(worker_addresses_wrapped);

            for (i, worker) in workers_reputations.into_iter().enumerate() {
                assert_eq!(worker.worker_address, managed_address!(&expected_workers[i].worker_address));
                assert_eq!(worker.reputation, expected_workers[i].reputation);
            }
        })
        .assert_ok();
    }

    pub fn get_rewards(&mut self, balance: u64, worker_addresses: Vec<&Address>, expected_err: Option<&str>) {
        let tx = self.b_wrapper
            .execute_query(&self.c_wrapper,  |sc| {
                let mut worker_addresses_wrapped = MultiValueEncoded::new();
                for worker_address in worker_addresses {
                    worker_addresses_wrapped.push(managed_address!(worker_address));
                }
                let rewards = sc.get_rewards(managed_biguint!(balance), worker_addresses_wrapped);

                let mut sum_rewards = BigUint::zero();
                for reward in rewards {
                    sum_rewards += reward;
                }

                assert_eq!(sum_rewards, managed_biguint!(balance));
            });

        match expected_err {
            Some(err) => tx.assert_error(4, err),
            None => tx.assert_ok()
        }
    }
}
