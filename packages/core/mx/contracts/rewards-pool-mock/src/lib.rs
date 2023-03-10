#![no_std]

multiversx_sc::imports!();


#[multiversx_sc::contract]
pub trait RewardsPoolMockContract {

    #[init]
    fn init(&self) {

    }

    #[payable("*")]
    #[endpoint(addRewards)]
    fn add_rewards(&self, _escrow_address: ManagedAddress, _slasher: ManagedAddress) {
        require!(self.blockchain().get_caller() == self.staking_contract_address().get(), "Only staking contract can call this function");
        let payment = self.call_value().single_esdt();

        require!(payment.token_nonce == 0, "Invalid token nonce");
        require!(payment.amount > 0, "Amount must be greater than 0");
    }

    #[endpoint(setStakingContractAddress)]
    fn set_staking_contract_address(&self, staking_contract_address: ManagedAddress) {
        self.staking_contract_address().set(&staking_contract_address);
    }

    #[storage_mapper("staking_contract_address")]
    fn staking_contract_address(&self) -> SingleValueMapper<ManagedAddress>;
}
