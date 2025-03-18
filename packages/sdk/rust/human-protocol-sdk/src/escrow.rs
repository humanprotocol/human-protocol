use std::error::Error;

use web3::{
    ethabi::{ethereum_types::U256, Token},
    signing::{ SecretKey, SecretKeyRef },
    contract::{Contract, Options},
    transports::Http,
    types::{Address, H256},
};

use std::str::FromStr;

use crate::{enums::{EthereumError, ChainId, EscrowStatus}, events::{EthereumEvent, Transfer, LaunchedV2, ProvideLogs}, constants::{DEFAULT_TX_ID, CONFIRMATIONS_THRESHOLD, NETWORKS}};
use url::Url;

#[derive(Debug)]
pub struct EscrowCancel {
    tx_hash: H256,
    amount_refunded: u128
}

pub struct EscrowFactory {
    pub contract: Contract<Http>
}

impl EscrowFactory {
    pub fn new(web3: &web3::Web3<web3::transports::Http>, address: Address) -> Self {
        let contract: Contract<Http> = Contract::from_json(
                web3.eth(),
                address,
                include_bytes!("../../../../core/abis/EscrowFactory.json")
            )
            .unwrap();
        
        EscrowFactory {
            contract
        }
    }
}

pub struct Escrow {
    contract: Contract<Http>
}

impl Escrow {
    fn new(web3: &web3::Web3<web3::transports::Http>, address: Address) -> Self {
        let contract = Contract::from_json(
                web3.eth(),
                address,
                include_bytes!("../../../../core/abis/Escrow.json")
            )
            .unwrap();
        
        Escrow {
            contract
        }
    }
}

pub struct HMToken {
    pub contract: Contract<Http>
}

impl HMToken {
    pub fn new(web3: &web3::Web3<web3::transports::Http>, address: Address) -> Self {
        let contract: Contract<Http> = Contract::from_json(
                web3.eth(),
                address,
                include_bytes!("../../../../core/abis/HMToken.json")
            )
            .unwrap();
        
            HMToken {
            contract
        }
    }
}

/// Represents the configuration parameters for an escrow.
pub struct EscrowConfig {
    /// The address of the recording oracle.
    pub recording_oracle: String,

    /// The address of the reputation oracle.
    pub reputation_oracle: String,

    /// The address of the exchange oracle.
    pub exchange_oracle: String,

    /// The fee charged by the recording oracle for its services.
    pub recording_oracle_fee: U256,
    
    /// The fee charged by the reputation oracle for its services.
    pub reputation_oracle_fee: U256,

    /// The fee charged by the exchange oracle for its services.
    pub exchange_oracle_fee: U256,

    /// The URL pointing to the escrow's manifest file.
    pub manifest_url: String,

    /// The hash of the escrow's manifest file.
    pub manifest_hash: String,
}

impl EscrowConfig {
    pub fn new() -> Self {
        Self {
            recording_oracle: String::new(),
            reputation_oracle: String::new(),
            exchange_oracle: String::new(),
            recording_oracle_fee: U256::zero(),
            reputation_oracle_fee: U256::zero(),
            exchange_oracle_fee: U256::zero(),
            manifest_url: String::new(),
            manifest_hash: String::new(),
        }
    }
}

/// # Introduction
///
/// A client that enables performing actions on Escrow contracts and obtaining information from both the contracts and subgraph.
/// 
pub struct EscrowClient<'a> {
    web3: &'a web3::Web3<web3::transports::Http>,
    escrow_factory: EscrowFactory,
    account: SecretKey
}

impl<'a> EscrowClient<'a> {
    /// Creates a new instance of EscrowClient.
    ///
    /// # Arguments
    ///
    /// * `web3` - A reference to a `web3::Web3` instance.
    /// * `address` - An Ethereum address.
    /// * `account` - A `SecretKey` representing the account.
    ///
    /// ## Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    ///
    /// #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// let web3 = web3::Web3::new(http);
    /// let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// let account = SecretKey::from_slice(&[1; 32]).unwrap();
    ///
    /// let escrow_client = EscrowClient::new(&web3, address, account).await;
    ///
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn new(web3: &'a web3::Web3<web3::transports::Http>, address: Address, account: SecretKey) -> EscrowClient<'a> {
        let escrow_factory = EscrowFactory::new(web3, address);
        
        EscrowClient {
            web3,
            escrow_factory,
            account
        }
    }
    
    /// Creates an escrow contract.
    ///
    /// # Arguments
    ///
    /// * `token_address` - The address of the token to use for pay outs.
    /// * `trusted_handlers` - An array of addresses that can perform actions on the contract.
    /// * `job_requester_id` - The Job Requester ID.
    ///
    /// # Returns
    ///
    /// Returns the address of the created escrow contract on success.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure.
    ///
    /// # Example
    ///
    /// ```rust
    /// use std::str::FromStr;
    /// use human_protocol_sdk::{escrow::{EscrowClient}, enums::EthereumError};
    /// use web3::transports::Http;
    /// use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #   let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #   let web3 = web3::Web3::new(http);
    /// #   let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #   let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #   let escrow_client = EscrowClient::new(&web3, address, account).await;
    ///
    /// let token_address = "0x9876543210987654321098765432109876543210".to_string();
    /// let trusted_handlers = vec!["0x1111111111111111111111111111111111111111".to_string()];
    /// let job_requester_id = "1234567890".to_string();
    /// 
    /// match escrow_client.create_escrow(
    ///     token_address,
    ///     trusted_handlers,
    ///     job_requester_id
    /// ).await {
    ///     Ok(escrow_address) => println!("Escrow address: {:?}", escrow_address),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// #   Ok(())
    /// # }
    /// ```
    pub async fn create_escrow(
        &self,
        token_address: String,
        trusted_handlers: Vec<String>,
        job_requester_id: String
    ) -> Result<Address, EthereumError> {
       let token_address = match Address::from_str(&token_address) {
            Ok(address) => address,
            Err(_) => return Err(EthereumError::InvalidEthereumAddressError),
        };

        let trusted_handlers: Vec<Address> = trusted_handlers
            .iter()
            .map(|address_str| Address::from_str(address_str).map_err(|_| EthereumError::InvalidEthereumAddressError))
            .collect::<Result<Vec<_>, _>>()
            .expect("Failed to parse one or more Ethereum addresses");

        let result = self
            .escrow_factory
            .contract
            .signed_call_with_confirmations(
                "createEscrow",
                (
                    token_address,
                    trusted_handlers,
                    job_requester_id,
                ), 
                Options {
                    gas: Some(5_000_000.into()),
                    ..Default::default()
                },
                CONFIRMATIONS_THRESHOLD.into(),
                SecretKeyRef::new(&self.account)
            )
            .await;
        
        match result {
            Ok(receipt) => {
                if receipt.status.map_or(false, |status| status == 0.into()) {
                    return Err(EthereumError::TransactionFailedError)
                }

                let event = LaunchedV2::new();
                let log = event.parse(&event.event, receipt.logs).unwrap();

                if let Some(escrow_address) = log.params[1].value.clone().into_address() {
                    Ok(escrow_address)
                } else {
                    Err(EthereumError::InvalidEthereumAddressError)
                }
                
            }
            Err(err) => return Err(EthereumError::Web3Error(err.to_string()))
        }
    }

    /// Sets up the parameters of the escrow.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to set up.
    /// * `escrow_config` - Escrow configuration parameters.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if successful. Returns an `EthereumError` in case of failure.
    ///
    /// # Example
    ///
    /// ```rust
    /// use std::str::FromStr;
    /// use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// use web3::transports::Http;
    /// use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #   let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #   let web3 = web3::Web3::new(http);
    /// #   let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #   let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #   let escrow_client = EscrowClient::new(&web3, address, account).await;
    ///
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// let escrow_config = EscrowConfig {
    ///     recording_oracle: "0xaaaabbbbccccdddd111122223333444455556666".to_string(),
    ///     reputation_oracle: "0xbbbbccccddddeeeeffff11112222333344445555".to_string(),
    ///     exchange_oracle: "0xccccddddeeeeffff111122223333444455556666".to_string(),
    ///     recording_oracle_fee: 100.into(),
    ///     reputation_oracle_fee: 150.into(),
    ///     exchange_oracle_fee: 200.into(),
    ///     manifest_url: "https://example.com/escrow-manifest.json".to_string(),
    ///     manifest_hash: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string(),
    /// };
    /// 
    /// match escrow_client.setup(
    ///     escrow_address,
    ///     escrow_config
    /// ).await {
    ///     Ok(_) => println!("Escrow has been set up"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// #   Ok(())
    /// # }
    /// ```
    pub async fn setup(
        &self,
        escrow_address: Address, 
        escrow_config: EscrowConfig
    ) -> Result<(), EthereumError> {
        let EscrowConfig {
            recording_oracle,
            reputation_oracle,
            exchange_oracle,
            recording_oracle_fee,
            reputation_oracle_fee,
            exchange_oracle_fee,
            manifest_url,
            manifest_hash,
        } = escrow_config;

        let recording_oracle = match Address::from_str(&recording_oracle) {
            Ok(address) => address,
            Err(_) => return Err(EthereumError::InvalidEthereumAddressError),
        };

        let reputation_oracle = match Address::from_str(&reputation_oracle) {
            Ok(address) => address,
            Err(_) => return Err(EthereumError::InvalidEthereumAddressError),
        };

        let exchange_oracle = match Address::from_str(&exchange_oracle) {
            Ok(address) => address,
            Err(_) => return Err(EthereumError::InvalidEthereumAddressError),
        };

        if recording_oracle_fee <= U256::from(0)
            || reputation_oracle_fee <= U256::from(0)
            || exchange_oracle_fee <= U256::from(0)
            || recording_oracle_fee + reputation_oracle_fee + exchange_oracle_fee > U256::from(100)
        {
            return Err(EthereumError::InvalidFeeError);
        }

        if manifest_url.is_empty() || !EscrowClient::is_valid_url(&manifest_url) {
            return Err(EthereumError::InvalidUrlError);
        }

        if manifest_hash.is_empty() {
            return Err(EthereumError::EmptyHashError);
        }

        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let result = escrow
            .contract
            .signed_call_with_confirmations(
                "setup",
                (
                    reputation_oracle,
                    recording_oracle,
                    exchange_oracle,
                    reputation_oracle_fee,
                    recording_oracle_fee,
                    exchange_oracle_fee,
                    manifest_url,
                    manifest_hash,
                ), 
                Options {
                    gas: Some(5_000_000.into()),
                    ..Default::default()
                },
                CONFIRMATIONS_THRESHOLD.into(),
                SecretKeyRef::new(&self.account)
            )
            .await;
        
        match result {
            Ok(receipt) => {
                if receipt.status.map_or(false, |status| status == 0.into()) {
                    return Err(EthereumError::TransactionFailedError)
                }
                Ok(())
            }
            Err(err) => return Err(EthereumError::Web3Error(err.to_string()))
        }
    }

    /// Creates an escrow contract and sets up its parameters.
    ///
    /// # Arguments
    ///
    /// * `token_address` - The address of the token to use for pay outs.
    /// * `trusted_handlers` - An array of addresses that can perform actions on the contract.
    /// * `job_requester_id` - The Job Requester ID.
    /// * `escrow_config` - Escrow configuration parameters.
    ///
    /// # Returns
    ///
    /// Returns the address of the created escrow contract on success.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during creation or setup.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let token_address = "0x9876543210987654321098765432109876543210".to_string();
    /// let trusted_handlers = vec!["0x1111111111111111111111111111111111111111".to_string()];
    /// let job_requester_id = "1234567890".to_string();
    /// let escrow_config = EscrowConfig {
    ///     recording_oracle: "0xaaaabbbbccccdddd111122223333444455556666".to_string(),
    ///     reputation_oracle: "0xbbbbccccddddeeeeffff11112222333344445555".to_string(),
    ///     exchange_oracle: "0xccccddddeeeeffff111122223333444455556666".to_string(),
    ///     recording_oracle_fee: 100.into(),
    ///     reputation_oracle_fee: 150.into(),
    ///     exchange_oracle_fee: 200.into(),
    ///     manifest_url: "https://example.com/escrow-manifest.json".to_string(),
    ///     manifest_hash: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string(),
    /// };
    /// 
    /// match escrow_client.create_and_setup_escrow(
    ///     token_address, 
    ///     trusted_handlers, 
    ///     job_requester_id, 
    ///     escrow_config
    /// ).await {
    ///     Ok(_) => println!("Escrow has been created and set up"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn create_and_setup_escrow(
        &self,
        token_address: String,
        trusted_handlers: Vec<String>,
        job_requester_id: String,
        escrow_config: EscrowConfig
    ) -> Result<Address, EthereumError> {
        let escrow_address = match self.create_escrow(
            token_address,
            trusted_handlers,
            job_requester_id
        ).await {
            Ok(escrow_address) => escrow_address,
            Err(err) => return Err(err)
        };

        match self.setup(escrow_address.clone(), escrow_config).await {
            Ok(_) => Ok(escrow_address),
            Err(err) => return Err(err)
        }
    }

    /// Funds an escrow contract with a specified amount.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to fund.
    /// * `amount` - The amount to fund the escrow with.
    ///
    /// # Returns
    /// 
    /// Returns `Ok(())` if the funding is successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the funding process. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::EscrowHasInvalidStatusError`: If the status of the escrow is not `Launched`.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the token address from the escrow contract.
    /// - `EthereumError::TransactionFailedError`: If the token transfer transaction fails.
    /// - `EthereumError::Web3Error`: If there is an error interacting with the Ethereum network.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x17350792fbdf8c584790196222274ef862fef243").unwrap();
    /// let amount = 1000;
    /// 
    /// match escrow_client.fund(
    ///     escrow_address, 
    ///     amount
    /// ).await {
    ///     Ok(_) => println!("Escrow has been funded"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn fund(
        &self,
        escrow_address: Address,
        amount: u128
    ) -> Result<(), EthereumError> {
        match self.has_escrow(
            escrow_address
        ).await {
            Ok(escrow_address) => println!("fund: {:?}", escrow_address),
            Err(err) => println!("fund err: {:?}", err)
        };

        if !self
            .has_escrow(escrow_address)
            .await?
        {
            println!("fund in if: wtf");
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let status: EscrowStatus = self
            .get_status(escrow_address)
            .await
            .map_err(|err| err)?;

        if status != EscrowStatus::Pending {
            return Err(EthereumError::EscrowHasInvalidStatusError)
        }

        let token_address: Address = escrow.contract
            .query(
                "token", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;

        let token = HMToken::new(self.web3, token_address);

        let result = token
            .contract
            .signed_call_with_confirmations(
                "transfer",
                (
                    escrow_address,
                    amount,
                ), 
                Options {
                    gas: Some(5_000_000.into()),
                    ..Default::default()
                },
                CONFIRMATIONS_THRESHOLD.into(),
                SecretKeyRef::new(&self.account)
            )
            .await;
        
        match result {
            Ok(receipt) => {
                if receipt.status.map_or(false, |status| status == 0.into()) {
                    return Err(EthereumError::TransactionFailedError)
                }
                Ok(())
            }
            Err(err) => return Err(EthereumError::Web3Error(err.to_string()))
        }
    }

    /// Stores results in the escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow where results will be stored.
    /// * `url` - The URL pointing to the results.
    /// * `hash` - The hash of the results.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if the storage is successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the storage process. Possible errors include:
    ///
    /// - `EthereumError::InvalidUrlError`: If the provided URL is empty or not a valid URL.
    /// - `EthereumError::EmptyHashError`: If the provided hash is empty.
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::TransactionFailedError`: If the storage transaction fails.
    /// - `EthereumError::Web3Error`: If there is an error interacting with the Ethereum network.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// let url = "https://example.com/results.json";
    /// let hash = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    /// 
    /// match escrow_client.store_results(
    ///     escrow_address, 
    ///     url,
    ///     hash
    /// ).await {
    ///     Ok(_) => println!("Results has been stored"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn store_results(
        &self,
        escrow_address: Address,
        url: &str,
        hash: &str
    ) -> Result<(), EthereumError> {
        if url.is_empty() || !EscrowClient::is_valid_url(&url) {
            return Err(EthereumError::InvalidUrlError);
        }
    
        if hash.is_empty() {
            return Err(EthereumError::EmptyHashError);
        }
        
        if !self
            .has_escrow(escrow_address)
            .await?
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let result = escrow.contract
            .signed_call_with_confirmations(
                "storeResults",
                (
                    url.to_string(),
                    hash.to_string()
                ), 
                Options {
                    gas: Some(5_000_000.into()),
                    ..Default::default()
                },
                CONFIRMATIONS_THRESHOLD.into(),
                SecretKeyRef::new(&self.account)
            )
            .await;
        
        match result {
            Ok(receipt) => {
                if receipt.status.map_or(false, |status| status == 0.into()) {
                    return Err(EthereumError::TransactionFailedError)
                }
                Ok(())
            }
            Err(err) => return Err(EthereumError::Web3Error(err.to_string()))
        }
    }

    /// Stores results in the escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow where results will be stored.
    /// * `url` - The URL pointing to the results.
    /// * `hash` - The hash of the results.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if the storage is successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the storage process. Possible errors include:
    ///
    /// - `EthereumError::InvalidUrlError`: If the provided URL is empty or not a valid URL.
    /// - `EthereumError::EmptyHashError`: If the provided hash is empty.
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::TransactionFailedError`: If the storage transaction fails.
    /// - `EthereumError::Web3Error`: If there is an error interacting with the Ethereum network.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// let url = "https://example.com/results.json";
    /// let hash = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    /// 
    /// match escrow_client.store_results(
    ///     escrow_address, 
    ///     url,
    ///     hash
    /// ).await {
    ///     Ok(_) => println!("Escrow has been completed"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn complete(
        &self,
        escrow_address: Address
    ) -> Result<(), EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await?
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let result = escrow.contract
            .signed_call_with_confirmations(
                "complete",
                (), 
                Options {
                    gas: Some(5_000_000.into()),
                    ..Default::default()
                },
                CONFIRMATIONS_THRESHOLD.into(),
                SecretKeyRef::new(&self.account)
            )
            .await;
        
        match result {
            Ok(receipt) => {
                if receipt.status.map_or(false, |status| status == 0.into()) {
                    return Err(EthereumError::TransactionFailedError)
                }
                Ok(())
            }
            Err(err) => return Err(EthereumError::Web3Error(err.to_string()))
        }
    }

    /// Initiates a bulk payout from the escrow to multiple recipients.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The Ethereum address of the escrow.
    /// * `recipients` - A vector of Ethereum addresses representing the recipients of the payout.
    /// * `amounts` - A vector of amounts corresponding to the payout for each recipient.
    /// * `final_results_url` - The URL pointing to the final results of the bulk payout.
    /// * `final_results_hash` - The hash of the final results of the bulk payout.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if the bulk payout is successful, otherwise returns an `Err` with the specific error.
    ///
    /// # Errors
    ///
    /// The function may return the following errors:
    ///
    /// * `InvalidRecipientSizeError` - The number of recipients is zero.
    /// * `InvalidAmountsSizeError` - The number of amounts is zero.
    /// * `RecipientsAndAmountsMustBeSameLengthError` - The number of recipients and amounts must be the same.
    /// * `InvalidUrlError` - The `final_results_url` is empty or not a valid URL.
    /// * `EmptyHashError` - The `final_results_hash` is empty.
    /// * `EscrowAddressNotProvidedByFactoryError` - The provided escrow address is not associated with the factory.
    /// * `Web3Error` - An error occurred during the interaction with the Ethereum node.
    /// * `TransactionFailedError` - The Ethereum transaction failed.
    /// * `EscrowDoesNotHaveEnoughBalanceError` - The escrow does not have enough balance for the bulk payout.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// let recipients = vec!["0xrecipient1".to_string(), "0xrecipient2".to_string()];
    /// let amounts = vec![100, 200];
    /// let final_results_url = "https://example.com/final_results".to_string();
    /// let final_results_hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef".to_string();
    /// 
    /// match escrow_client.bulk_pay_out(
    ///     escrow_address,
    ///     recipients,
    ///     amounts,
    ///     final_results_url,
    ///     final_results_hash
    /// ).await {
    ///     Ok(_) => println!("Bulk payout has been completed"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn bulk_pay_out(
        &self,
        escrow_address: Address,
        recipients: Vec<String>,
        amounts: Vec<u64>,
        final_results_url: String,
        final_results_hash: String
    ) -> Result<(), EthereumError> {
        if recipients.len() == 0 {
            return Err(EthereumError::InvalidRecipientsSizeError)
        }

        if amounts.len() == 0 {
            return Err(EthereumError::InvalidAmountsSizeError)
        }

        if recipients.len() != amounts.len() {
            return Err(EthereumError::RecipientsAndAmountsMustBeSameLengthError)
        }
        
        if final_results_url.is_empty() || !EscrowClient::is_valid_url(&final_results_url) {
            return Err(EthereumError::InvalidUrlError);
        }

        if final_results_hash.is_empty() || !EscrowClient::is_valid_url(&final_results_hash) {
            return Err(EthereumError::EmptyHashError);
        }

        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let balance: u64 = match self.get_balance(
                escrow_address
            ).await {
                Ok(balance) => balance,
                Err(err) => return Err(err)
            };

        let total_amount: u64 = amounts.iter().sum();

        if balance < total_amount {
            return Err(EthereumError::EscrowDoesNotHaveEnoughBalanceError)
        }

        let result = escrow.contract
            .signed_call_with_confirmations(
                "bulkPayOut",
                (
                    recipients,
                    amounts,
                    final_results_url,
                    final_results_hash,
                    DEFAULT_TX_ID
                ), 
                Options {
                    gas: Some(5_000_000.into()),
                    ..Default::default()
                },
                CONFIRMATIONS_THRESHOLD.into(),
                SecretKeyRef::new(&self.account)
            )
            .await;
        
        match result {
            Ok(receipt) => {
                if receipt.status.map_or(false, |status| status == 0.into()) {
                    return Err(EthereumError::TransactionFailedError)
                }
                Ok(())
            }
            Err(err) => return Err(EthereumError::Web3Error(err.to_string()))
        }
    }

    /// Cancels an active escrow, refunding the remaining funds to the job requester.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The Ethereum address of the escrow to be canceled.
    ///
    /// # Returns
    ///
    /// Returns a `Result` containing an `EscrowCancel` if the cancellation is successful, otherwise returns an `Err` with the specific error.
    ///
    /// # Errors
    ///
    /// The function may return the following errors:
    ///
    /// * `EscrowAddressNotProvidedByFactoryError` - The provided escrow address is not associated with the factory.
    /// * `Web3Error` - An error occurred during the interaction with the Ethereum node.
    /// - `EthereumError::TransactionFailedError`: If the abortion transaction fails.
    /// * `NoLogsFoundError` - No logs were found in the Ethereum transaction receipt.
    /// * `InvalidTokenAddressFoundError` - The token address found in the log does not match the expected token address.
    /// * `LogParsingError` - An error occurred while parsing Ethereum logs.
    /// * `EscrowCancelError` - An error occurred during the escrow cancellation process.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.cancel(
    ///     escrow_address
    /// ).await {
    ///     Ok(escrow_cancel) => {
    ///         println!("Escrow has been canceled with {:?}", escrow_cancel);
    ///     }
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn cancel(
        &self,
        escrow_address: Address
    ) -> Result<EscrowCancel, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let result = escrow.contract
            .signed_call_with_confirmations(
                "cancel",
                (), 
                Options {
                    gas: Some(5_000_000.into()),
                    ..Default::default()
                },
                CONFIRMATIONS_THRESHOLD.into(),
                SecretKeyRef::new(&self.account)
            )
            .await;

        let token_address: Address = escrow.contract
            .query(
                "token", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;

        match result {
            Ok(receipt) => {
                if receipt.status.map_or(false, |status| status == 0.into()) {
                    return Err(EthereumError::TransactionFailedError)
                }
                
                if receipt.logs.is_empty() {
                    return Err(EthereumError::NoLogsFoundError);
                }

                let log = receipt.logs[0].clone();
                if log.address != token_address {
                    return Err(EthereumError::InvalidTokenAddressFoundError);
                }

            
                let event = Transfer::new();
                let log = event.parse(&event.event, vec![log]).map_err(|e| {
                    EthereumError::LogParsingError(e.to_string())
                })?;

                if let Some(Token::Uint(value)) = log.params[2].value.clone().into() {
                    if log.params[0].value.clone().into_address() == Some(escrow_address) {
                        return Ok(EscrowCancel {
                            tx_hash: receipt.transaction_hash,
                            amount_refunded: value.as_u128(),
                        });
                    }
                }
                Err(EthereumError::EscrowCancelError)
            }
            Err(err) => return Err(EthereumError::Web3Error(err.to_string()))
        }
        
    }

    /// Aborts the escrow process for the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to abort.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if the abortion is successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the abortion process. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::TransactionFailedError`: If the abortion transaction fails.
    /// - `EthereumError::Web3Error`: If there is an error interacting with the Ethereum network.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// match escrow_client.abort(
    ///     escrow_address
    /// ).await {
    ///     Ok(_) => println!("Escrow has been aborted"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn abort(
        &self,
        escrow_address: Address
    ) -> Result<(), EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await?
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let result = escrow.contract
            .signed_call_with_confirmations(
                "abort",
                (), 
                Options {
                    gas: Some(5_000_000.into()),
                    ..Default::default()
                },
                CONFIRMATIONS_THRESHOLD.into(),
                SecretKeyRef::new(&self.account)
            )
            .await;
        
        match result {
            Ok(receipt) => {
                if receipt.status.map_or(false, |status| status == 0.into()) {
                    return Err(EthereumError::TransactionFailedError)
                }
                Ok(())
            }
            Err(err) => return Err(EthereumError::Web3Error(err.to_string()))
        }
    }

    /// Adds trusted handlers to the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to add trusted handlers to.
    /// * `trusted_handlers` - A vector of Ethereum addresses representing trusted handlers to be added.
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if the addition of trusted handlers is successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the addition of trusted handlers. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::TransactionFailedError`: If the transaction to add trusted handlers fails.
    /// - `EthereumError::Web3Error`: If there is an error interacting with the Ethereum network.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// let trusted_handlers = vec![
    ///     Address::from_str("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").unwrap(),
    /// ];
    /// 
    /// match escrow_client.add_trusted_handlers(
    ///     escrow_address,
    ///     trusted_handlers
    /// ).await {
    ///     Ok(_) => println!("Trusted handlers have been added"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn add_trusted_handlers(
        &self,
        escrow_address: Address,
        trusted_handlers: Vec<Address>
    ) -> Result<(), EthereumError> {
        if trusted_handlers.len() == 0 {
            return Err(EthereumError::InvalidTrustedHandlersSizeError)
        }

        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let result = escrow.contract
            .signed_call_with_confirmations(
                "addTrustedHandlers",
                trusted_handlers, 
                Options {
                    gas: Some(5_000_000.into()),
                    ..Default::default()
                },
                CONFIRMATIONS_THRESHOLD.into(),
                SecretKeyRef::new(&self.account)
            )
            .await;
        
        match result {
            Ok(receipt) => {
                if receipt.status.map_or(false, |status| status == 0.into()) {
                    return Err(EthereumError::TransactionFailedError)
                }
                Ok(())
            }
            Err(err) => return Err(EthereumError::Web3Error(err.to_string()))
        }
    }

    /// Gets the balance of the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the balance for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(u64)` representing the balance of the escrow if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the balance retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the balance.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_balance(
    ///     escrow_address,
    /// ).await {
    ///     Ok(balance) => println!("Escrow balance: {:?}", balance),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_balance(
        &self,
        escrow_address: Address
    ) -> Result<u64, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let balance: u64 = escrow.contract
            .query(
                "getBalance", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(balance)
    }

    /// Gets the manifest hash of the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the manifest hash for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(String)` representing the manifest hash of the escrow if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the manifest hash retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the manifest hash.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_manifest_hash(
    ///     escrow_address,
    /// ).await {
    ///     Ok(manifest_hash) => println!("Manifest hash: {:?}", manifest_hash),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_manifest_hash(
        &self,
        escrow_address: Address,
    ) -> Result<String, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let manifest_hash: String = escrow.contract
            .query(
                "manifestHash", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(manifest_hash)
    }

    /// Gets the manifest URL of the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the manifest URL for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(String)` representing the manifest URL of the escrow if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the manifest URL retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the manifest URL.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_manifest_url(
    ///     escrow_address,
    /// ).await {
    ///     Ok(manifest_url) => println!("Manifest url: {:?}", manifest_url),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_manifest_url(
        &self,
        escrow_address: Address,
    ) -> Result<String, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let manifest_url: String = escrow.contract
            .query(
                "manifestUrl", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(manifest_url)
    }

    /// Gets the results URL of the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the results URL for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(String)` representing the results URL of the escrow if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the results URL retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the results URL.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_results_url(
    ///     escrow_address,
    /// ).await {
    ///     Ok(results_url) => println!("Results url: {:?}", results_url),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_results_url(
        &self,
        escrow_address: Address,
    ) -> Result<String, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let results_url: String = escrow.contract
            .query(
                "resultsUrl", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(results_url)
    }

    /// Gets the intermediate results URL of the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the intermediate results URL for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(String)` representing the intermediate results URL of the escrow if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the intermediate results URL retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the intermediate results URL.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_intermediate_results_url(
    ///     escrow_address,
    /// ).await {
    ///     Ok(intermediate_results_url) => println!("Intermediate results url: {:?}", intermediate_results_url),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_intermediate_results_url(
        &self,
        escrow_address: Address,
    ) -> Result<String, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let intermediate_results_url: String = escrow.contract
            .query(
                "intermediateResultsUrl", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(intermediate_results_url)
    }

    /// Gets the token address associated with the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the token address for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(Address)` representing the token address of the escrow if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the token address retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the token address.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_token_address(
    ///     escrow_address,
    /// ).await {
    ///     Ok(token_address) => println!("Token address: {:?}", token_address),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_token_address(
        &self,
        escrow_address: Address,
    ) -> Result<Address, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let token_address: Address = escrow.contract
            .query(
                "tokenAddress", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(token_address)
    }
    
    /// Gets the status of the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the status for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(EscrowStatus)` representing the status of the escrow if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the status retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the escrow status.
    /// - `EthereumError::UnknownEscrowStatusError`: If the retrieved status code is not recognized.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_status(
    ///     escrow_address,
    /// ).await {
    ///     Ok(status) => println!("Escrow status: {:?}", status),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_status(
        &self,
        escrow_address: Address,
    ) -> Result<EscrowStatus, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            println!("get_status in if: wtf");
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let status: u8 = escrow.contract
            .query(
                "status", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        let escrow_status = match status {
            0 => EscrowStatus::Launched,
            1 => EscrowStatus::Pending,
            2 => EscrowStatus::Partial,
            3 => EscrowStatus::Paid,
            4 => EscrowStatus::Complete,
            5 => EscrowStatus::Cancelled,
            _ => return Err(EthereumError::UnknownEscrowStatusError)
        };
    
        println!("status: {:?}", escrow_status);
        Ok(escrow_status)
    }

    /// Gets the factory address associated with the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the factory address for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(Address)` representing the factory address if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the factory address retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the factory address.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_factory_address(
    ///     escrow_address,
    /// ).await {
    ///     Ok(factory_address) => println!("Escrow factory address: {:?}", factory_address),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_factory_address(
        &self,
        escrow_address: Address,
    ) -> Result<Address, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let factory_address: Address = escrow.contract
            .query(
                "factoryAddress", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(factory_address)
    }

    /// Gets the job launcher address associated with the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the job launcher address for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(Address)` representing the job launcher address if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the job launcher address retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the job launcher address.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_job_launcher_address(
    ///     escrow_address,
    /// ).await {
    ///     Ok(job_launcher_address) => println!("Escrow job launcher address: {:?}", job_launcher_address),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_job_launcher_address(
        &self,
        escrow_address: Address,
    ) -> Result<Address, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let job_launcher_address: Address = escrow.contract
            .query(
                "jobLauncherAddress", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(job_launcher_address)
    }

    /// Gets the exchange oracle address associated with the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the exchange oracle address for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(Address)` representing the exchange oracle address if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the exchange oracle address retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the exchange oracle address.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_exchange_oracle_address(
    ///     escrow_address,
    /// ).await {
    ///     Ok(exchange_oracle_address) => println!("Escrow exchange oracle address: {:?}", exchange_oracle_address),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_exchange_oracle_address(
        &self,
        escrow_address: Address,
    ) -> Result<Address, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let exchange_oracle_address: Address = escrow.contract
            .query(
                "exchangeOracleAddress", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(exchange_oracle_address)
    }

    /// Gets the recording oracle address associated with the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the recording oracle address for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(Address)` representing the recording oracle address if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the recording oracle address retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the recording oracle address.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_recording_oracle_address(
    ///     escrow_address,
    /// ).await {
    ///     Ok(recording_oracle_address) => println!("Escrow recording oracle address: {:?}", recording_oracle_address),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_recording_oracle_address(
        &self,
        escrow_address: Address,
    ) -> Result<Address, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let escrow = Escrow::new(self.web3, escrow_address);

        let recording_oracle_address: Address = escrow.contract
            .query(
                "recordingOracleAddress", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(recording_oracle_address)
    }

    /// Gets the reputation oracle address associated with the specified escrow contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to retrieve the reputation oracle address for.
    ///
    /// # Returns
    ///
    /// Returns `Ok(Address)` representing the reputation oracle address if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the reputation oracle address retrieval. Possible errors include:
    ///
    /// - `EthereumError::EscrowAddressNotProvidedByFactoryError`: If the provided escrow address is not associated with the factory.
    /// - `EthereumError::Web3ContractError`: If there is an error querying the contract for the reputation oracle address.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{escrow::{EscrowClient, EscrowConfig}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// #     let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// #     let web3 = web3::Web3::new(http);
    /// #     let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// #     let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// #     let escrow_client = EscrowClient::new(&web3, address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x9876543210987654321098765432109876543210").unwrap();
    /// 
    /// match escrow_client.get_reputation_oracle_address(
    ///     escrow_address,
    /// ).await {
    ///     Ok(reputation_oracle_address) => println!("Escrow reputation oracle address: {:?}", reputation_oracle_address),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_reputation_oracle_address(
        &self,
        escrow_address: Address,
    ) -> Result<Address, EthereumError> {
        if !self
            .has_escrow(escrow_address)
            .await? 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }
        
        let escrow = Escrow::new(self.web3, escrow_address);

        let reputation_oracle_address: Address = escrow.contract
            .query(
                "reputationOracleAddress", 
                (), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(reputation_oracle_address)
    }

    /// Checks if an escrow with the specified address exists in the factory contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to check for existence.
    ///
    /// # Returns
    ///
    /// Returns `Ok(bool)` indicating whether the escrow exists (`true`) or not (`false`) if successful.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` in case of failure during the escrow existence check. Possible errors include:
    ///
    /// - `EthereumError::Web3ContractError`: If there is an error querying the factory contract for escrow existence.
    pub async fn has_escrow(
        &self,
        escrow_address: Address,
    ) -> Result<bool, EthereumError> {
        match self
            .escrow_factory
            .contract
            .query("hasEscrow", escrow_address.clone(), None, Options::default(), None)
            .await {
                Ok(result) => Ok(result),
                Err(err) => Err(EthereumError::Web3ContractError(err.to_string())),
            }
    }

    /// Checks if the provided string is a valid URL.
    ///
    /// # Arguments
    ///
    /// * `url_str` - The string representing the URL to check for validity.
    ///
    /// # Returns
    ///
    /// Returns `true` if the provided string is a valid URL, otherwise returns `false`.
    fn is_valid_url(url_str: &str) -> bool {
        match Url::parse(url_str) {
            Ok(_) => true,
            Err(_) => false,
        }
    }
}


use crate::graphql::escrows_query;
use crate::graphql::escrow_query;

/// # Introduction
///
/// Utility struct for escrow-related operations.
///
/// # Example
///
/// ```
/// use human_protocol_sdk::{enums::{ChainId}};
/// use human_protocol_sdk::escrow::EscrowUtils;
/// use human_protocol_sdk::graphql::escrows_query;
///
/// #[tokio::main]
/// async fn main() {
///     let filters = escrows_query::EscrowFilter::default();
///
///     match EscrowUtils::get_escrows(vec![ChainId::PolygonMumbai], filters).await {
///         Ok(escrows) => {
///             println!("{:?}", escrows);
///         }
///         Err(err) => {
///             eprintln!("Error: {:?}", err);
///         }
///     }
/// }
/// ```
pub struct EscrowUtils;
impl EscrowUtils {
    /// This function returns a vector of escrows based on the specified filter parameters.
    ///
    /// ## Input parameters
    ///
    /// ```
    /// use human_protocol_sdk::{enums::{ChainId}};
    /// use human_protocol_sdk::escrow::EscrowUtils;
    /// use human_protocol_sdk::graphql::escrows_query;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let filter = escrows_query::EscrowFilter::default()
    ///         .launcher(Some("0x36efc567cdE1467021dfa89448908E221B80Ff9B".into()));
    ///
    ///     let escrows = EscrowUtils::get_escrows(vec![ChainId::PolygonMumbai], filter).await;
    ///     match escrows {
    ///         Ok(escrows) => {
    ///             println!("{:?}", escrows);
    ///         }
    ///         Err(err) => {
    ///             eprintln!("Error: {:?}", err);
    ///         }
    ///     }
    /// }
    /// ```
    pub async fn get_escrows(networks: Vec<ChainId>, filter: escrows_query::EscrowFilter) -> Result<Vec<escrows_query::EscrowData>, Box<dyn Error>> {
        let mut escrow_addresses = Vec::new();
        for chain_id in networks {
            let network = NETWORKS.get(&chain_id).ok_or_else(|| EthereumError::NetworkNotFoundForChainIdError(chain_id as u32))?;
            
            match escrows_query::run_query(network.subgraph_url, &filter).await.data {
                Some(escrows_query::GetEscrowsQuery { escrows: Some(escrows) }) => {
                    escrow_addresses.extend(escrows)
                }
                _ => {}
            }
        }
        Ok(escrow_addresses)
    }

    /// This function returns the escrow data for a given address.
    ///
    /// ## Input parameters
    ///
    /// ```
    /// use human_protocol_sdk::{enums::{ChainId}};
    /// use human_protocol_sdk::escrow::EscrowUtils;
    /// use human_protocol_sdk::graphql::escrow_query;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let chain_id = ChainId::PolygonMumbai;
    ///     let escrow_address = "0x1234567890123456789012345678901234567890";
    ///     let escrows_filter = escrow_query::EscrowFilter {
    ///         id: escrow_address.into()
    ///     };
    ///
    ///     let escrow_data = EscrowUtils::get_escrow(chain_id, escrows_filter).await;
    ///     match escrow_data {
    ///         Ok(data) => {
    ///             println!("{:?}", data);
    ///         }
    ///         Err(err) => {
    ///             eprintln!("Error: {:?}", err);
    ///         }
    ///     }
    /// }
    /// ```
    pub async fn get_escrow(chain_id: ChainId, filter: escrow_query::EscrowFilter) -> Result<escrow_query::EscrowData, EthereumError> {
        let network = NETWORKS.get(&chain_id).ok_or_else(|| EthereumError::NetworkNotFoundForChainIdError(chain_id as u32))?;

        match escrow_query::run_query(network.subgraph_url, &filter).await.data {
            Some(escrow_query::GetEscrowByAddressQuery { escrow: Some(escrow) }) => {
                Ok(escrow)
            }
            _ => {
                return Err(EthereumError::EscrowNotFoundForEscrowAddressError(filter.id.into()))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use super::*;
    use web3::contract::Options;
    use web3::{transports::Http, types::{Block, Transaction}};
    use tokio::test;

    #[tokio::test]
    async fn test_escrow_factory_creation() {
        let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
        let web3 = web3::Web3::new(http);
        let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();

        let escrow_factory = EscrowFactory::new(&web3, address);

        assert_eq!(escrow_factory.contract.address(), address);
    }

    #[tokio::test]
    async fn test_escrow_creation() {
        let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
        let web3 = web3::Web3::new(http);
        let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();

        let escrow = Escrow::new(&web3, address);

        assert_eq!(escrow.contract.address(), address);
    }

    #[tokio::test]
    async fn test_hmt_token_creation() {
        let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
        let web3 = web3::Web3::new(http);
        let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();

        let hm_token = HMToken::new(&web3, address);

        assert_eq!(hm_token.contract.address(), address);
    }

    #[tokio::test]
    async fn test_escrow_config_default() {
        let escrow_config = EscrowConfig::new();

        assert_eq!(escrow_config.recording_oracle, "");
        assert_eq!(escrow_config.reputation_oracle, "");
        assert_eq!(escrow_config.exchange_oracle, "");
        assert_eq!(escrow_config.recording_oracle_fee, U256::zero());
        assert_eq!(escrow_config.reputation_oracle_fee, U256::zero());
        assert_eq!(escrow_config.exchange_oracle_fee, U256::zero());
        assert_eq!(escrow_config.manifest_url, "");
        assert_eq!(escrow_config.manifest_hash, "");
    }

    #[tokio::test]
    async fn test_escrow_client_creation() {
        let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
        let web3 = web3::Web3::new(http);
        let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
        let account = SecretKey::from_str("75c64a0d8a1fac998cfc1165fe0d8975be1e8ebe8f5bb52cfde3339a6e94e7a5").unwrap();

        let escrow_client = EscrowClient::new(&web3, address, account).await;

        assert_eq!(escrow_client.escrow_factory.contract.address(), address);
    }

    #[tokio::test]
    async fn test_escrow_cancel_creation() {
        let tx_hash = H256::zero();
        let amount_refunded = 100;

        let escrow_cancel = EscrowCancel { tx_hash, amount_refunded };

        assert_eq!(escrow_cancel.tx_hash, tx_hash);
        assert_eq!(escrow_cancel.amount_refunded, amount_refunded);
    }

    #[tokio::test]
    async fn test_create_escrow_invalid_address() {
        let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
        let web3 = web3::Web3::new(http);
        let account = SecretKey::from_str("75c64a0d8a1fac998cfc1165fe0d8975be1e8ebe8f5bb52cfde3339a6e94e7a5").unwrap();
        let escrow_factory = EscrowFactory::new(&web3, Address::zero());

        let escrow_client = EscrowClient {
            web3: &web3,
            escrow_factory,
            account,
        };

        let result = escrow_client
            .create_escrow(
                "invalid_address".to_string(),
                vec!["0x0123456789abcdef0123456789abcdef01234567".to_string()],
                "job_requester_id".to_string(),
            )
            .await;

        assert!(result.is_err());
        assert_eq!(
            result.unwrap_err(),
            EthereumError::InvalidEthereumAddressError
        );
    }

}