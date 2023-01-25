mod interactions;

use interactions::*;

use escrow;
use escrow_factory;

const HMT_TOKEN: &[u8] = b"HMT-j18xl0";


#[test]
fn test_deploy_factory() {
    let _ = EscrowFactorySetup::init(
        escrow_factory::contract_obj,
        escrow::contract_obj
    );
}

#[test]
fn test_deploy_escrow_contract() {
    let mut setup = EscrowFactorySetup::init(
        escrow_factory::contract_obj,
        escrow::contract_obj
    );
    setup.set_token(HMT_TOKEN);
    setup.set_template_address(&setup.escrow_wrapper.address_ref().clone());

    let oracle1 = setup.create_user();
    let oracle2 = setup.create_user();

    setup.prepare_deploy_job();
    setup.create_escrow(vec![oracle1, oracle2]);
}