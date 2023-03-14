#![no_std]

pub mod escrow_proxy;
pub mod rewards_pool_proxy;
pub mod events;

use common_structs::{
    stakes::{Staker, Allocation, AllocationState},
    escrow::EscrowStatus
};

multiversx_sc::imports!();

#[multiversx_sc::contract]
pub trait StakingContract:
    escrow_proxy::EscrowProxyModule
    + rewards_pool_proxy::RewardsPoolProxyModule
    + events::EventsModule
{

    #[init]
    fn init(
        &self,
        staking_token: TokenIdentifier,
        minimum_stake: BigUint,
        lock_period: u64,
    ) {
        self.staking_token().set(&staking_token);
        self.set_minimum_stake(minimum_stake);
        self.set_lock_period(lock_period);
    }

    #[only_owner]
    #[endpoint(setMinimumStake)]
    fn set_minimum_stake(&self, minimum_stake: BigUint) {
        require!(minimum_stake > 0, "Minimum stake must be greater than 0");
        self.minimum_stake().set(&minimum_stake);
    }

    #[only_owner]
    #[endpoint(setLockPeriod)]
    fn set_lock_period(&self, lock_period: u64) {
        require!(lock_period > 0, "Must be a positive number");
        self.lock_period().set(&lock_period);
    }

    #[only_owner]
    #[endpoint(setRewardsPool)]
    fn set_rewards_pool_address(&self, rewards_pool_address: ManagedAddress) {
        self.rewards_pool_contract_address().set(&rewards_pool_address);
    }

    #[payable("*")]
    #[endpoint(stake)]
    fn stake(&self) {
        let payment = self.call_value().single_esdt();
        require!(payment.token_identifier == self.staking_token().get(), "Invalid token");
        require!(payment.token_nonce == 0, "Invalid token nonce");

        let caller = self.blockchain().get_caller();
        let mut staker = self.get_or_create_staker(&caller);

        let total_stake = staker.tokens_secure_stake() + &payment.amount;
        require!(total_stake >= self.minimum_stake().get(), "Total stake is below the minimum threshold");

        staker.deposit(&payment.amount);
        self.stakes(&caller).set(&staker);

        let mut stakers_handler = self.stakers();
        if !stakers_handler.contains(&caller) {
            stakers_handler.insert(caller.clone());
        }
        self.stake_deposited_event(&caller, &payment.amount);
    }

    #[endpoint(unstake)]
    fn unstake(&self, tokens: BigUint) {
        let caller = self.blockchain().get_caller();
        require!(!self.stakes(&caller).is_empty(), "Caller is not a staker");

        let mut staker = self.stakes(&caller).get();
        require!(staker.token_staked > 0, "Must have tokens staked");
        require!(tokens > 0, "Unstake amount must be greater than 0");
        require!(staker.tokens_available() >= tokens, "Insufficient amount to unstake");

        let new_stake = staker.tokens_secure_stake() - &tokens;
        require!(new_stake == 0 || new_stake >= self.minimum_stake().get(), "Total stake is below the minimum threshold");

        let block_number = self.blockchain().get_block_nonce();
        let tokens_to_withdraw = staker.tokens_withdrawable(block_number);
        if tokens_to_withdraw > 0 {
            self.withdraw(&mut staker, &caller);
        }

        staker.lock_tokens(&tokens, self.lock_period().get(), block_number);
        self.stakes(&caller).set(&staker);

        self.stake_locked_event(&caller, &staker.tokens_locked_until, &tokens);
    }

    #[endpoint(withdraw)]
    fn withdraw_endpoint(&self) {
        let caller = self.blockchain().get_caller();
        let stakes_handler = self.stakes(&caller);
        require!(!stakes_handler.is_empty(), "Caller is not a staker");

        let mut staker = stakes_handler.get();
        self.withdraw(&mut staker, &caller);

        if staker.is_empty() {
            let mut stakers_handler = self.stakers();
            for staker in stakers_handler.iter() {
                if staker == caller {
                    stakers_handler.swap_remove(&staker);
                    self.stakes(&caller).clear();
                    return
                }
            }
        }
        self.stakes(&caller).set(staker);
    }

    #[only_owner]
    #[endpoint(slash)]
    fn slash(
        &self,
        slasher: ManagedAddress,
        staker_address: ManagedAddress,
        escrow_address: ManagedAddress,
        tokens: BigUint,
    ) {
        let stakes_handler = self.stakes(&staker_address);
        require!(!stakes_handler.is_empty(), "Invalid address for staker");
        let mut staker = stakes_handler.get();

        require!(!self.allocations(&escrow_address).is_empty(), "Invalid address for escrow");
        let mut allocation = self.allocations(&escrow_address).get();

        require!(allocation.tokens > 0, "Allocation must have tokens");
        require!(allocation.tokens > tokens, "Allocation must have more tokens than the amount to slash");
        require!(staker.tokens_allocated >= tokens, "Staker must have more tokens than the amount to slash");
        require!(staker.token_staked >= tokens, "Staker must have more tokens than the amount to slash");

        staker.unallocate(&tokens);
        staker.release(&tokens);
        allocation.tokens = allocation.tokens - &tokens;

        stakes_handler.set(&staker);
        self.allocations(&escrow_address).set(&allocation);

        let rewards_pool_contract_address = self.rewards_pool_contract_address().get();
        self.send().direct_esdt(&rewards_pool_contract_address, &self.staking_token().get(), 0, &tokens);

        self.add_reward(escrow_address.clone(), slasher.clone(), tokens.clone(), rewards_pool_contract_address);
        self.emit_stake_slashed_event(&staker_address, &escrow_address, &slasher, &tokens);
    }

    #[endpoint(allocate)]
    fn allocate(&self, escrow_address: ManagedAddress, tokens: BigUint) {
        let caller = self.blockchain().get_caller();
        let stakes_handler = self.stakes(&caller);
        require!(!stakes_handler.is_empty(), "Caller is not a staker");
        let mut staker = stakes_handler.get();

        require!(tokens > 0, "Allocation tokens must be greater than 0");
        require!(staker.tokens_available() >= tokens, "Insufficient amount of tokens in the stake");

        let allocation_state = self.get_escrow_allocation_state(&escrow_address);
        require!(allocation_state == AllocationState::Null, "Allocation already exists");

        let block_nonce = self.blockchain().get_block_nonce();
        let new_allocation = Allocation {
            escrow_address: escrow_address.clone(),
            staker: caller.clone(),
            tokens: tokens.clone(),
            created_at: block_nonce,
            closed_at: 0
        };

        self.allocations(&escrow_address).set(&new_allocation);
        staker.allocate(&tokens);
        stakes_handler.set(&staker);
        self.emit_stake_allocated_event(&caller, &escrow_address, &tokens, block_nonce);
    }

    #[endpoint(closeAllocation)]
    fn close_allocation(&self, escrow_address: ManagedAddress) {
        self.require_only_staker();

        let allocation_state = self.get_escrow_allocation_state(&escrow_address);
        require!(allocation_state == AllocationState::Completed, "Allocation has no completed state");
        require!(!self.allocations(&escrow_address).is_empty(), "Allocation does not exist on this escrow");

        let mut allocation = self.allocations(&escrow_address).get();
        allocation.closed_at = self.blockchain().get_block_nonce();
        let diff_in_blocks = if allocation.closed_at > allocation.created_at {
            allocation.closed_at - allocation.created_at
        } else {
            0
        };

        require!(diff_in_blocks > 0, "Allocation cannot be closed so early");

        self.stakes(&allocation.staker).update(|s| s.unallocate(&allocation.tokens));
        self.allocations(&escrow_address).set(&allocation);
        self.emit_allocation_closed_event(&allocation.staker, &escrow_address, &allocation.tokens, allocation.closed_at);
    }

    /// Getter that returns if an staker has any stake.
    #[view(hasStake)]
    fn has_stake(&self, staker: ManagedAddress) -> bool {
        let stakes_handler = self.stakes(&staker);
        if stakes_handler.is_empty() {
            return false
        }

        let stake = stakes_handler.get();
        stake.token_staked > 0
    }

    #[view(hasAvailableStake)]
    fn has_available_stake(&self, staker: ManagedAddress) -> bool {
        let stakes_handler = self.stakes(&staker);
        if stakes_handler.is_empty() {
            return false
        }

        let stake = stakes_handler.get();
        stake.tokens_available() > 0
    }

    /// Return boolean if escrow address is use for allocation
    #[view(isAllocation)]
    fn is_allocation(&self, escrow_address: ManagedAddress) -> bool {
        let allocation_state = self.get_escrow_allocation_state(&escrow_address);

        match allocation_state {
            AllocationState::Null => false,
            _ => true
        }
    }

    #[view(getAllocationState)]
    fn get_allocation_state(&self, escrow_address: ManagedAddress) -> AllocationState {
        self.get_escrow_allocation_state(&escrow_address)
    }

    #[view(getStakedTokens)]
    fn get_staked_tokens(&self, staker: ManagedAddress) -> BigUint {
        let stake = self.stakes(&staker).get();
        stake.token_staked
    }

    #[view(getStaker)]
    fn get_staker(&self, staker: ManagedAddress) -> Staker<Self::Api> {
        self.stakes(&staker).get()
    }

    #[view(getListOfStakers)]
    fn get_list_of_stakers(&self) -> MultiValue2<MultiValueEncoded<ManagedAddress>, MultiValueEncoded<Staker<Self::Api>>> {
        let stakers_handler = self.stakers();
        if stakers_handler.len() == 0 {
            return MultiValue2((MultiValueEncoded::new(), MultiValueEncoded::new()));
        }

        let mut stakers_list: MultiValueEncoded<Staker<Self::Api>> = MultiValueEncoded::new();
        let mut stakers_addresses: MultiValueEncoded<ManagedAddress> = MultiValueEncoded::new();
        for staker in stakers_handler.iter(){
            let stake = self.stakes(&staker).get();
            stakers_list.push(stake);
            stakers_addresses.push(staker);
        }

        MultiValue2((stakers_addresses, stakers_list))
    }

    /// Withdraw staker tokens once the lock period has passed
    fn withdraw(&self, staker: &mut Staker<Self::Api>, staker_address: &ManagedAddress) {
        let block_number = self.blockchain().get_block_nonce();
        let tokens_to_withdraw = staker.withdraw_tokens(block_number);
        require!(tokens_to_withdraw > 0, "Stake has no available tokens for withdrawal");

        self.send().direct_esdt(staker_address, &self.staking_token().get(), 0, &tokens_to_withdraw);
        self.stake_withdrawn_event(staker_address, &tokens_to_withdraw);
    }

    fn get_or_create_staker(&self, staker_address: &ManagedAddress) -> Staker<Self::Api> {
        if self.stakes(staker_address).is_empty() {
            let new_staker = Staker::new();
            self.stakes(staker_address).set(&new_staker);

            return new_staker;
        }

        self.stakes(staker_address).get()
    }

    fn get_escrow_allocation_state(&self, escrow_address: &ManagedAddress) -> AllocationState {
        if self.allocations(escrow_address).is_empty() {
            return AllocationState::Null;
        }

        let allocation = self.allocations(&escrow_address).get();
        let escrow_status = self.get_status(&escrow_address);

        if allocation.created_at != 0 && allocation.tokens > 0 && escrow_status == EscrowStatus::Pending {
            return AllocationState::Pending;
        }

        if allocation.closed_at == 0 {
            match escrow_status {
                EscrowStatus::Launched => return AllocationState::Active,
                EscrowStatus::Complete => return AllocationState::Completed,
                _ => return AllocationState::Closed,
            }
        }

        AllocationState::Closed
    }

    fn require_only_staker(&self){
        let caller = self.blockchain().get_caller();
        require!(self.stakers().contains(&caller), "Only stakers can call this function");
    }


    /// Staking token id
    #[storage_mapper("staking_token")]
    fn staking_token(&self) -> SingleValueMapper<TokenIdentifier>;

    /// Minimum amount of tokens a staker needs to stake
    #[storage_mapper("minimum_stake")]
    fn minimum_stake(&self) -> SingleValueMapper<BigUint>;

    /// Time in blocks to unstake
    #[storage_mapper("lock_period")]
    fn lock_period(&self) -> SingleValueMapper<u64>;

    /// List of stakers
    #[storage_mapper("stakers")]
    fn stakers(&self) -> UnorderedSetMapper<ManagedAddress>;

    /// Allocations
    #[view(getAllocation)]
    #[storage_mapper("allocations")]
    fn allocations(&self, escrow_address: &ManagedAddress) -> SingleValueMapper<Allocation<Self::Api>>;

    #[storage_mapper("stakes")]
    fn stakes(&self, staker: &ManagedAddress) -> SingleValueMapper<Staker<Self::Api>>;

    #[view(getRewardsPoolContractAddress)]
    #[storage_mapper("rewards_pool_contract_address")]
    fn rewards_pool_contract_address(&self) -> SingleValueMapper<ManagedAddress>;

}
