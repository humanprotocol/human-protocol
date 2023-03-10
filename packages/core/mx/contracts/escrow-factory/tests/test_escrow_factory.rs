mod interactions;

use interactions::*;

use escrow;
use escrow_factory;

#[test]
fn test_deploy_factory() {
    let _ = EscrowFactorySetup::new(
        escrow_factory::contract_obj,
        escrow::contract_obj,
        staking_mock::contract_obj
    );
}

#[test]
fn test_deploy_escrow_contract() {
    let mut setup = EscrowFactorySetup::new(
        escrow_factory::contract_obj,
        escrow::contract_obj,
        staking_mock::contract_obj
    );
    setup.set_template_address();

    let oracle1 = setup.create_user();
    let oracle2 = setup.create_user();

    setup.prepare_deploy_job();
    setup.create_escrow(vec![oracle1, oracle2]);
}