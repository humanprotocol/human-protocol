use multiversx_sc::types::{Address, MultiValueEncoded};

use multiversx_sc_scenario::{DebugApi, rust_biguint, managed_address, managed_token_id, managed_biguint};
use multiversx_sc_scenario::testing_framework::{BlockchainStateWrapper, ContractObjWrapper};

pub const FACTORY_WASM_PATH: &'static str = "../output/escrow-factory.wasm";
pub const ESCROW_WASM_PATH: &'static str = "../../job/output/escrow.wasm";
pub const STAKING_MOCK_WASM_PATH: &str = "../../staking-mock/output/staking-mock.wasm";

const HMT_TOKEN: &[u8] = b"HMT-j18xl0";

use escrow_factory::EscrowFactoryContract;

pub struct EscrowFactorySetup<EscrowFactoryBuilder, EscrowBuilder, StakingMockBuilder>
where
    EscrowFactoryBuilder: 'static + Copy + Fn() -> escrow_factory::ContractObj<DebugApi>,
    EscrowBuilder: 'static + Copy + Fn() -> escrow::ContractObj<DebugApi>,
    StakingMockBuilder: 'static + Copy + Fn() -> staking_mock::ContractObj<DebugApi>
{
    pub b_wrapper: BlockchainStateWrapper,
    pub c_wrapper: ContractObjWrapper<escrow_factory::ContractObj<DebugApi>, EscrowFactoryBuilder>,
    pub escrow_wrapper: ContractObjWrapper<escrow::ContractObj<DebugApi>, EscrowBuilder>,
    pub staking_mock_wrapper: ContractObjWrapper<staking_mock::ContractObj<DebugApi>, StakingMockBuilder>,
    pub owner: Address,
}

impl<EscrowFactoryBuilder, EscrowBuilder, StakingMockBuilder> EscrowFactorySetup<EscrowFactoryBuilder, EscrowBuilder, StakingMockBuilder>
where
    EscrowFactoryBuilder: 'static + Copy + Fn() -> escrow_factory::ContractObj<DebugApi>,
    EscrowBuilder: 'static + Copy + Fn() -> escrow::ContractObj<DebugApi>,
    StakingMockBuilder: 'static + Copy + Fn() -> staking_mock::ContractObj<DebugApi>
{

    pub fn new(
        factory_builder: EscrowFactoryBuilder,
        escrow_builder: EscrowBuilder,
        staking_mock_builder: StakingMockBuilder,
    ) -> Self {
        let rust_zero = rust_biguint!(0u64);
        let mut b_wrapper = BlockchainStateWrapper::new();
        let owner_address = b_wrapper.create_user_account(&rust_zero);

        // Create escrow factory wrapper
        let factory_wrapper = b_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner_address),
            factory_builder,
            FACTORY_WASM_PATH,
        );

        // Create escrow wrapper
        let escrow_wrapper = b_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner_address),
            escrow_builder,
            ESCROW_WASM_PATH
        );

        let staking_mock_wrapper = b_wrapper.create_sc_account(
            &rust_zero,
            Some(&owner_address),
            staking_mock_builder,
            STAKING_MOCK_WASM_PATH
        );

        b_wrapper
            .execute_tx(&owner_address,&factory_wrapper,&rust_zero, |sc| {
                sc.init(managed_address!(staking_mock_wrapper.address_ref()));
            })
            .assert_ok();

        Self {
            b_wrapper,
            c_wrapper: factory_wrapper,
            escrow_wrapper,
            staking_mock_wrapper,
            owner: owner_address,
        }
    }

    pub fn set_template_address(&mut self) {
        let tempate_address = self.escrow_wrapper.address_ref();
        self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                sc.set_template_address(managed_address!(tempate_address));
            })
            .assert_ok();
    }

    pub fn create_escrow(&mut self, trusted_handlers: Vec<Address>) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.c_wrapper, &rust_biguint!(0u64), |sc| {
                let mut trusted_handlers_wrapper = MultiValueEncoded::new();
                for handler in trusted_handlers {
                    trusted_handlers_wrapper.push(managed_address!(&handler));
                }
                sc.create_escrow(
                    managed_token_id!(HMT_TOKEN),
                    managed_biguint!(100_000_000u64),
                    trusted_handlers_wrapper
                );
            })
            .assert_ok();
    }

    pub fn create_user(&mut self) -> Address {
        self.b_wrapper.create_user_account(&rust_biguint!(0u64))
    }

    pub fn prepare_deploy_job(&mut self) {
        self.b_wrapper
            .prepare_deploy_from_sc(
                &self.c_wrapper.address_ref(),
                escrow::contract_obj
            );
    }
}


