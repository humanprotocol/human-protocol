multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(Debug, TypeAbi, TopEncode, TopDecode)]
pub struct Staker<T: ManagedTypeApi> {
    pub token_staked: BigUint<T>,
    pub tokens_allocated: BigUint<T>,
    pub tokens_locked: BigUint<T>,
    pub tokens_locked_until: u64,
}

impl<T: ManagedTypeApi> Staker<T> {
    pub fn new() -> Self {
        Self {
            token_staked: BigUint::zero(),
            tokens_allocated: BigUint::zero(),
            tokens_locked: BigUint::zero(),
            tokens_locked_until: 0
        }
    }

    pub fn deposit(&mut self, tokens: &BigUint<T>) {
        self.token_staked += tokens;
    }

    pub fn tokens_used(&self) -> BigUint<T> {
        &self.tokens_allocated + &self.tokens_locked
    }

    pub fn tokens_available(&self) -> BigUint<T> {
        &self.token_staked - &self.tokens_used()
    }

    pub fn tokens_secure_stake(&self) -> BigUint<T> {
        &self.token_staked - &self.tokens_locked
    }

    pub fn tokens_withdrawable(&self, block_number: u64) -> BigUint<T> {
       if self.tokens_locked_until == 0 || block_number < self.tokens_locked_until {
           return BigUint::zero();
       }

       self.tokens_locked.clone()
    }

    /// Return all tokens available for withdrawal
    pub fn withdraw_tokens(&mut self, block_number: u64) -> BigUint<T> {
        let tokens_to_withdraw = self.tokens_withdrawable(block_number);

        if tokens_to_withdraw > 0 {
            self.unlock_tokens(&tokens_to_withdraw);
            self.withdraw(&tokens_to_withdraw);
        }

        return tokens_to_withdraw
    }

    pub fn lock_tokens(&mut self, tokens: &BigUint<T>, period: u64, block_number: u64) {
        let mut locking_period = period;
        if self.tokens_locked > 0 {
            let blocks_diff = if self.tokens_locked_until > block_number {
                BigUint::from(self.tokens_locked_until - block_number)
            } else {
                BigUint::zero()
            };

            locking_period = self.weighted_average(
                &blocks_diff,
                &self.tokens_locked,
                &BigUint::from(period),
                tokens
            );
        }

        self.tokens_locked = &self.tokens_locked + tokens;
        self.tokens_locked_until = block_number + locking_period;
    }

    fn unlock_tokens(&mut self, tokens: &BigUint<T>) {
        self.tokens_locked = &self.tokens_locked - tokens;
        if self.tokens_locked == 0 {
            self.tokens_locked_until = 0;
        }
    }

    fn withdraw(&mut self, tokens: &BigUint<T>) {
        self.token_staked = &self.token_staked - tokens;
    }

    fn weighted_average(
        &self,
        value_a: &BigUint<T>,
        weight_a: &BigUint<T>,
        value_b: &BigUint<T>,
        weight_b: &BigUint<T>,
    ) -> u64 {
        let avg = value_a * weight_a + value_b * weight_b / (weight_a + weight_b);
        if avg > BigUint::from(u64::MAX) {
            panic!("weighted_average overflow");
        }

        avg.to_u64().unwrap()
    }

    pub fn unallocate(&mut self, tokens: &BigUint<T>) {
        self.tokens_allocated -= tokens;
    }

    pub fn release(&mut self, tokens: &BigUint<T>) {
        self.token_staked -= tokens;
    }

    pub fn allocate(&mut self, tokens: &BigUint<T>) {
        self.tokens_allocated += tokens;
    }

    pub fn is_empty(&self) -> bool {
        self.token_staked == 0 && self.tokens_allocated == 0 && self.tokens_locked == 0
    }
}

#[derive(Debug, TypeAbi, TopEncode, TopDecode)]
pub struct Allocation<T: ManagedTypeApi> {
    pub escrow_address: ManagedAddress<T>,
    pub staker: ManagedAddress<T>,
    pub tokens: BigUint<T>,
    pub created_at: u64,
    pub closed_at: u64,
}

#[derive(Debug, TypeAbi, TopEncode, TopDecode, PartialEq, Eq)]
pub enum AllocationState {
    Null,
    Pending,
    Active,
    Closed,
    Completed
}