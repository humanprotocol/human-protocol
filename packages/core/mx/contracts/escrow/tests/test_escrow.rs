mod interactions;
use interactions::*;


#[test]
fn test_add_trusted_handler() {
    let mut setup = EscrowSetup::new(escrow::contract_obj);
    let handler = setup.create_user_account();

    setup.add_trusted_handler_as_owner(&handler);
    setup.check_trusted_handler(&handler);

    let another_handler = setup.create_user_account();
    setup.add_trusted_handler_as_caller(&another_handler, &handler);
}

#[test]
fn test_escrow_setup_stake_out_of_bounds() {
    let mut setup = EscrowSetup::new(escrow::contract_obj);

    let handler = setup.create_user_account();
    setup.add_trusted_handler_as_owner(&handler);
    setup.check_trusted_handler(&handler);

    let reputation_oracle = setup.create_user_account();
    let recording_oracle = setup.create_user_account();

    setup.escrow_setup(
        &handler,
        &reputation_oracle,
        &recording_oracle,
        80u64,
        90u64,
        b"https://url.test/",
        b"test-hash",
        2,

        Some("Stake out of bounds")
    );
}

#[test]
fn test_escrow_setup() {
    let mut setup = EscrowSetup::new(escrow::contract_obj);

    let handler = setup.create_user_account();
    setup.add_trusted_handler_as_owner(&handler);
    setup.check_trusted_handler(&handler);

    let reputation_oracle = setup.create_user_account();
    let recording_oracle = setup.create_user_account();

    setup.check_status(common_structs::escrow::EscrowStatus::Launched);
    setup.escrow_setup(
        &handler,
        &reputation_oracle,
        &recording_oracle,
        10u64,
        10u64,
        b"https://url.test/",
        b"test-hash",
        2,
        None
    );
    setup.check_status(common_structs::escrow::EscrowStatus::Pending);
}

#[test]
fn test_escrow_cancel() {
    let mut setup = EscrowSetup::new(escrow::contract_obj);

    let handler = setup.create_user_account();
    setup.add_trusted_handler_as_owner(&handler);
    setup.check_trusted_handler(&handler);

    let reputation_oracle = setup.create_user_account();
    let recording_oracle = setup.create_user_account();

    setup.check_status(common_structs::escrow::EscrowStatus::Launched);
    setup.escrow_setup(
        &handler,
        &reputation_oracle,
        &recording_oracle,
        10u64,
        10u64,
        b"https://url.test/",
        b"test-hash",
        2,
        None
    );

    setup.check_owner_balance(0);
    setup.check_status(common_structs::escrow::EscrowStatus::Pending);
    setup.set_contract_balance(100);

    setup.cancel();

    setup.check_status(common_structs::escrow::EscrowStatus::Cancelled);
    setup.check_owner_balance(100);
}

#[test]
fn test_store_results() {
    let mut setup = EscrowSetup::new(escrow::contract_obj);

    let handler = setup.create_user_account();
    setup.add_trusted_handler_as_owner(&handler);
    setup.check_trusted_handler(&handler);

    let reputation_oracle = setup.create_user_account();
    let recording_oracle = setup.create_user_account();

    setup.check_status(common_structs::escrow::EscrowStatus::Launched);
    setup.escrow_setup(
        &handler,
        &reputation_oracle,
        &recording_oracle,
        10u64,
        10u64,
        b"https://url.test/",
        b"test-hash",
        2,
        None
    );

    let solution = b"https://test-solution.com/";
    let solution_hash = b"test-hash";
    setup.store_results(&handler, solution, solution_hash);
    setup.check_final_solutions(solution, solution_hash);
}

#[test]
fn test_bulk_payout_partial() {
    let mut setup = EscrowSetup::new(escrow::contract_obj);

    let handler = setup.create_user_account();
    setup.add_trusted_handler_as_owner(&handler);
    setup.check_trusted_handler(&handler);

    let reputation_oracle = setup.create_user_account();
    let recording_oracle = setup.create_user_account();

    setup.check_status(common_structs::escrow::EscrowStatus::Launched);
    setup.escrow_setup(
        &handler,
        &reputation_oracle,
        &recording_oracle,
        10u64,
        10u64,
        b"https://url.test/",
        b"test-hash",
        2,
        None
    );

    setup.check_owner_balance(0);
    setup.check_status(common_structs::escrow::EscrowStatus::Pending);
    let balance = setup.get_token_amount(8);
    let deposit = setup.get_token_amount(7);
    setup.set_balance(&handler, balance);
    setup.deposit(&handler, deposit);

    let account1 = setup.create_user_account();

    let recipients = vec![account1.clone()];
    let solution = b"https://test-solution.com/";
    let solution_hash = b"test-hash";

    setup.bulk_payout(
        &recipients,
        &vec![setup.get_token_amount(4)],
        solution,
        solution_hash,
        0
    );
    setup.check_status(common_structs::escrow::EscrowStatus::Partial);
    setup.check_balance(&reputation_oracle, 400_000);
    setup.check_balance(&recording_oracle, 400_000);
    setup.check_balance(&account1, setup.get_token_amount(4) - 400_000 - 400_000);
}

#[test]
fn test_bulk_payout_complete() {
    let mut setup = EscrowSetup::new(escrow::contract_obj);

    let handler = setup.create_user_account();
    setup.add_trusted_handler_as_owner(&handler);
    setup.check_trusted_handler(&handler);

    let reputation_oracle = setup.create_user_account();
    let recording_oracle = setup.create_user_account();

    setup.check_status(common_structs::escrow::EscrowStatus::Launched);
    setup.escrow_setup(
        &handler,
        &reputation_oracle,
        &recording_oracle,
        10u64,
        10u64,
        b"https://url.test/",
        b"test-hash",
        2,
        None
    );

    setup.check_owner_balance(0);
    setup.check_status(common_structs::escrow::EscrowStatus::Pending);
    let balance = setup.get_token_amount(8);
    let deposit = setup.get_token_amount(7);
    setup.set_balance(&handler, balance);
    setup.deposit(&handler, deposit);

    let account1 = setup.create_user_account();
    let account2 = setup.create_user_account();

    let recipients = vec![account1.clone(), account2.clone()];
    let solution = b"https://test-solution.com/";
    let solution_hash = b"test-hash";

    setup.bulk_payout(
        &recipients,
        &vec![setup.get_token_amount(4), setup.get_token_amount(3)],
        solution,
        solution_hash,
        0
    );
    setup.check_status(common_structs::escrow::EscrowStatus::Paid);
    setup.check_balance(&reputation_oracle, 700_000);
    setup.check_balance(&recording_oracle, 700_000);
    setup.check_balance(&account1, setup.get_token_amount(4) - 400_000 - 400_000);
    setup.check_balance(&account2, setup.get_token_amount(3) - 300_000 - 300_000);

}


#[test]
fn test_complete_escrow() {
    let mut setup = EscrowSetup::new(escrow::contract_obj);

    let handler = setup.create_user_account();
    setup.add_trusted_handler_as_owner(&handler);
    setup.check_trusted_handler(&handler);

    let reputation_oracle = setup.create_user_account();
    let recording_oracle = setup.create_user_account();

    setup.check_status(common_structs::escrow::EscrowStatus::Launched);
    setup.escrow_setup(
        &handler,
        &reputation_oracle,
        &recording_oracle,
        10u64,
        10u64,
        b"https://url.test/",
        b"test-hash",
        2,
        None
    );

    setup.check_owner_balance(0);
    setup.check_status(common_structs::escrow::EscrowStatus::Pending);
    let balance = setup.get_token_amount(8);
    let deposit = setup.get_token_amount(7);
    setup.set_balance(&handler, balance);
    setup.deposit(&handler, deposit);

    let account1 = setup.create_user_account();
    let account2 = setup.create_user_account();

    let recipients = vec![account1.clone(), account2.clone()];
    let solution = b"https://test-solution.com/";
    let solution_hash = b"test-hash";

    setup.bulk_payout(
        &recipients,
        &vec![setup.get_token_amount(4), setup.get_token_amount(3)],
        solution,
        solution_hash,
        0
    );

    setup.complete(None);
}

#[test]
fn test_job_abort() {
    let mut setup = EscrowSetup::new(escrow::contract_obj);

    let handler = setup.create_user_account();
    setup.add_trusted_handler_as_owner(&handler);
    setup.check_trusted_handler(&handler);

    let reputation_oracle = setup.create_user_account();
    let recording_oracle = setup.create_user_account();

    setup.check_status(common_structs::escrow::EscrowStatus::Launched);
    setup.escrow_setup(
        &handler,
        &reputation_oracle,
        &recording_oracle,
        10u64,
        10u64,
        b"https://url.test/",
        b"test-hash",
        2,
        None
    );

    setup.check_owner_balance(0);
    setup.check_status(common_structs::escrow::EscrowStatus::Pending);
    let balance = setup.get_token_amount(8);
    let deposit = setup.get_token_amount(7);
    setup.set_balance(&handler, balance);
    setup.deposit(&handler, deposit);

    setup.abort();

    setup.check_owner_balance(deposit);
}