use web3::{
    signing::{ SecretKey, SecretKeyRef, keccak256 },
    contract::{Contract, Options},
    transports::Http,
    types::Address
};

use crate::enums::EthereumError;
use crate::constants::CONFIRMATIONS_THRESHOLD;
use url::Url;
use hex::encode;


pub struct KVStore {
    contract: Contract<Http>
}

impl KVStore {
    fn new(web3: &web3::Web3<web3::transports::Http>, address: Address) -> Self {
        let contract: Contract<Http> = Contract::from_json(
                web3.eth(),
                address,
                include_bytes!("../../../../core/abis/KVStore.json")
            )
            .unwrap();
        
        KVStore {
            contract
        }
    }
}

/// # Introduction
///
/// A client for interacting with the KVStore contract on the blockchain.
/// 
pub struct KVStoreClient<'a> {
    web3: &'a web3::Web3<web3::transports::Http>,
    kvstore: KVStore,
    account: SecretKey
}

impl<'a> KVStoreClient<'a> {
    /// Creates a new `KVStoreClient` instance.
    ///
    /// # Arguments
    ///
    /// * `web3` - A reference to the `Web3` instance for interacting with the blockchain.
    /// * `address` - The Ethereum address of the KVStore contract.
    /// * `account` - The Ethereum account used for signing transactions.
    ///
    /// # Returns
    ///
    /// Returns a `KVStoreClient` instance.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{kvstore::{KVStoreClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// let web3 = web3::Web3::new(http);
    /// let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// let account = SecretKey::from_slice(&[1; 32]).unwrap();
    ///
    /// let kvstore_client = KVStoreClient::new(&web3, address, account).await;
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn new(web3: &'a web3::Web3<web3::transports::Http>, address: Address, account: SecretKey) -> KVStoreClient<'a> {
        let kvstore = KVStore::new(web3, address);
        
        KVStoreClient {
            web3,
            kvstore,
            account
        }
    }
    
    /// Sets a key-value pair in the KVStore contract on the blockchain.
    ///
    /// # Arguments
    ///
    /// * `key` - The key for the key-value pair.
    /// * `value` - The value associated with the key.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction fails or encounters an error.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{kvstore::{KVStoreClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let kvstore_client = KVStoreClient::new(&web3, address, account).await;
    ///
    /// let key = "example_key".to_string();
    /// let value = "example_value".to_string();
    ///
    /// match kvstore_client.set(
    ///     key,
    ///     value
    /// ).await {
    ///     Ok(_) => println!("Value has been set"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn set(
        &self,
        key: String, 
        value: String
    ) -> Result<(), EthereumError> {
        let result = self
            .kvstore
            .contract
            .signed_call_with_confirmations(
                "set",
                (
                    key,
                    value,
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

    /// Sets multiple key-value pairs in the KVStore contract on the blockchain.
    ///
    /// # Arguments
    ///
    /// * `keys` - A vector of keys for the key-value pairs.
    /// * `values` - A vector of values associated with the keys.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction fails or encounters an error.
    ///
    /// # Example
    /// 
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{kvstore::{KVStoreClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let kvstore_client = KVStoreClient::new(&web3, address, account).await;
    ///
    /// let keys = vec!["key1".to_string(), "key2".to_string()];
    /// let values = vec!["value1".to_string(), "value2".to_string()];
    ///
    /// match kvstore_client.set_bulk(
    ///     keys,
    ///     values
    /// ).await {
    ///     Ok(_) => println!("Values have been set"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn set_bulk(
        &self,
        keys: Vec<String>, 
        values: Vec<String>
    ) -> Result<(), EthereumError> {
        if keys.len() == 0 {
            return Err(EthereumError::InvalidKeysSizeError)
        }

        if values.len() == 0 {
            return Err(EthereumError::InvalidValuesSizeError)
        }

        if keys.len() != values.len() {
            return Err(EthereumError::RecipientsAndAmountsMustBeSameLengthError)
        }
        
        let result = self
            .kvstore
            .contract
            .signed_call_with_confirmations(
                "set",
                (
                    keys,
                    values,
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

    /// Sets a key-value pair in the KVStore contract on the blockchain, where the value is fetched from a specified URL.
    ///
    /// # Arguments
    ///
    /// * `url` - The URL from which to fetch the value.
    /// * `url_key` - The key associated with the fetched value.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction fails, encounters an error, or if the URL is invalid.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{kvstore::{KVStoreClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let kvstore_client = KVStoreClient::new(&web3, address, account).await;
    ///
    /// let url = "https://example.com/value".to_string();
    /// let url_key = "url".to_string();
    ///
    /// match kvstore_client.set_url(
    ///     url,
    ///     url_key
    /// ).await {
    ///     Ok(_) => println!("Url has been set"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn set_url(
        &self,
        url: String, 
        url_key: String
    ) -> Result<(), EthereumError> {
        if url.is_empty() || !KVStoreClient::is_valid_url(&url) {
            return Err(EthereumError::InvalidUrlError);
        }

        let content: String = KVStoreClient::fetch_content(&url).await?;
        let hash_bytes = keccak256(content.as_bytes());
        let hash_hex = encode(&hash_bytes);

        let hash_key = format!("{}Hash", url_key);

        let result = self
            .kvstore
            .contract
            .signed_call_with_confirmations(
                "set_bulk",
                (
                    [url_key, hash_key], [url, hash_hex]
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

    /// Gets the value associated with a key from the KVStore contract on the blockchain.
    ///
    /// # Arguments
    ///
    /// * `address` - The address associated with the stored key-value pair.
    /// * `key` - The key for which to retrieve the value.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction fails, encounters an error, or if the key is invalid.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{kvstore::{KVStoreClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let kvstore_client = KVStoreClient::new(&web3, address, account).await;
    ///
    /// let key = "example_key".to_string();
    ///
    /// match kvstore_client.get(
    ///     address,
    ///     key
    /// ).await {
    ///     Ok(value) => println!("Stored value {:?}", value),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get(
        &self,
        address: Address, 
        key: String
    ) -> Result<String, EthereumError> {
        if key.is_empty() {
            return Err(EthereumError::InvalidKeyError);
        }

        let value: Address = self
            .kvstore
            .contract
            .query(
                "get", 
                (
                    address,
                    key
                ), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        
        Ok(format!("{:?}", value))
    }

    /// Gets the URL associated with a key from the KVStore contract on the Ethereum blockchain.
    ///
    /// # Arguments
    ///
    /// * `address` - The address associated with the stored URL.
    /// * `url_key` - The key for which to retrieve the URL.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction fails, encounters an error, or if the key is invalid.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{kvstore::{KVStoreClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let kvstore_client = KVStoreClient::new(&web3, address, account).await;
    ///
    /// let url_key = "url".to_string();
    /// 
    /// match kvstore_client.get_url(
    ///     address,
    ///     url_key
    /// ).await {
    ///     Ok(value) => println!("Stored value {:?}", value),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_url(
        &self,
        address: Address, 
        url_key: String
    ) -> Result<String, EthereumError> {
        if url_key.is_empty() {
            return Err(EthereumError::InvalidKeyError);
        }

        let hash_key = format!("{}Hash", url_key);

        let url: String = self.get(address, url_key).await?;
        /*let url: String = self
            .kvstore
            .contract
            .query(
                "get", 
                (
                    address,
                    url_key
                ), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
*/
        if url.is_empty() || !KVStoreClient::is_valid_url(&url) {
            return Err(EthereumError::InvalidUrlError);
        }
        
        let hash: String = self.get(address, hash_key).await?;
        /*
        let hash: String = self
            .kvstore
            .contract
            .query(
                "get", 
                (
                    address,
                    hash_key
                ), 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
*/
        let content: String = KVStoreClient::fetch_content(&url).await?;
        let hash_bytes = keccak256(content.as_bytes());
        let hash_hex = encode(&hash_bytes);
        
        if hash != hash_hex {
            EthereumError::InvalidHashError(hash, hash_hex);
        }
        
        Ok(format!("{:?}", url))
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

    /// Fetches content from the specified URL using an HTTP GET request.
    ///
    /// # Arguments
    ///
    /// * `url` - The URL from which to fetch the content.
    ///
    /// # Returns
    ///
    /// Returns a `Result` containing the fetched content as a `String` if the request is successful, otherwise returns an `Err` with the specific error.
    ///
    /// # Errors
    ///
    /// The function may return the following errors:
    ///
    /// * `RequestError` - An error occurred while making the HTTP request.
    /// * `UnexpectedStatusCodeError` - The HTTP request returned an unexpected status code.
    /// ```
    async fn fetch_content(url: &str) -> Result<String, EthereumError> {
        let client = reqwest::Client::new();
    
        let response = client.get(url).send().await.map_err(|err| EthereumError::RequestError(err.to_string()))?;
    
        match response.status() {
            reqwest::StatusCode::OK => {
                let content = response.text().await.map_err(|err| EthereumError::RequestError(err.to_string()))?;
                Ok(content)
            },
            status => Err(EthereumError::UnexpectedStatusCodeError(status.as_u16())),
        }
    }
}

#[cfg(test)]
mod tests {}