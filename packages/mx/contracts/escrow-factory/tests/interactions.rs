use multiversx_sc::types::{Address, MultiValueEncoded, EgldOrEsdtTokenIdentifier};

use multiversx_sc_scenario::{DebugApi, rust_biguint, managed_address, managed_token_id};
use multiversx_sc_scenario::testing_framework::{BlockchainStateWrapper, ContractObjWrapper};

pub const FACTORY_WASM_PATH: &'static str = "../output/escrow-factory.wasm";
pub const ESCROW_WASM_PATH: &'static str = "../../job/output/escrow.wasm";

use escrow_factory::EscrowFactoryContract;


pub struct EscrowFactorySetup<EscrowFactoryBuilder, EscrowBuilder>
where
    EscrowFactoryBuilder: 'static + Copy + Fn() -> escrow_factory::ContractObj<DebugApi>,
    EscrowBuilder: 'static + Copy + Fn() -> escrow::ContractObj<DebugApi>
{
    pub b_wrapper: BlockchainStateWrapper,
    pub escrow_factory_wrapper: ContractObjWrapper<escrow_factory::ContractObj<DebugApi>, EscrowFactoryBuilder>,
    pub escrow_wrapper: ContractObjWrapper<escrow::ContractObj<DebugApi>, EscrowBuilder>,
    pub owner: Address,
}

impl<EscrowFactoryBuilder, EscrowBuilder> EscrowFactorySetup<EscrowFactoryBuilder, EscrowBuilder>
where
    EscrowFactoryBuilder: 'static + Copy + Fn() -> escrow_factory::ContractObj<DebugApi>,
    EscrowBuilder: 'static + Copy + Fn() -> escrow::ContractObj<DebugApi>
{

    pub fn init(
        factory_builder: EscrowFactoryBuilder,
        escrow_builder: EscrowBuilder
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

        b_wrapper
            .execute_tx(&owner_address,&factory_wrapper,&rust_zero, |sc| {
                sc.init();
            })
            .assert_ok();

        Self {
            b_wrapper,
            escrow_factory_wrapper: factory_wrapper,
            escrow_wrapper,
            owner: owner_address,
        }
    }

    pub fn set_template_address(&mut self, template_address: &Address) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.escrow_factory_wrapper, &rust_biguint!(0u64), |sc| {
                sc.set_template_address(managed_address!(template_address));
            })
            .assert_ok();
    }

    pub fn set_token(&mut self, token_id: &[u8]) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.escrow_factory_wrapper, &rust_biguint!(0u64), |sc| {
                let token_wrapped = EgldOrEsdtTokenIdentifier::esdt(managed_token_id!(token_id));
                sc.set_token(token_wrapped);
            })
            .assert_ok();
    }

    pub fn create_escrow(&mut self, trusted_handlers: Vec<Address>) {
        self.b_wrapper
            .execute_tx(&self.owner, &self.escrow_factory_wrapper, &rust_biguint!(0u64), |sc| {
                let mut trusted_handlers_wrapper = MultiValueEncoded::new();
                for handler in trusted_handlers {
                    trusted_handlers_wrapper.push(managed_address!(&handler));
                }
                sc.create_job(trusted_handlers_wrapper);
            })
            .assert_ok();
    }

    pub fn create_user(&mut self) -> Address {
        self.b_wrapper.create_user_account(&rust_biguint!(0u64))
    }

    pub fn prepare_deploy_job(&mut self) {
        self.b_wrapper
            .prepare_deploy_from_sc(
                &self.escrow_factory_wrapper.address_ref(),
                escrow::contract_obj
            );
    }
}


