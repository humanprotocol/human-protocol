mod contract_interactions;
use contract_interactions::*;
use multiversx_sc_scenario::rust_biguint;


#[test]
fn test_add_rewards_smaller_than_protocol_fee() {
    let mut setup = RewardsPoolSetup::new(rewards_pool::contract_obj);
    setup.set_mock_staker_balance(1);

    let escrow1 = setup.create_address();
    let slasher1 = setup.create_address();
    let payment_amount = 500_000; // 0.5 HMT

    setup.add_rewards_by_staker(&escrow1, &slasher1, payment_amount, None);
    setup.check_total_fee(payment_amount);
}

#[test]
fn test_add_rewards_new_entry_rewards_after_fee_0() {
    let mut setup = RewardsPoolSetup::new(rewards_pool::contract_obj);
    setup.set_mock_staker_balance(1);

    let escrow1 = setup.create_address();
    let slasher1 = setup.create_address();
    let tokens = 1_000_000; // 1 HMT

    setup.make_reward_payment(tokens);
    setup.add_rewards_by_staker(&escrow1, &slasher1, tokens, None);
    setup.check_total_fee(tokens);
}

#[test]
fn test_add_rewards_new_entry() {
    let mut setup = RewardsPoolSetup::new(rewards_pool::contract_obj);
    setup.set_mock_staker_balance(3);

    let escrow1 = setup.create_address();
    let slasher1 = setup.create_address();
    let payment_amount = 3_000_000; // 3 HMT

    setup.add_rewards_by_staker(&escrow1, &slasher1, payment_amount, None);
    setup.check_total_fee(1_000_000);
    setup.check_rewards_entry_exists(&escrow1, &slasher1, 2_000_000);
}

#[test]
fn test_distribute_rewards() {
    let mut setup = RewardsPoolSetup::new(rewards_pool::contract_obj);
    setup.set_mock_staker_balance(8);

    let escrow1 = setup.create_address();
    let slasher1 = setup.create_address();
    let slasher2 = setup.create_address();
    let slasher1_payment = 5_000_000; // 5 HMT
    let slasher2_payment = 3_000_000; // 3 HMT

    setup.make_reward_payment(slasher1_payment);
    setup.add_rewards_by_staker(&escrow1, &slasher1, slasher1_payment, None);
    setup.make_reward_payment(slasher2_payment);
    setup.add_rewards_by_staker(&escrow1, &slasher2, slasher2_payment, None);

    setup.check_total_fee(2_000_000);
    setup.b_wrapper.check_esdt_balance(&slasher1, HMT_TOKEN, &rust_biguint!(0));
    setup.b_wrapper.check_esdt_balance(&slasher2, HMT_TOKEN, &rust_biguint!(0));

    setup.distribute_rewards(&escrow1);
    setup.b_wrapper.check_esdt_balance(&slasher1, HMT_TOKEN, &rust_biguint!(4_000_000));
    setup.b_wrapper.check_esdt_balance(&slasher2, HMT_TOKEN, &rust_biguint!(2_000_000));
}

#[test]
fn test_withdraw_fees() {
    let mut setup = RewardsPoolSetup::new(rewards_pool::contract_obj);
    setup.set_mock_staker_balance(8);

    let escrow1 = setup.create_address();
    let slasher1 = setup.create_address();
    let slasher2 = setup.create_address();
    let slasher1_payment = 5_000_000; // 5 HMT
    let slasher2_payment = 3_000_000; // 3 HMT

    setup.make_reward_payment(slasher1_payment);
    setup.add_rewards_by_staker(&escrow1, &slasher1, slasher1_payment, None);
    setup.make_reward_payment(slasher2_payment);
    setup.add_rewards_by_staker(&escrow1, &slasher2, slasher2_payment, None);
    setup.check_total_fee(2_000_000);
    setup.check_owner_balance(0);

    setup.withdraw();
    setup.check_owner_balance(2_000_000);
    setup.check_total_fee(0);
}