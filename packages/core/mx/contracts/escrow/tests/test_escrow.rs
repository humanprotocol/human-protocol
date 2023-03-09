mod interactions;
use interactions::*;
use multiversx_sc::codec::multi_types::OptionalValue;
use multiversx_sc::types::{ManagedAddress, MultiValueEncoded, BigUint};
use multiversx_sc_scenario::{
    rust_biguint,
    managed_address,
    managed_biguint,
    managed_buffer,
};
use multiversx_sc_scenario::multiversx_chain_vm::tx_mock::TxContextRef;
use escrow::{
    contract_obj, EscrowContract,
    base::EscrowBaseModule, status::EscrowStatus, constants::UrlHashPair
};


#[test]
fn test_job_setup() {
    let mut setup = setup_contract(contract_obj);
    let blockchain_wrapper = &mut setup.blockchain_wrapper;
    let contract_wrapper = setup.contract_wrapper;
    let owner_address = &setup.owner_address;

    let reputation_oracle = blockchain_wrapper.create_user_account(&rust_biguint!(0u64));
    let recording_oracle = blockchain_wrapper.create_user_account(&rust_biguint!(0u64));

    blockchain_wrapper.set_esdt_balance(&owner_address, OTHER_TOKEN, &rust_biguint!(100u64));
    blockchain_wrapper
        .execute_tx(&owner_address, &contract_wrapper, &rust_biguint!(0u64), |sc|{
            let rep_oracle_address = managed_address!(&reputation_oracle);
            let rec_oracle_address = managed_address!(&recording_oracle);

            sc.setup(
                rep_oracle_address,
                rec_oracle_address,
                managed_biguint!(5u64),
                managed_biguint!(7u64),
                managed_buffer!(b"http://example.com"),
                managed_buffer!(b"test-hash")
            );

            let new_callers: Vec<ManagedAddress<TxContextRef>> = vec![managed_address!(&reputation_oracle), managed_address!(&recording_oracle)];
            let has_all_callers = new_callers.iter().all(|caller| sc.trusted_callers().contains(caller));

            assert!(has_all_callers);
        })
        .assert_ok();
}

#[test]
fn test_job_cancel() {
    let mut setup = setup_contract(contract_obj);
    let blockchain_wrapper = &mut setup.blockchain_wrapper;
    let contract_wrapper = &setup.contract_wrapper;
    let owner_address = &setup.owner_address;

    blockchain_wrapper.set_esdt_balance(&owner_address, HMT_TOKEN, &rust_biguint!(100u64));
    blockchain_wrapper
        .execute_esdt_transfer(
            owner_address,
            &setup.contract_wrapper,
            HMT_TOKEN,
            0,
            &rust_biguint!(5u64), |sc| {
                sc.deposit();
            })
        .assert_ok();

    let current_balance = blockchain_wrapper.get_esdt_balance(&owner_address, HMT_TOKEN, 0);
    assert_eq!(current_balance, rust_biguint!(100u64) - rust_biguint!(5u64));

    blockchain_wrapper
        .execute_tx(&owner_address, contract_wrapper, &rust_biguint!(0u64), |sc|{
            sc.cancel()
        })
        .assert_ok();

    let current_balance = blockchain_wrapper.get_esdt_balance(&owner_address, HMT_TOKEN, 0);
    assert_eq!(current_balance, rust_biguint!(100u64));

    blockchain_wrapper.execute_query(contract_wrapper, |sc|{
        let current_status = sc.status().get();
        let expected_status = EscrowStatus::Cancelled;

        assert_eq!(current_status, expected_status);
    }).assert_ok();
}

#[test]
fn test_store_results() {
    let mut setup = setup_contract(contract_obj);
    let blockchain_wrapper = &mut setup.blockchain_wrapper;
    let contract_wrapper = &setup.contract_wrapper;
    let owner_address = &setup.owner_address;

    let test_url = b"http://example.com";
    let test_hash = b"test-hash";

    // Set status to PENDING
    blockchain_wrapper
        .execute_tx(&owner_address, contract_wrapper, &rust_biguint!(0u64), |sc|{
            sc.status().set(EscrowStatus::Pending);
        })
        .assert_ok();

    // Store results
    blockchain_wrapper
        .execute_tx(&owner_address, contract_wrapper, &rust_biguint!(0u64), |sc|{
            sc.store_results(managed_buffer!(test_url), managed_buffer!(test_hash));
        })
        .assert_ok();

    // Check if the intermediate results match the storage
    blockchain_wrapper
        .execute_query(contract_wrapper, |sc| {
            let results = sc.get_intermediate_results();
            let expected_results = UrlHashPair::new(managed_buffer!(test_url), managed_buffer!(test_hash));
            assert_eq!(results, expected_results);
        })
        .assert_ok();

}

#[test]
fn test_job_complete() {
    let mut setup = setup_contract(contract_obj);
    let blockchain_wrapper = &mut setup.blockchain_wrapper;
    let contract_wrapper = &setup.contract_wrapper;
    let owner_address = &setup.owner_address;

    // Set status to PAID
    blockchain_wrapper
        .execute_tx(&owner_address, contract_wrapper, &rust_biguint!(0u64), |sc|{
            sc.status().set(EscrowStatus::Paid);
        })
        .assert_ok();

    blockchain_wrapper
        .execute_tx(&owner_address, contract_wrapper, &rust_biguint!(0u64), |sc|{
            sc.complete()
        })
        .assert_ok();

    blockchain_wrapper.execute_query(contract_wrapper, |sc| {
        let status = sc.status().get();
        assert_eq!(status, EscrowStatus::Complete);
    }).assert_ok()
}

#[test]
fn test_job_abort() {
    let mut setup = setup_contract(contract_obj);
    let blockchain_wrapper = &mut setup.blockchain_wrapper;
    let contract_wrapper = &setup.contract_wrapper;
    let owner_address = &setup.owner_address;

    blockchain_wrapper
        .execute_tx(&owner_address, contract_wrapper, &rust_biguint!(0u64), |sc| {
            sc.abort()
        })
        .assert_ok();
}

#[test]
fn test_bulk_payout_partial() {
    let mut setup = setup_contract(contract_obj);
    let blockchain_wrapper = &mut setup.blockchain_wrapper;
    let contract_wrapper = &setup.contract_wrapper;
    let owner_address = &setup.owner_address;
    let reputation_oracle = blockchain_wrapper.create_user_account(&rust_biguint!(0u64));
    let recording_oracle = blockchain_wrapper.create_user_account(&rust_biguint!(0u64));
    let test_url = b"http://example.com";
    let test_hash = b"test-hash";

    blockchain_wrapper.set_esdt_balance(contract_wrapper.address_ref(), HMT_TOKEN, &rust_biguint!(10u64));
    blockchain_wrapper
    .execute_tx(&owner_address, &contract_wrapper, &rust_biguint!(0u64), |sc|{
        let rep_oracle_address = managed_address!(&reputation_oracle);
        let rec_oracle_address = managed_address!(&recording_oracle);

        sc.setup(
            rep_oracle_address,
            rec_oracle_address,
            managed_biguint!(7u64),
            managed_biguint!(3u64),
            managed_buffer!(b"http://example.com"),
            managed_buffer!(b"test-hash")
        );

        let new_callers: Vec<ManagedAddress<TxContextRef>> = vec![managed_address!(&reputation_oracle), managed_address!(&recording_oracle)];
        let has_all_callers = new_callers.iter().all(|caller| sc.trusted_callers().contains(caller));

        assert!(has_all_callers);
    })
    .assert_ok();

    blockchain_wrapper.execute_tx(owner_address, contract_wrapper, &rust_biguint!(0u64), |sc| {
        let mut payments: MultiValueEncoded<TxContextRef, (ManagedAddress<TxContextRef>, BigUint<TxContextRef>)> = MultiValueEncoded::new();
        payments.push((managed_address!(&reputation_oracle), managed_biguint!(5u64)));
        payments.push((managed_address!(&recording_oracle), managed_biguint!(4u64)));
        let final_results: UrlHashPair<TxContextRef> = UrlHashPair::new(managed_buffer!(test_url), managed_buffer!(test_hash));

        sc.bulk_pay_out(payments, OptionalValue::Some(final_results));
    }).assert_ok();

    blockchain_wrapper.execute_query(contract_wrapper, |sc| {
        let current_status = sc.status().get();
        let expected_status = EscrowStatus::Partial;

        assert_eq!(current_status, expected_status);
    }).assert_ok()
}

#[test]
fn test_bulk_payout_full() {
    let mut setup = setup_contract(contract_obj);
    let blockchain_wrapper = &mut setup.blockchain_wrapper;
    let contract_wrapper = &setup.contract_wrapper;
    let owner_address = &setup.owner_address;
    let reputation_oracle = blockchain_wrapper.create_user_account(&rust_biguint!(0u64));
    let recording_oracle = blockchain_wrapper.create_user_account(&rust_biguint!(0u64));
    let test_url = b"http://example.com";
    let test_hash = b"test-hash";
    let contract_balance = rust_biguint!(100u64);

    blockchain_wrapper.set_esdt_balance(contract_wrapper.address_ref(), HMT_TOKEN, &contract_balance);
    blockchain_wrapper
        .execute_tx(&owner_address, &contract_wrapper, &rust_biguint!(0u64), |sc|{
            let rep_oracle_address = managed_address!(&reputation_oracle);
            let rec_oracle_address = managed_address!(&recording_oracle);

            sc.setup(
                rep_oracle_address,
                rec_oracle_address,
                managed_biguint!(5u64),
                managed_biguint!(7u64),
                managed_buffer!(b"http://example.com"),
                managed_buffer!(b"test-hash")
            );

            let new_callers: Vec<ManagedAddress<TxContextRef>> = vec![managed_address!(&reputation_oracle), managed_address!(&recording_oracle)];
            let has_all_callers = new_callers.iter().all(|caller| sc.trusted_callers().contains(caller));

            assert!(has_all_callers);
        })
        .assert_ok();

    blockchain_wrapper
        .execute_tx(owner_address, contract_wrapper, &rust_biguint!(0u64), |sc| {
            let mut payments: MultiValueEncoded<TxContextRef, (ManagedAddress<TxContextRef>, BigUint<TxContextRef>)> = MultiValueEncoded::new();
            payments.push((managed_address!(&reputation_oracle), managed_biguint!(50u64)));
            payments.push((managed_address!(&recording_oracle), managed_biguint!(50u64)));
            let final_results: UrlHashPair<TxContextRef> = UrlHashPair::new(managed_buffer!(test_url), managed_buffer!(test_hash));

            sc.bulk_pay_out(payments, OptionalValue::Some(final_results));
        })
        .assert_ok();

    blockchain_wrapper
        .execute_query(contract_wrapper, |sc| {
            let current_status = sc.status().get();
            let expected_status = EscrowStatus::Paid;

            assert_eq!(current_status, expected_status);
        }).assert_ok()
}