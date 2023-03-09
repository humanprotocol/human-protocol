use multiversx_sc::types::Address;
use multiversx_sc_scenario::{testing_framework::{ContractObjWrapper, BlockchainStateWrapper}, DebugApi};



pub struct ReputationSetup<Builder>
where
    Builder: 'static + Copy + Fn() -> reputation::ContractObj<DebugApi>
{
    pub b_wrapper: BlockchainStateWrapper,
    pub c_wrapper: ContractObjWrapper<reputation::ContractObj<DebugApi>, Builder>,
    pub owner: Address
}

impl<Builder> ReputationSetup<Builder>
where
    Builder: 'static + Copy + Fn() -> reputation::ContractObj<DebugApi>
{
    
}
