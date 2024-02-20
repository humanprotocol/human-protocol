use web3::{
    types::Log,
    ethabi::{Event, EventParam, ParamType, RawLog}
};
use crate::enums::EthereumError;


pub trait EthereumEvent {
    fn new() -> Self;
}

pub trait ProvideLogs<E: EthereumEvent> {
    fn parse(&self, event: &Event, logs: Vec<Log>) -> Result<web3::ethabi::Log, EthereumError> {
        let ev_hash = event.signature();
        let web3_format_hash=web3::types::H256::from_slice(&ev_hash.0);
    
        if let Some(log) = logs.iter().find(|log| log.topics.iter().any(|topic| topic == &web3_format_hash)) {
            let parsed_log = event.parse_log(RawLog {
                topics: log.topics.clone(),
                data: log.data.clone().0,
            });

            match parsed_log {
                Ok(res) => Ok(res),
                Err(err) => return Err(EthereumError::Web3EventError(err.to_string()))
            }
        } else {
            return Err(EthereumError::EventParsingError)
        }
    }
}

pub struct LaunchedV2 {
    pub event: Event
}

impl EthereumEvent for LaunchedV2 {
    fn new() -> Self {
        let params = vec![
                EventParam {
                    name: "token".to_string(),
                    kind: ParamType::Address,
                    indexed: false
                },
                EventParam {
                    name: "escrow".to_string(),
                    kind: ParamType::Address,
                    indexed: false
                },
                EventParam {
                    name: "jobRequesterId".to_string(),
                    kind: ParamType::String,
                    indexed: false
                }
            ];
    
        let event = Event {
            name: "LaunchedV2".to_string(),
            inputs: params,
            anonymous: false
        };
        Self {
            event
        }
    }
}

impl ProvideLogs<LaunchedV2> for LaunchedV2 {}


pub struct Transfer {
    pub event: Event
}

impl EthereumEvent for Transfer {
    fn new() -> Self {
        let params = vec![
                EventParam {
                    name: "_from".to_string(),
                    kind: ParamType::Address,
                    indexed: true
                },
                EventParam {
                    name: "_to".to_string(),
                    kind: ParamType::Address,
                    indexed: true
                },
                EventParam {
                    name: "_value".to_string(),
                    kind: ParamType::Uint(256),
                    indexed: false
                }
            ];
    
        let event = Event {
            name: "Transfer".to_string(),
            inputs: params,
            anonymous: false
        };
        Self {
            event
        }
    }
}

impl ProvideLogs<Transfer> for Transfer {}

pub struct IntermediateStorage {
    pub event: Event
}

impl EthereumEvent for IntermediateStorage {
    fn new() -> Self {
        let params = vec![
                EventParam {
                    name: "url".to_string(),
                    kind: ParamType::String,
                    indexed: false
                },
                EventParam {
                    name: "hash".to_string(),
                    kind: ParamType::String,
                    indexed: false
                }
            ];
    
        let event = Event {
            name: "IntermediateStorage".to_string(),
            inputs: params,
            anonymous: false
        };
        Self {
            event
        }
    }
}

impl ProvideLogs<IntermediateStorage> for IntermediateStorage {}

pub struct TrustedHandlerAdded {
    pub event: Event
}

impl EthereumEvent for TrustedHandlerAdded {
    fn new() -> Self {
        let params = vec![
                EventParam {
                    name: "handler".to_string(),
                    kind: ParamType::Address,
                    indexed: false
                },
            ];
    
        let event = Event {
            name: "TrustedHandlerAdded".to_string(),
            inputs: params,
            anonymous: false
        };
        Self {
            event
        }
    }
}

impl ProvideLogs<TrustedHandlerAdded> for TrustedHandlerAdded {}

pub struct Pending {
    pub event: Event
}

impl EthereumEvent for Pending {
    fn new() -> Self {
        let params = vec![
                EventParam {
                    name: "url".to_string(),
                    kind: ParamType::String,
                    indexed: false
                },
                EventParam {
                    name: "hash".to_string(),
                    kind: ParamType::String,
                    indexed: false
                }
            ];
    
        let event = Event {
            name: "Pending".to_string(),
            inputs: params,
            anonymous: false
        };
        Self {
            event
        }
    }
}

impl ProvideLogs<Pending> for Pending {}

pub struct BulkTransfer {
    pub event: Event
}

impl EthereumEvent for BulkTransfer {
    fn new() -> Self {
        let params = vec![
                EventParam {
                    name: "txId".to_string(),
                    kind: ParamType::Uint(256),
                    indexed: true
                },
                EventParam {
                    name: "recipients".to_string(),
                    kind: ParamType::Array(Box::new(ParamType::Address)),
                    indexed: false
                },
                EventParam {
                    name: "amounts".to_string(),
                    kind: ParamType::Uint(256),
                    indexed: false
                },
                EventParam {
                    name: "isPartial".to_string(),
                    kind: ParamType::Bool,
                    indexed: false
                }
            ];
    
        let event = Event {
            name: "BulkTransfer".to_string(),
            inputs: params,
            anonymous: false
        };
        Self {
            event
        }
    }
}

impl ProvideLogs<BulkTransfer> for BulkTransfer {}

pub struct Cancelled {
    pub event: Event
}

impl EthereumEvent for Cancelled {
    fn new() -> Self {
        let event = Event {
            name: "Cancelled".to_string(),
            inputs: vec![],
            anonymous: false
        };
        Self {
            event
        }
    }
}

impl ProvideLogs<Cancelled> for Cancelled {}

pub struct Completed {
    pub event: Event
}

impl EthereumEvent for Completed {
    fn new() -> Self {
        let event = Event {
            name: "Completed".to_string(),
            inputs: vec![],
            anonymous: false
        };
        Self {
            event
        }
    }
}

impl ProvideLogs<Completed> for Completed {}