use serde_derive::Deserialize;
use web3::{
    ethabi::{ethereum_types::U256, Token},
    signing::{ SecretKey, SecretKeyRef },
    contract::{Contract, Options, tokens::Tokenizable},
    transports::Http,
    types:: {Address}
};
use std::str::FromStr;

use crate::{enums::{EthereumError, ChainId, Error}, constants::NETWORKS, escrow::{HMToken, EscrowFactory}};
use crate::constants::CONFIRMATIONS_THRESHOLD;


#[derive(Debug, Default, Deserialize)]
pub struct Allocation {
    escrow_address: String,
    staker: String,
    tokens: u128,
    created_at: u128,
    closed_at: u128,
}

impl Tokenizable for Allocation {
    fn from_token(token: Token) -> Result<Self, web3::contract::Error> {
        let data = if let Token::Tuple(value) = token {
            value
        } else {
            return Err(web3::contract::Error::InvalidOutputType(Error::InvalidTokenConversionError.to_string()));
        };

        if data.len() != 5 {
            return Err(web3::contract::Error::InvalidOutputType(Error::InvalidTupleLengthError.to_string()));
        }

        let escrow_address = if let Token::Address(address) = data[0] {
            address.to_string()
        } else {
            return Err(web3::contract::Error::InvalidOutputType(Error::InvalidTokenConversionError.to_string()));
        };

        let staker = if let Token::Address(address) = data[1] {
            address.to_string()
        } else {
            return Err(web3::contract::Error::InvalidOutputType(Error::InvalidTokenConversionError.to_string()));
        };

        let tokens = if let Token::Uint(uint) = data[2] {
            uint.as_u128()
        } else {
            return Err(web3::contract::Error::InvalidOutputType(Error::InvalidTokenConversionError.to_string()));
        };

        let created_at = if let Token::Uint(uint) = data[3] {
            uint.as_u128()
        } else {
            return Err(web3::contract::Error::InvalidOutputType(Error::InvalidTokenConversionError.to_string()));
        };

        let closed_at = if let Token::Uint(uint) = data[4] {
            uint.as_u128()
        } else {
            return Err(web3::contract::Error::InvalidOutputType(Error::InvalidTokenConversionError.to_string()));
        };

        Ok(Allocation {
            escrow_address,
            staker,
            tokens,
            created_at,
            closed_at
        })
    }

    fn into_token(self) -> Token {
        Token::Tuple(vec![
            Token::Address(Address::from_str(&self.escrow_address).unwrap()),
            Token::Address(Address::from_str(&self.staker).unwrap()),
            Token::Uint(U256::from(self.tokens)),
            Token::Uint(U256::from(self.created_at)),
            Token::Uint(U256::from(self.closed_at)),
        ])
    }
}

pub struct Staking {
    contract: Contract<Http>
}

impl Staking {
    fn new(web3: &web3::Web3<web3::transports::Http>, address: Address) -> Self {
        let contract: Contract<Http> = Contract::from_json(
                web3.eth(),
                address,
                include_bytes!("../../../../core/abis/Staking.json")
            )
            .unwrap();
        
        Staking {
            contract
        }
    }
}

pub struct RewardPool {
    contract: Contract<Http>
}

impl RewardPool {
    fn new(web3: &web3::Web3<web3::transports::Http>, address: Address) -> Self {
        let contract: Contract<Http> = Contract::from_json(
                web3.eth(),
                address,
                include_bytes!("../../../../core/abis/RewardPool.json")
            )
            .unwrap();
        
        RewardPool {
            contract
        }
    }
}

/// # Introduction
///
/// A client for interacting with the Staking contract on the blockchain.
/// 
pub struct StakingClient<'a> {
    web3: &'a web3::Web3<web3::transports::Http>,
    staking: Staking,
    token: HMToken,
    escrow_factory: EscrowFactory,
    reward_pool: RewardPool,
    account: SecretKey
}

impl<'a> StakingClient<'a> {
    /// Creates a new `StakingClient` instance.
    ///
    /// # Arguments
    ///
    /// * `web3` - A reference to the `Web3` instance for interacting with the blockchain.
    /// * `staking_address` - The Ethereum address of the Staking contract.
    /// * `token_address` - The Ethereum address of the token contract associated with the Staking contract.
    /// * `escrow_factory_address` - The Ethereum address of the Escrow Factory contract associated with the Staking contract.
    /// * `reward_pool_address` - The Ethereum address of the Reward Pool contract associated with the Staking contract.
    /// * `account` - he Ethereum account used for signing transactions.
    ///
    /// # Returns
    ///
    /// Returns a `StakingClient` instance.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// let web3 = web3::Web3::new(http);
    /// let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// 
    /// let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    ///
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn new(
        web3: &'a web3::Web3<web3::transports::Http>, 
        staking_address: Address, 
        token_address: Address, 
        escrow_factory_address: Address,
        reward_pool_address: Address, 
        account: SecretKey
    ) -> StakingClient<'a> {
        let staking = Staking::new(web3, staking_address);
        let token = HMToken::new(web3, token_address);
        let escrow_factory = EscrowFactory::new(web3, escrow_factory_address);
        let reward_pool = RewardPool::new(web3, reward_pool_address);
        
        StakingClient {
            web3,
            staking,
            token,
            escrow_factory,
            reward_pool,
            account
        }
    }
    
    /// Approves a specified amount of tokens to be staked in the Staking contract.
    ///
    /// # Arguments
    ///
    /// * `amount` - The amount of tokens to be approved for staking.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the specified amount is non-positive, or if the transaction to approve
    /// the stake fails.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// # let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// # let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// # let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    ///
    /// let amount: u64 = 100;
    /// 
    /// match staking_client.approve_stake(
    ///     amount
    /// ).await {
    ///     Ok(_) => println!("Stake has been approved"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn approve_stake(
        &self,
        amount: u64
    ) -> Result<(), EthereumError> {
        if amount == 0 {
            return Err(EthereumError::NonPositiveValueError);
        }

        let result: Result<_, _> = self.token.contract
            .signed_call_with_confirmations(
                "approve",
                (
                    self.staking.contract.address(),
                    amount
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

    /// Stakes a specified amount of approved tokens in the Staking contract.
    ///
    /// # Arguments
    ///
    /// * `amount` - The amount of tokens to be staked.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the specified amount is non-positive, or if the transaction to stake
    /// the tokens fails.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// # let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// # let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// # let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    ///
    /// let amount: u64 = 100;
    ///
    /// match staking_client.stake(
    ///     amount
    /// ).await {
    ///     Ok(_) => println!("Amount has been staked"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn stake(
        &self,
        amount: u64
    ) -> Result<(), EthereumError> {
        if amount == 0 {
            return Err(EthereumError::NonPositiveValueError);
        }

        let result: Result<_, _> = self.staking.contract
            .signed_call_with_confirmations(
                "stake",
                amount, 
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

    /// Unstakes a specified amount of tokens from the Staking contract.
    ///
    /// # Arguments
    ///
    /// * `amount` - The amount of tokens to unstake.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction to unstake tokens fails or if the specified amount is zero.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// # let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// # let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// # let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    ///
    /// let amount: u64 = 100;
    ///
    /// match staking_client.unstake(
    ///     amount
    /// ).await {
    ///     Ok(_) => println!("Amount has been unstaked"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn unstake(
        &self,
        amount: u64
    ) -> Result<(), EthereumError> {
        if amount == 0 {
            return Err(EthereumError::NonPositiveValueError);
        }

        let result: Result<_, _> = self.staking.contract
            .signed_call_with_confirmations(
                "unstake",
                amount, 
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

    /// Withdraws staked tokens from the Staking contract.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction to withdraw staked tokens fails.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// # let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// # let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// # let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    ///
    /// match staking_client.withdraw().await {
    ///     Ok(_) => println!("Amount has been withdraw"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn withdraw(
        &self
    ) -> Result<(), EthereumError> {
        let result: Result<_, _> = self.staking.contract
            .signed_call_with_confirmations(
                "unstake",
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

    /// Slashes a specified amount of tokens from a staker's balance in the Staking contract.
    ///
    /// # Arguments
    ///
    /// * `slasher` - The address of the account initiating the slash.
    /// * `staker` - The address of the staker whose tokens will be slashed.
    /// * `escrow_address` - The address of the escrow associated with the slashed tokens.
    /// * `amount` - The amount of tokens to be slashed.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction to slash tokens fails, if the specified amount is zero,
    /// or if the provided escrow address is not associated with an existing escrow in the factory.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// # let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// # let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// # let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    ///
    /// let slasher_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// let staker_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// let escrow_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// let amount: u64 = 100;
    ///
    /// match staking_client.slash(
    ///     slasher_address,
    ///     staker_address,
    ///     escrow_address,
    ///     amount
    /// ).await {
    ///     Ok(_) => println!("Amount has been slashed"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn slash(
        &self,
        slasher: Address,
        staker: Address,
        escrow_address: Address,
        amount: u64
    ) -> Result<(), EthereumError> {
        if amount == 0 {
            return Err(EthereumError::NonPositiveValueError);
        }

        if !self
            .escrow_factory
            .contract
            .query("hasEscrow", escrow_address.clone(), None, Options::default(), None)
            .await
            .unwrap_or(false) 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let result: Result<_, _> = self.staking.contract
            .signed_call_with_confirmations(
                "slash",
                (
                    slasher,
                    staker,
                    escrow_address,
                    amount
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

    /// Allocates a specified amount of tokens to an escrow in the Staking contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow to which tokens will be allocated.
    /// * `amount` - The amount of tokens to be allocated.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction to allocate tokens fails, or if the specified amount is zero,
    /// or if the provided escrow address is not associated with an existing escrow in the factory.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// # let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// # let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// # let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    ///
    /// let escrow_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// let amount: u64 = 100;
    ///
    /// match staking_client.allocate(
    ///     escrow_address,
    ///     amount
    /// ).await {
    ///     Ok(_) => println!("Amount has been allocated"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn allocate(
        &self,
        escrow_address: Address,
        amount: u64
    ) -> Result<(), EthereumError> {
        if amount == 0 {
            return Err(EthereumError::NonPositiveValueError);
        }

        if !self
            .escrow_factory
            .contract
            .query("hasEscrow", escrow_address.clone(), None, Options::default(), None)
            .await
            .unwrap_or(false) 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let result: Result<_, _> = self.staking.contract
            .signed_call_with_confirmations(
                "allocate",
                (
                    escrow_address,
                    amount
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

    /// Closes the allocation for a specific escrow in the Staking contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow for which to close the allocation.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction to close the allocation fails,
    /// or if the provided escrow address is not associated with an existing escrow in the factory.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// # let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// # let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// # let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    ///
    /// match staking_client.close_allocation(
    ///     escrow_address
    /// ).await {
    ///     Ok(_) => println!("Allocation has been closed"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn close_allocation(
        &self,
        escrow_address: Address
    ) -> Result<(), EthereumError> {
        if !self
            .escrow_factory
            .contract
            .query("hasEscrow", escrow_address.clone(), None, Options::default(), None)
            .await
            .unwrap_or(false) 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let result: Result<_, _> = self.staking.contract
            .signed_call_with_confirmations(
                "closeAllocation",
                escrow_address, 
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

    /// Distributes rewards for a specific escrow in the Staking contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow for which to distribute rewards.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the transaction to distribute rewards fails,
    /// or if the provided escrow address is not associated with an existing escrow in the factory.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// # let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// # let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// # let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    ///
    /// match staking_client.distribute_rewards(
    ///     escrow_address
    /// ).await {
    ///     Ok(_) => println!("Rewards has been distrubuted"),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn distribute_rewards(
        &self,
        escrow_address: Address
    ) -> Result<(), EthereumError> {
        if !self
            .escrow_factory
            .contract
            .query("hasEscrow", escrow_address.clone(), None, Options::default(), None)
            .await
            .unwrap_or(false) 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let result: Result<_, _> = self.staking.contract
            .signed_call_with_confirmations(
                "distributeReward",
                escrow_address, 
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

    /// Gets the allocation details for a specific escrow from the Staking contract.
    ///
    /// # Arguments
    ///
    /// * `escrow_address` - The address of the escrow for which to retrieve the allocation details.
    ///
    /// # Errors
    ///
    /// Returns an `EthereumError` if the provided escrow address is not associated with an existing escrow in the factory
    /// or if there is an issue querying the Staking contract for the allocation details.
    ///
    /// # Example
    ///
    /// ```rust
    /// # use std::str::FromStr;
    /// # use human_protocol_sdk::{staking::{StakingClient}, enums::EthereumError};
    /// # use web3::transports::Http;
    /// # use web3::{signing::{ SecretKey, SecretKeyRef }, types::Address};
    /// 
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), EthereumError> {
    /// # let http = Http::new("https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY").unwrap();
    /// # let web3 = web3::Web3::new(http);
    /// # let account = SecretKey::from_slice(&[1; 32]).unwrap();
    /// # let staking_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    /// # let token_address = Address::from_str("0x1234567890123456789012345678901234567891").unwrap();
    /// # let escrow_factory_address = Address::from_str("0x1234567890123456789012345678901234567892").unwrap();
    /// # let reward_pool_address = Address::from_str("0x1234567890123456789012345678901234567893").unwrap();
    /// # let staking_client = StakingClient::new(&web3, staking_address, token_address, escrow_factory_address, reward_pool_address, account).await;
    /// 
    /// let escrow_address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
    ///
    /// match staking_client.get_allocation(
    ///     escrow_address
    /// ).await {
    ///     Ok(allocation) => println!("Allocation: {:?}", allocation),
    ///     Err(err) => println!("{:?}", err)
    /// };
    /// 
    /// #     Ok(())
    /// # }
    /// ```
    pub async fn get_allocation(
        &self,
        escrow_address: Address
    ) -> Result<Allocation, EthereumError> {
        if !self
            .escrow_factory
            .contract
            .query("hasEscrow", escrow_address.clone(), None, Options::default(), None)
            .await
            .unwrap_or(false) 
        {
            return Err(EthereumError::EscrowAddressNotProvidedByFactoryError);
        }

        let result: Allocation = self.staking.contract
            .query(
                "getAllocation", 
                escrow_address, 
                None, 
                Options::default(), 
                None
            )
            .await
            .map_err(|web3_error| EthereumError::Web3ContractError(web3_error.to_string()))?;
        
        Ok(result)
    }
}

use crate::graphql::staking_leaders_query;
use crate::graphql::staking_leader_query;
use crate::graphql::staking_rewards_query;


/// # Introduction
///
/// Utility struct for staking-related operations.
///
pub struct StakingUtils;
impl StakingUtils {
    /// Retrieve a list of staking leaders based on the provided filter.
    ///
    /// # Arguments
    ///
    /// * `chain_id` - The chain identifier.
    /// * `filter` - The filter criteria for querying staking leaders.
    ///
    /// # Returns
    ///
    /// A `Result` containing either a vector of staking leaders or an `EthereumError` if there was an issue.
    ///
    /// # Examples
    ///
    /// ```
    /// use human_protocol_sdk::{enums::{ChainId}};
    /// use human_protocol_sdk::staking::StakingUtils;
    /// use human_protocol_sdk::graphql::staking_leaders_query;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let filter = staking_leaders_query::LeaderFilter::default();
    ///
    ///     let leaders = StakingUtils::get_leaders(ChainId::PolygonMumbai, filter).await;
    ///     match leaders {
    ///         Ok(leaders) => {
    ///             println!("{:?}", leaders);
    ///         }
    ///         Err(err) => {
    ///             eprintln!("Error: {:?}", err);
    ///         }
    ///     }
    /// }
    /// ```
    pub async fn get_leaders(
        chain_id: ChainId,
        filter: staking_leaders_query::LeaderFilter
    ) -> Result<Vec<staking_leaders_query::Leader>, EthereumError> {
        let network = NETWORKS.get(&chain_id).ok_or_else(|| EthereumError::NetworkNotFoundForChainIdError(chain_id as u32))?;

        match staking_leaders_query::run_query(network.subgraph_url, &filter).await.data {
            Some(staking_leaders_query::GetLeadersQuery { leaders: Some(leaders) }) => {
                Ok(leaders)
            }
            _ => {
                return Err(EthereumError::LeadersNotFoundError)
            }
        }
    }

    /// Retrieve a staking leader based on the provided filter.
    ///
    /// # Arguments
    ///
    /// * `chain_id` - The chain identifier.
    /// * `filter` - The filter criteria for querying the staking leader.
    ///
    /// # Returns
    ///
    /// A `Result` containing either the staking leader or an `EthereumError` if there was an issue.
    ///
    /// # Examples
    ///
    /// ```
    /// use human_protocol_sdk::{enums::{ChainId}};
    /// use human_protocol_sdk::staking::StakingUtils;
    /// use human_protocol_sdk::graphql::staking_leader_query;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let filter = staking_leader_query::LeaderFilter {
    ///         id: "0x1234567890123456789012345678901234567890".into()
    ///     };
    ///
    ///     let leader = StakingUtils::get_leader(ChainId::PolygonMumbai, filter).await;
    ///     match leader {
    ///         Ok(leader) => {
    ///             println!("{:?}", leader);
    ///         }
    ///         Err(err) => {
    ///             eprintln!("Error: {:?}", err);
    ///         }
    ///     }
    /// }
    /// ```
    pub async fn get_leader(
        chain_id: ChainId,
        filter: staking_leader_query::LeaderFilter
    ) -> Result<staking_leader_query::Leader, EthereumError> {
        let network = NETWORKS.get(&chain_id).ok_or_else(|| EthereumError::NetworkNotFoundForChainIdError(chain_id as u32))?;

        match staking_leader_query::run_query(network.subgraph_url, &filter).await.data {
            Some(staking_leader_query::GetLeaderQuery { leader: Some(leader) }) => {
                Ok(leader)
            }
            _ => {
                return Err(EthereumError::LeaderNotFoundError(filter.id.into()))
            }
        }
    }
    
    /// Retrieve staking rewards based on the provided filter.
    ///
    /// # Arguments
    ///
    /// * `chain_id` - The chain identifier.
    /// * `filter` - The filter criteria for querying staking rewards.
    ///
    /// # Returns
    ///
    /// A `Result` containing either the list of staking rewards or an `EthereumError` if there was an issue.
    ///
    /// # Examples
    ///
    /// ```
    /// use human_protocol_sdk::{enums::{ChainId}};
    /// use human_protocol_sdk::staking::StakingUtils;
    /// use human_protocol_sdk::graphql::staking_rewards_query;
    ///
    /// #[tokio::main]
    /// async fn main() {
    ///     let filter = staking_rewards_query::RewardFilter {
    ///         slasher:  "0x1234567890123456789012345678901234567890".into()
    ///     };
    ///
    ///     let escrows = StakingUtils::get_rewards(ChainId::PolygonMumbai, filter).await;
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
    pub async fn get_rewards(
        chain_id: ChainId,
        filter: staking_rewards_query::RewardFilter
    ) -> Result<Vec<staking_rewards_query::Reward>, EthereumError> {
        let network = NETWORKS.get(&chain_id).ok_or_else(|| EthereumError::NetworkNotFoundForChainIdError(chain_id as u32))?;

        match staking_rewards_query::run_query(network.subgraph_url, &filter).await.data {
            Some(staking_rewards_query::GetRewardsQuery { reward_added_events: Some(reward_added_events) }) => {
                Ok(reward_added_events)
            }
            _ => {
                return Err(EthereumError::RewardsNotFoundForSlasherAddressError(filter.slasher.into()))
            }
        }
    }
}

#[cfg(test)]
mod tests {}