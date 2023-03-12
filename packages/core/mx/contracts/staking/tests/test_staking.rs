mod contract_interactions;
use common_structs::escrow::EscrowStatus;
use contract_interactions::*;
use multiversx_sc::types::Address;
use multiversx_sc_scenario::rust_biguint;

#[test]
fn test_stake() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );

    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);

    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 0
    };

    setup.check_staker_entry(&staker1, &expected_staker);
}

#[test]
fn test_stake_not_minimum_amount() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );

    let staker1 = setup.create_address();
    setup.set_staker_balance(1, &staker1);
    setup.stake(&staker1, 500_000, Some("Total stake is below the minimum threshold"));
}

#[test]
fn test_stake_twice() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );

    let staker1 = setup.create_address();
    setup.set_staker_balance(6, &staker1);
    setup.stake(&staker1, 3_000_000, None);

    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 0
    };

    setup.check_staker_entry(&staker1, &expected_staker);
    setup.stake(&staker1, 2_000_000, None);

    let expected_staker2 = StakerTest {
        token_staked: 5_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker2);
}

#[test]
fn test_unstake_more_than_minimum() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );

    let staker1 = setup.create_address();
    setup.set_staker_balance(6, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.unstake(&staker1, 2_700_000, Some("Total stake is below the minimum threshold"));
}

#[test]
fn test_unstake_random_caller() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(6, &staker1);
    setup.unstake(&staker1, 2_700_000, Some("Caller is not a staker"));
}

#[test]
fn test_unstake_and_withdraw_unlocked_tokens() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.b_wrapper.check_esdt_balance(&staker1, HMT_TOKEN, &rust_biguint!(0));

    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);

    // First unstake and lock 1_000_000 token
    setup.unstake(&staker1, 1_000_000, None);
    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 1_000_000,
        tokens_locked_until: 5,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);
    setup.b_wrapper.check_esdt_balance(&staker1, HMT_TOKEN, &rust_biguint!(0));
    setup.b_wrapper.set_block_nonce(10);

    // Second unstake and withdraw 1_000_000 token
    setup.unstake(&staker1, 1_000_000, None);
    let expected_staker = StakerTest {
        token_staked: 2_000_000,
        tokens_locked: 1_000_000,
        tokens_locked_until: 10 + 5,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);
    setup.b_wrapper.check_esdt_balance(&staker1, HMT_TOKEN, &rust_biguint!(1_000_000));
}

#[test]
fn test_stake_and_unstake_all() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.b_wrapper.check_esdt_balance(&staker1, HMT_TOKEN, &rust_biguint!(0));

    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);
    setup.unstake(&staker1, 3_000_000, None);
    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 3_000_000,
        tokens_locked_until: 5,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);

    setup.b_wrapper.set_block_nonce(100);
    setup.withdraw(&staker1, None);
    setup.check_staker_entry_removed(&staker1);
}

#[test]
fn test_withdraw_with_no_tokens() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);

    setup.withdraw(&staker1, Some("Stake has no available tokens for withdrawal"));
}

#[test]
fn test_withdraw_with_locked_tokens() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.b_wrapper.check_esdt_balance(&staker1, HMT_TOKEN, &rust_biguint!(0));

    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);

    // First unstake and lock 1_000_000 token
    setup.unstake(&staker1, 1_000_000, None);
    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 1_000_000,
        tokens_locked_until: 5,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);
    setup.b_wrapper.check_esdt_balance(&staker1, HMT_TOKEN, &rust_biguint!(0));

    setup.withdraw(&staker1, Some("Stake has no available tokens for withdrawal"));
}

#[test]
fn test_withdraw() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.b_wrapper.check_esdt_balance(&staker1, HMT_TOKEN, &rust_biguint!(0));

    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);

    // First unstake and lock 1_000_000 token
    setup.unstake(&staker1, 1_000_000, None);
    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 1_000_000,
        tokens_locked_until: 5,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);
    setup.b_wrapper.check_esdt_balance(&staker1, HMT_TOKEN, &rust_biguint!(0));
    setup.b_wrapper.set_block_nonce(10);

    setup.withdraw(&staker1, None);
    setup.b_wrapper.check_esdt_balance(&staker1, HMT_TOKEN, &rust_biguint!(1_000_000));
}

#[test]
fn test_allocate_with_tokens_locked() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.unstake(&staker1, 2_000_000, None);

    setup.allocate(&staker1, 2_000_000, Some("Insufficient amount of tokens in the stake"));
}

#[test]
fn test_allocate_success() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.allocate(&staker1, 2_000_000, None);
    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 2_000_000
    };
    setup.check_staker_entry(&staker1, &expected_staker);
}

#[test]
fn test_allocation_exists() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.allocate(&staker1, 1_000_000, None);
    setup.allocate(&staker1, 1_000_000, Some("Allocation already exists"));
}

#[test]
fn test_slash_not_enough_allocated_tokens() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    let slasher = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.allocate(&staker1, 1_000_000, None);
    setup.slash(&slasher, &staker1, 2_000_000, Some("Allocation must have more tokens than the amount to slash"));
}

#[test]
fn test_slash_and_add_rewards() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    let slasher = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.allocate(&staker1, 1_000_000, None);
    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 1_000_000
    };
    setup.check_staker_entry(&staker1, &expected_staker);
    let expected_allocation = AllocationTest {
        escrow_address: Address::zero(),
        staker: staker1.clone(),
        tokens: 1_000_000,
        created_at: 0,
        closed_at: 0,
    };
    setup.check_allocation(&expected_allocation);
    setup.slash(&slasher, &staker1, 500_000, None);
    let expected_staker = StakerTest {
        token_staked: 2_500_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 500_000
    };
    setup.check_staker_entry(&staker1, &expected_staker);
    let expected_allocation = AllocationTest {
        escrow_address: Address::zero(),
        staker: staker1.clone(),
        tokens: 500_000,
        created_at: 0,
        closed_at: 0,
    };
    setup.check_allocation(&expected_allocation);
}

#[test]
fn test_close_allocation_on_incomplete_escrow() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.allocate(&staker1, 1_000_000, None);

    setup.close_allocation(&staker1, Some("Allocation has no completed state"));
}

#[test]
fn test_close_allocation_too_early() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.allocate(&staker1, 1_000_000, None);
    setup.set_escrow_mock_status(EscrowStatus::Complete);

    setup.close_allocation(&staker1, Some("Allocation cannot be closed so early"));
}

#[test]
fn test_close_allocation() {
    let mut setup = StakingSetup::new(
        staking::contract_obj,
        escrow_mock::contract_obj,
        rewards_pool_mock::contract_obj
    );
    let staker1 = setup.create_address();
    setup.set_staker_balance(3, &staker1);
    setup.stake(&staker1, 3_000_000, None);
    setup.allocate(&staker1, 1_000_000, None);
    setup.set_escrow_mock_status(EscrowStatus::Complete);
    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 1_000_000
    };
    setup.check_staker_entry(&staker1, &expected_staker);
    let expected_allocation = AllocationTest {
        escrow_address: Address::zero(),
        staker: staker1.clone(),
        tokens: 1_000_000,
        created_at: 0,
        closed_at: 0,
    };
    setup.check_allocation(&expected_allocation);
    setup.b_wrapper.set_block_nonce(10);

    setup.close_allocation(&staker1, None);

    let expected_staker = StakerTest {
        token_staked: 3_000_000,
        tokens_locked: 0,
        tokens_locked_until: 0,
        tokens_allocated: 0
    };
    setup.check_staker_entry(&staker1, &expected_staker);
    let expected_allocation = AllocationTest {
        escrow_address: Address::zero(),
        staker: staker1.clone(),
        tokens: 1_000_000,
        created_at: 0,
        closed_at: 10,
    };
    setup.check_allocation(&expected_allocation);
}