use chrono::{DateTime, Utc};
use thiserror::Error;
use serde_derive::{Deserialize, Serialize};

/// Represents various blockchain network IDs.
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub enum ChainId {
    Mainnet = 1,
    Rinkeby = 4,
    Goerli = 5,
    BscMainnet = 56,
    BscTestnet = 97,
    Polygon = 137,
    PolygonMumbai = 80001,
    Moonbeam = 1284,
    MoonbaseAlpha = 1287,
    Avalanche = 43114,
    AvalancheTestnet = 43113,
    Skale = 1273227453,
    Localhost = 1338
}

/// Represents the status of an escrow.
#[derive(Debug, Clone, PartialEq)]
pub enum EscrowStatus {
    /// Escrow is launched.
    Launched,
    /// Escrow is funded, and waiting for the results to be submitted.
    Pending,
    /// Escrow is partially paid out.
    Partial,
    /// Escrow is fully paid.
    Paid,
    /// Escrow is finished.
    Complete,
    /// Escrow is cancelled.
    Cancelled,
}

impl EscrowStatus {
    pub fn to_string_vec() -> Vec<String> {
        vec![
            String::from("Launched"),
            String::from("Pending"),
            String::from("Partial"),
            String::from("Paid"),
            String::from("Complete"),
            String::from("Cancelled"),
        ]
    }
}

pub enum Role {
  JobLauncher,
  ExchangeOracle,
  RecordingOracle,
  ReputationOracle
}

impl Role {
    pub fn to_string_vec() -> Vec<String> {
        vec![
            String::from("Job Launcher"),
            String::from("Exchange Oracle"),
            String::from("Recording Oracle"),
            String::from("Reputation Oracle")
        ]
    }
}


#[derive(Debug, Error, PartialEq, Eq)]
pub enum EthereumError {
    #[error("Invalid Ethereum Address Error")]
    InvalidEthereumAddressError,
    #[error("Transaction Failed Error")]
    TransactionFailedError,
    #[error("Invalid Argument Error")]
    InvalidArgumentError,
    #[error("Web3 Error: {0}")]
    Web3Error(String),
    #[error("Web3 Contract Error: {0}")]
    Web3ContractError(String),
    #[error("Web3 Event Error: {0}")]
    Web3EventError(String),
    #[error("Event Parsing Error")]
    EventParsingError,
    #[error("Invalid Fee Error")]
    InvalidFeeError,
    #[error("Invalid Url Error")]
    InvalidUrlError,
    #[error("Invalid Key Error")]
    InvalidKeyError,
    #[error("Empty Hash Error")]
    EmptyHashError,
    #[error("Invalid Hash Error {0} != {1}")]
    InvalidHashError(String, String),
    #[error("Escrow Address Not Provided By Factory Error")]
    EscrowAddressNotProvidedByFactoryError,
    #[error("Unknown Escrow Status Error")]
    UnknownEscrowStatusError,
    #[error("Escrow Has Invalid Status Error")]
    EscrowHasInvalidStatusError,
    #[error("Invalid Recipient Size Error")]
    InvalidRecipientsSizeError,
    #[error("Invalid Amounts Size Error")]
    InvalidAmountsSizeError,
    #[error("Invalid Trusted Handlers Size Error")]
    InvalidTrustedHandlersSizeError,
    #[error("Recipients And Amounts Must Be Same Length Error")]
    RecipientsAndAmountsMustBeSameLengthError,
    #[error("Invalid Keys Size Error")]
    InvalidKeysSizeError,
    #[error("Invalid Values Size Error")]
    InvalidValuesSizeError,
    #[error("Keys And Values Must Be Same Length Error")]
    KeysAndValuesMustBeSameLengthError,
    #[error("Escrow Does Not Have Enough Balance Error")]
    EscrowDoesNotHaveEnoughBalanceError,
    #[error("Invalid ChainId Error")]
    InvalidChainIdError,
    #[error("Invalid Dates Error: {0} must be earlier than {1}")]
    InvalidDatesError(DateTime<Utc>, DateTime<Utc>),
    #[error("Network Not Found For Chain Id Error: {0}")]
    NetworkNotFoundForChainIdError(u32),
    #[error("Escrow Not Found For Escrow Address Error: {0}")]
    EscrowNotFoundForEscrowAddressError(String),
    #[error("No Logs Found Error")]
    NoLogsFoundError,
    #[error("Invalid Token Address Found Error")]
    InvalidTokenAddressFoundError,
    #[error("Log Parsing Error: {0}")]
    LogParsingError(String),
    #[error("Escrow Cancel Error")]
    EscrowCancelError,
    #[error("Unexpected Status Code Error {0}")]
    UnexpectedStatusCodeError(u16),
    #[error("Request Error {0}")]
    RequestError(String),
    #[error("Non Positive Value Error")]
    NonPositiveValueError,
    #[error("Rewards Not Found For Slasher Address Error: {0}")]
    RewardsNotFoundForSlasherAddressError(String),
    #[error("Leaders Not Found Error")]
    LeadersNotFoundError,
    #[error("Leader Not Found Error: {0}")]
    LeaderNotFoundError(String),
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum Error {
    #[error("Invalid Token Conversion Error")]
    InvalidTokenConversionError,
    #[error("Invalid Tuple Length Error")]
    InvalidTupleLengthError
    
}
