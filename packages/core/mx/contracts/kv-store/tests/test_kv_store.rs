mod contract_interactions;
use contract_interactions::*;

#[test]
fn test_set_key() {
    let mut setup = KVSetup::new(kv_store::contract_obj);
    let user = setup.create_user();

    setup.set(b"key", b"value", &user);
    setup.get(b"key", b"value", &user);
}

#[test]
fn test_set_key_two_users() {
    let mut setup = KVSetup::new(kv_store::contract_obj);
    let user = setup.create_user();
    let user2 = setup.create_user();

    setup.set(b"key", b"value", &user);
    setup.set(b"key", b"value2", &user2);
    setup.get(b"key", b"value", &user);
}