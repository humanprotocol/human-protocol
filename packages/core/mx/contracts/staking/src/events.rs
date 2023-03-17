multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(Debug, TypeAbi, TopEncode, TopDecode)]
pub struct StakeAllocatedData<T: ManagedTypeApi> {
    pub tokens: BigUint<T>,
    pub created_at: u64,
}

#[derive(Debug, TypeAbi, TopEncode, TopDecode)]
pub struct StakeSlashedData<T: ManagedTypeApi> {
    pub tokens: BigUint<T>,
    pub slasher: ManagedAddress<T>,
}

#[derive(Debug, TypeAbi, TopEncode, TopDecode)]
pub struct AllocationClosedData<T: ManagedTypeApi> {
    pub tokens: BigUint<T>,
    pub closed_at: u64,
}

#[multiversx_sc::module]
pub trait EventsModule {

    /// Emitted when 'staker' stake tokens amount
    #[event("stake_deposited")]
    fn stake_deposited_event(
        &self,
        #[indexed] staker: &ManagedAddress,
        amount: &BigUint,
    );

    /// Emitted when `staker` unstaked and locked `tokens` amount `until` block.
    #[event("stake_locked")]
    fn stake_locked_event(
        &self,
        #[indexed] staker: &ManagedAddress,
        #[indexed] until: &u64,
        amount: &BigUint,
    );

    fn emit_stake_slashed_event(
        &self,
        staker: &ManagedAddress,
        escrow_address: &ManagedAddress,
        slasher: &ManagedAddress,
        tokens: &BigUint,
    ) {
        let stake_slashed_data = StakeSlashedData {
            tokens: tokens.clone(),
            slasher: slasher.clone(),
        };
        self.stake_slashed_event(staker, escrow_address, &stake_slashed_data);
    }

    ///  Emitted when `staker` was slashed for a total of `tokens` amount.
    #[event("stake_slashed")]
    fn stake_slashed_event(
        &self,
        #[indexed] staker: &ManagedAddress,
        #[indexed] escrow_address: &ManagedAddress,
        data: &StakeSlashedData<Self::Api>,
    );

    /// Emitted when `staker` withdraws `tokens` staked.
    #[event("stake_withdrawn")]
    fn stake_withdrawn_event(
        &self,
        #[indexed] staker: &ManagedAddress,
        amount: &BigUint,
    );

    fn emit_stake_allocated_event(
        &self,
        staker: &ManagedAddress,
        escrow_address: &ManagedAddress,
        tokens: &BigUint,
        created_at: u64
    ) {
        let stake_allocated_data = StakeAllocatedData {
            tokens: tokens.clone(),
            created_at,
        };
        self.stake_allocated_event(staker, escrow_address, &stake_allocated_data);
    }

    /// Emitted when `staker` allocated `tokens` amount to `escrowAddress`.
    #[event("stake_allocated")]
    fn stake_allocated_event(
        &self,
        #[indexed] staker: &ManagedAddress,
        #[indexed] escrow_address: &ManagedAddress,
        data: &StakeAllocatedData<Self::Api>,
    );

    fn emit_allocation_closed_event(
        &self,
        staker: &ManagedAddress,
        escrow_address: &ManagedAddress,
        tokens: &BigUint,
        closed_at: u64
    ) {
        let allocation_closed_data = AllocationClosedData {
            tokens: tokens.clone(),
            closed_at,
        };
        self.allocation_closed_event(staker, escrow_address, &allocation_closed_data);
    }

    /// Emitted when `staker` close an allocation `escrowAddress`.
    #[event("allocation_closed")]
    fn allocation_closed_event(
        &self,
        #[indexed] staker: &ManagedAddress,
        #[indexed] escrow_address: &ManagedAddress,
        data: &AllocationClosedData<Self::Api>,
    );
}