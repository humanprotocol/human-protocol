#![no_std]
multiversx_sc::imports!();

const JOB_CONTRACT_DURATION: u64 = 100 * 24 * 60 * 60;  // 100 days

#[multiversx_sc::contract]
pub trait EscrowFactoryContract {

    #[init]
    fn init(&self) {}

    #[endpoint(createJob)]
    fn create_job(&self, trusted_handlers: MultiValueEncoded<ManagedAddress>) -> ManagedAddress {
        let canceller = self.blockchain().get_caller();
        let job_token = self.token().get();

        let mut arguments = ManagedArgBuffer::new();
        arguments.push_arg(job_token);
        arguments.push_arg(canceller.clone());
        arguments.push_arg(JOB_CONTRACT_DURATION.to_be_bytes());
        for trusted_handler in trusted_handlers {
            arguments.push_arg(trusted_handler);
        }

        let (job_address, _) = Self::Api::send_api_impl()
            .deploy_from_source_contract(
                self.blockchain().get_gas_left(),
                &BigUint::zero(),
                &self.job_template_address().get(),
                CodeMetadata::UPGRADEABLE | CodeMetadata::READABLE | CodeMetadata::PAYABLE | CodeMetadata::PAYABLE_BY_SC,
                &arguments,
            );

        self.jobs().insert(job_address.clone());
        self.last_job_address(canceller).set(&job_address);

        job_address
    }

    #[view(hasJob)]
    fn has_job(&self, address: ManagedAddress) -> bool {
        self.jobs().contains(&address)
    }

    #[only_owner]
    #[endpoint(setTemplateAddress)]
    fn set_template_address(&self, address: ManagedAddress) {
        self.job_template_address().set(&address);
    }

    #[only_owner]
    #[endpoint(setToken)]
    fn set_token(&self, token: EgldOrEsdtTokenIdentifier) {
        self.token().set(&token);
    }

    #[storage_mapper("job_template_address")]
    fn job_template_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("jobs")]
    fn jobs(&self) -> SetMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("token")]
    fn token(&self) -> SingleValueMapper<EgldOrEsdtTokenIdentifier>;

    #[view(getLastJobAddress)]
    #[storage_mapper("last_job_address")]
    fn last_job_address(&self, address: ManagedAddress) -> SingleValueMapper<ManagedAddress>;
}
