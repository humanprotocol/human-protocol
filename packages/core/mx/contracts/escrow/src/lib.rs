#![no_std]
multiversx_sc::imports!();

pub mod constants;

use common_structs::escrow::EscrowStatus;

use crate::constants::{BULK_MAX_COUNT, MAX_STAKE_PERCENTAGE};

#[multiversx_sc::contract]
pub trait EscrowContract {

    #[init]
    fn init(
        &self,
        token: TokenIdentifier,
        canceler: ManagedAddress,
        duration: u64,
        bulk_max_value: BigUint,
        trusted_callers: MultiValueEncoded<ManagedAddress>,
    ) {
        self.token().set_if_empty(token);
        self.status().set_if_empty(EscrowStatus::Launched);
        let expiration = self.blockchain().get_block_timestamp() + duration;
        self.duration().set_if_empty(expiration);
        self.launcher().set_if_empty(self.blockchain().get_caller());
        self.canceler().set_if_empty(&canceler);
        self.bulk_max_value().set_if_empty(bulk_max_value);
        if self.trusted_callers().is_empty() {
            for caller in trusted_callers {
                self.trusted_callers().insert(caller.clone());
            }
            self.trusted_callers().insert(self.blockchain().get_caller());
            self.trusted_callers().insert(canceler);
        }
    }

    #[view(getBalance)]
    fn get_balance(&self) -> BigUint {
        let contract_token = self.token().get();

        self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::esdt(contract_token), 0)
    }

    #[endpoint(addTrustedHandlers)]
    fn add_trusted_handlers(&self, trusted_handlers: MultiValueEncoded<ManagedAddress>) {
        self.require_trusted();
        for caller in trusted_handlers {
            self.trusted_callers().insert(caller.clone());
        }
    }

    #[endpoint(setup)]
    fn setup(
        &self,
        reputation_oracle: ManagedAddress,
        recording_oracle: ManagedAddress,
        reputation_oracle_stake: u64,
        recording_oracle_stake: u64,
        url: ManagedBuffer,
        hash: ManagedBuffer,
        solution_requested: u64
    ) {
        self.require_trusted();
        self.require_not_expired();
        require!(self.status().get() == EscrowStatus::Launched, "Contract is not launched");
        require!(solution_requested > 0, "Invalid or missing solutions");

        let total_stake = &reputation_oracle_stake + &recording_oracle_stake;
        require!(total_stake <= MAX_STAKE_PERCENTAGE, "Stake out of bounds");

        self.reputation_oracle_address().set(&reputation_oracle);
        self.recording_oracle_address().set(&recording_oracle);
        self.reputation_oracle_stake().set(reputation_oracle_stake);
        self.recording_oracle_stake().set(recording_oracle_stake);

        self.trusted_callers().insert(recording_oracle);
        self.trusted_callers().insert(reputation_oracle);

        self.manifest_hash().set(&hash);
        self.manifest_url().set(&url);

        self.remaining_solutions().set(solution_requested);

        self.status().set(EscrowStatus::Pending);
        self.pending_event(url, hash);
    }

    #[endpoint(abort)]
    fn abort(&self) {
        self.require_trusted();
        self.require_status(&[EscrowStatus::Launched, EscrowStatus::Pending, EscrowStatus::Partial]);
        let balance: BigUint = self.get_balance();
        if balance != 0 {
            self.cancel()
        } else {
            self.status().set(EscrowStatus::Cancelled)
        }
    }

    #[endpoint(cancel)]
    fn cancel(&self) {
        self.require_trusted();
        self.require_status(&[EscrowStatus::Launched, EscrowStatus::Pending, EscrowStatus::Partial]);
        self.require_not_broke();

        let balance: BigUint = self.get_balance();
        self.send().direct_esdt(&self.canceler().get(), &self.token().get(), 0, &balance);

        self.status().set(EscrowStatus::Cancelled)
    }

    #[endpoint(complete)]
    fn complete(&self) {
        self.require_trusted();
        self.require_not_expired();
        self.require_status(&[EscrowStatus::Paid]);
        self.status().set(EscrowStatus::Complete);
        self.completed_event();
    }

    #[endpoint(storeResults)]
    fn store_results_endpoint(&self, url: ManagedBuffer, hash: ManagedBuffer) {
        self.require_trusted();
        self.require_not_expired();
        let status = self.status().get();
        require!(
            status == EscrowStatus::Pending || status == EscrowStatus::Partial,
            "Escrow not in Pending or Partial status state"
        );

        self.store_results(&url, &hash);
        self.intermediate_storage_event(url, hash);
    }

    #[endpoint(bulkPayOut)]
    fn bulk_payout(
        &self,
        recipients: MultiValueEncoded<ManagedAddress>,
        amounts: MultiValueEncoded<BigUint>,
        url: ManagedBuffer,
        hash: ManagedBuffer,
        tx_id: u64,
    ) -> bool {
        self.require_trusted();
        self.require_not_broke();
        self.require_not_expired();
        self.require_status(&[EscrowStatus::Pending, EscrowStatus::Partial]);
        self.require_max_recipients(recipients.len());

        require!(recipients.len() == amounts.len(), "Recipients and amounts length mismatch");

        let mut balance = self.get_balance();
        let mut aggregate_bulk_amount = BigUint::zero();
        for amount in amounts.clone().into_iter() {
            aggregate_bulk_amount += amount;
        }

        require!(aggregate_bulk_amount < self.bulk_max_value().get(), "Bulk value too high");
        if balance < aggregate_bulk_amount {
            return false
        }

        self.store_results(&url, &hash);

        let (reputation_oracle_fee, recording_oracle_fee, final_amounts) = self.finalize_payouts(&amounts);

        for (i, recipient) in recipients.clone().into_iter().enumerate() {
            let amount = final_amounts.get(i);
            if *amount == 0 {
                continue
            }
            self.send().direct_esdt(&recipient, &self.token().get(), 0, &amount);
        }

        self.send().direct_esdt(&self.reputation_oracle_address().get(), &self.token().get(), 0, &reputation_oracle_fee);
        self.send().direct_esdt(&self.recording_oracle_address().get(), &self.token().get(), 0, &recording_oracle_fee);

        balance = self.get_balance();
        let mut status = self.get_status();

        if status == EscrowStatus::Pending {
            self.remaining_solutions().update(|x| *x -= recipients.len() as u64);
            status = EscrowStatus::Partial;
        }

        if balance > 0 && status == EscrowStatus::Partial && self.remaining_solutions().get() == 0 {
            self.send().direct_esdt(&self.canceler().get(), &self.token().get(), 0, &balance);
            status = EscrowStatus::Paid;
        }

        if balance == 0 && status == EscrowStatus::Partial {
            status = EscrowStatus::Paid;
        }

        self.status().set(status);


        self.bulk_transfer_event(tx_id, recipients.len() as u64);
        true
    }

    fn finalize_payouts(&self, amounts: &MultiValueEncoded<BigUint>) -> (BigUint, BigUint, ManagedVec<BigUint>){
        let mut reputation_oracle_fee = BigUint::zero();
        let mut recording_oracle_fee = BigUint::zero();
        let reputation_oracle_stake = self.reputation_oracle_stake().get();
        let recording_oracle_stake = self.recording_oracle_stake().get();

        let mut final_amounts: ManagedVec<BigUint> = ManagedVec::new();

        for given_amount in amounts.clone().into_iter() {
            let single_reputation_oracle_fee = &given_amount * reputation_oracle_stake / BigUint::from(MAX_STAKE_PERCENTAGE);
            let single_recording_oracle_fee = &given_amount * recording_oracle_stake / BigUint::from(MAX_STAKE_PERCENTAGE);
            let amount = given_amount - &single_reputation_oracle_fee - &single_recording_oracle_fee;
            reputation_oracle_fee = &reputation_oracle_fee + &single_reputation_oracle_fee;
            recording_oracle_fee = &recording_oracle_fee + &single_recording_oracle_fee;

            final_amounts.push(amount);
        }

        (reputation_oracle_fee, recording_oracle_fee, final_amounts)
    }

    fn store_results(&self, url: &ManagedBuffer, hash: &ManagedBuffer) {
        let write_on_chain = url.len() != 0 || hash.len() != 0;
        if write_on_chain {
            self.final_results_url().set(url);
            self.final_results_hash().set(hash);
        }
    }

    fn require_not_broke(&self) {
        let balance: BigUint = self.get_balance();
        require!(balance != 0, "Contract out of funds")
    }

    fn require_trusted(&self) {
        let current_caller = self.blockchain().get_caller();
        let is_launcher = self.launcher().get() == current_caller;
        let is_trusted_handler = self.trusted_callers().contains(&current_caller);

        require!(is_launcher || is_trusted_handler, "Caller is not trusted")
    }

    fn require_not_expired(&self) {
        require!(self.duration().get() > self.blockchain().get_block_timestamp(), "Contract expired");
    }

    fn require_status(&self, allowed_status: &[EscrowStatus]) {
        let current_status = self.status().get();
        require!(
            allowed_status
                .iter()
                .any(|status| current_status == *status),
            "Wrong status"
        );
    }

    fn require_sufficient_balance(&self, payments_total: &BigUint){
        let current_balance = self.get_balance();

        require!(payments_total <= &current_balance, "Not enough funds for payment");
    }

    fn require_payments_not_zero(&self, payments_total: &BigUint) {
        require!(payments_total > &BigUint::zero(), "Cannot process payments with 0 amount")
    }

    fn require_max_recipients(&self, recipients: usize) {
        require!(recipients < BULK_MAX_COUNT, "Too many recipients");
    }

    #[payable("*")]
    #[endpoint(deposit)]
    fn deposit(&self){
        self.require_trusted();
        self.require_not_expired();
        self.require_status(&[EscrowStatus::Launched, EscrowStatus::Pending, EscrowStatus::Partial]);

        let payment = self.call_value().single_esdt();
        require!(payment.token_identifier == self.token().get(), "Wrong payment token");
    }

    #[view(getStatus)]
    fn get_status(&self) -> EscrowStatus {
        self.status().get()
    }

    #[event("pending")]
    fn pending_event(&self, #[indexed] url: ManagedBuffer, #[indexed] hash: ManagedBuffer);

    #[view(getRemainingSolutions)]
    #[storage_mapper("remaining_solutions")]
    fn remaining_solutions(&self) -> SingleValueMapper<u64>;

    #[view(getToken)]
    #[storage_mapper("token")]
    fn token(&self) -> SingleValueMapper<TokenIdentifier>;

    #[storage_mapper("status")]
    fn status(&self) -> SingleValueMapper<EscrowStatus>;

    #[view(getDuration)]
    #[storage_mapper("duration")]
    fn duration(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("trusted_callers")]
    fn trusted_callers(&self) -> UnorderedSetMapper<ManagedAddress>;

    #[storage_mapper("manifest_url")]
    fn manifest_url(&self) -> SingleValueMapper<ManagedBuffer>;

    #[storage_mapper("manifest_hash")]
    fn manifest_hash(&self) -> SingleValueMapper<ManagedBuffer>;

    #[storage_mapper("final_results_url")]
    fn final_results_url(&self) -> SingleValueMapper<ManagedBuffer>;

    #[storage_mapper("final_results_hash")]
    fn final_results_hash(&self) -> SingleValueMapper<ManagedBuffer>;

    #[storage_mapper("launcher")]
    fn launcher(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("canceler")]
    fn canceler(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("reputation_oracle_address")]
    fn reputation_oracle_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("reputation_oracle_stake")]
    fn reputation_oracle_stake(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("recording_oracle_address")]
    fn recording_oracle_address(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("recording_oracle_stake")]
    fn recording_oracle_stake(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("bulk_max_value")]
    fn bulk_max_value(&self) -> SingleValueMapper<BigUint>;

    #[event("intermediate_storage")]
    fn intermediate_storage_event(
        &self,
        #[indexed] url: ManagedBuffer,
        #[indexed] hash: ManagedBuffer
    );

    #[event("bulk_transfer")]
    fn bulk_transfer_event(
        &self,
        #[indexed] tx_id: u64,
        bulk_count: u64
    );

    #[event("completed")]
    fn completed_event(&self);
}
