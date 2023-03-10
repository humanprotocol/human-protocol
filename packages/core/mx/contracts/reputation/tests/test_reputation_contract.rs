mod contract_interactions;
use contract_interactions::*;


#[test]
fn test_deploy_contract() {
    let _ = ReputationSetup::new(
        reputation::contract_obj,
        staking_mock::contract_obj,
        MINIMUM_STAKE
    );
}

#[test]
fn test_add_reputation_staker_has_no_stake() {
    let mut setup = ReputationSetup::new(
        reputation::contract_obj,
        staking_mock::contract_obj,
        20000000
    );
    let user = setup.create_user();
    let worker1 = setup.create_user();
    let workers = vec![WorkerTest { worker_address: worker1, reputation: 10 }];

    setup.add_reputation(&user, &workers, Some("Needs to stake HMT tokens to modify reputations."));
}

#[test]
fn test_add_reputation_setting_max_reputation() {
    let mut setup = ReputationSetup::new(
        reputation::contract_obj,
        staking_mock::contract_obj,
        MINIMUM_STAKE
    );

    let user = setup.create_user();
    let worker1 = setup.create_user();

    let workers = vec![WorkerTest { worker_address: worker1.clone(), reputation: 10 }];
    setup.add_reputation(&user, &workers, None);
    setup.check_reputation(&worker1, 60);

    let workers2 = vec![WorkerTest { worker_address: worker1.clone(), reputation: 70 }];
    setup.add_reputation(&user, &workers2, None);
    setup.check_reputation(&worker1, 100);
}

#[test]
fn test_add_reputation_min_reputation_amount_given() {
    let mut setup = ReputationSetup::new(
        reputation::contract_obj,
        staking_mock::contract_obj,
        MINIMUM_STAKE
    );

    let user = setup.create_user();
    let worker1 = setup.create_user();

    let workers = vec![WorkerTest { worker_address: worker1.clone(), reputation: 5 }];
    setup.add_reputation(&user, &workers, None);
    setup.check_reputation(&worker1, 55);
}

#[test]
fn test_add_reputation_to_the_current_amount() {
    let mut setup = ReputationSetup::new(
        reputation::contract_obj,
        staking_mock::contract_obj,
        MINIMUM_STAKE
    );

    let user = setup.create_user();
    let worker1 = setup.create_user();

    let workers = vec![WorkerTest { worker_address: worker1.clone(), reputation: 5 }];
    setup.add_reputation(&user, &workers, None);
    setup.check_reputation(&worker1, 55);

    let workers2 = vec![WorkerTest { worker_address: worker1.clone(), reputation: 5 }];
    setup.add_reputation(&user, &workers2, None);
    setup.check_reputation(&worker1, 60);
}

#[test]
fn test_add_multiple_workers_reputation() {
    let mut setup = ReputationSetup::new(
        reputation::contract_obj,
        staking_mock::contract_obj,
        MINIMUM_STAKE
    );

    let user = setup.create_user();
    let worker1 = setup.create_user();
    let worker2 = setup.create_user();

    let workers = vec![
        WorkerTest { worker_address: worker1.clone(), reputation: 5 },
        WorkerTest { worker_address: worker2.clone(), reputation: 5 }
    ];
    setup.add_reputation(&user, &workers, None);
    setup.check_reputation(&worker1, 55);
    setup.check_reputation(&worker2, 55);
}

#[test]
fn test_get_reputations() {
    let mut setup = ReputationSetup::new(
        reputation::contract_obj,
        staking_mock::contract_obj,
        MINIMUM_STAKE
    );

    let user = setup.create_user();
    let worker1 = setup.create_user();
    let worker2 = setup.create_user();

    let workers = vec![
        WorkerTest { worker_address: worker1.clone(), reputation: 5 },
        WorkerTest { worker_address: worker2.clone(), reputation: 20 }
    ];
    setup.add_reputation(&user, &workers, None);
    setup.check_reputation(&worker1, 55);
    setup.check_reputation(&worker2, 70);

    let workers_payload = vec![
        WorkerTest { worker_address: worker1.clone(), reputation: 55 },
        WorkerTest { worker_address: worker2.clone(), reputation: 70 }
    ];

    setup.check_get_reputations_view(vec![&worker1, &worker2], &workers_payload);
}

#[test]
fn test_get_rewards_total_reputation_0() {
    let mut setup = ReputationSetup::new(
        reputation::contract_obj,
        staking_mock::contract_obj,
        MINIMUM_STAKE
    );

    let worker1 = setup.create_user();
    let worker2 = setup.create_user();

    setup.get_rewards(5000000000u64, vec![&worker1, &worker2], Some("Total reputation is 0"));
}

#[test]
fn test_get_rewards() {
    let mut setup = ReputationSetup::new(
        reputation::contract_obj,
        staking_mock::contract_obj,
        MINIMUM_STAKE
    );

    let user = setup.create_user();
    let worker1 = setup.create_user();
    let worker2 = setup.create_user();

    let workers = vec![
        WorkerTest { worker_address: worker1.clone(), reputation: 5 },
        WorkerTest { worker_address: worker2.clone(), reputation: 20 }
    ];
    setup.add_reputation(&user, &workers, None);
    setup.check_reputation(&worker1, 55);
    setup.check_reputation(&worker2, 70);

    setup.get_rewards(68_000000, vec![&worker1, &worker2], None);
}