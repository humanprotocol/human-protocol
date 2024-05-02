import { HMToken__factory } from '@human-protocol/core/typechain-types';
import { StorageService } from './storage';
import { sendSlackNotification } from './utils';
import { ConfigService } from './config';
import { TokenId, Web3Service } from './web3';
import { ChainId } from '@human-protocol/sdk';
import { Wallet } from 'ethers';
import { WalletError } from './errors';

/**
 * Interface defining the structure of a transaction record.
 */
interface ITransactionRecord {
  tokenId: TokenId;
  hash: string;
  blockNumber: number;
  value: string;
}

/**
 * Interface defining the structure of balance restrictions information.
 */
interface IBalance {
  maxBalance: bigint;
  minBalance: bigint;
  dailyLimit: bigint;
}

/**
 * Abstract class for managing different types of wallets.
 */
abstract class WalletManager {
  private web3Service: Web3Service;
  public storageService: StorageService;
  public configService: ConfigService;
  public address: string;
  public signer: Wallet;
  public tokenAddress: string | undefined;
  public tokenId: TokenId;

  /**
   * Constructs a new WalletManager instance.
   * @param chainId The chain ID.
   * @param web3Service The Web3 service instance.
   * @param storageService The storage service instance.
   * @param configService The configuration service instance.
   * @param address The wallet address.
   * @param tokenId The token ID.
   */
  constructor(
    chainId: ChainId,
    web3Service: Web3Service,
    storageService: StorageService,
    configService: ConfigService,
    address: string,
    tokenId: TokenId,
  ) {
    this.storageService = storageService;
    this.configService = configService;
    this.web3Service = web3Service;
    this.address = address;
    this.tokenId = tokenId;

    this.signer = this.web3Service.getSigner(chainId);
    const network = this.web3Service.getNetwork(chainId);

    this.tokenAddress = network.tokens[tokenId];
  }

  /**
   * Retrieves balance limits.
   */
  get limits(): IBalance {
    if (this.tokenId === TokenId.HMT) {
      return {
        minBalance: this.configService.hmtTokenMinBalanceHotWallet,
        maxBalance: this.configService.hmtTokenMaxBalanceHotWallet,
        dailyLimit: this.configService.hmtTokenDailyLimitHotWallet,
      };
    } else {
      return {
        minBalance: this.configService.nativeTokenMinBalanceHotWallet,
        maxBalance: this.configService.nativeTokenMaxBalanceHotWallet,
        dailyLimit: this.configService.nativeTokenDailyLimitHotWallet,
      };
    }
  }

  /**
   * Retrieves the wallet balance.
   * @returns The wallet balance.
   */
  public async getBalance(): Promise<bigint> {
    try {
      if (this.tokenAddress && this.tokenId === TokenId.HMT) {
        const token = HMToken__factory.connect(this.tokenAddress, this.signer);
        return token.balanceOf(this.address);
      } else {
        return this.signer.provider!.getBalance(this.address)!;
      }
    } catch (error) {
      console.log('Failed to fetch balance:', error);
      return BigInt(0);
    }
  }

  /**
   * Retrieves the total amount deposited during a day.
   * @returns The total amount deposited during a day.
   */
  public async getDailyLimit(): Promise<bigint> {
    try {
      const data: ITransactionRecord[] = await this.storageService.download(
        this.address,
      );

      if (!data || data.length === 0) {
        return BigInt(0);
      }

      let dailyLimit = BigInt(0);

      data.forEach((tx) => {
        if (tx.tokenId === this.tokenId) {
          dailyLimit += BigInt(tx.value);
        }
      });

      return dailyLimit;
    } catch (error) {
      console.log('Error fetching daily limits:', error);
      throw new Error(WalletError.FAILED_GET_DAILY_LIMITS);
    }
  }

  /**
   * Saves a transaction record.
   * @param tx The transaction record to save.
   * @returns A boolean indicating whether the transaction was saved successfully.
   */
  public async saveTransaction(tx: ITransactionRecord): Promise<boolean> {
    try {
      let data: ITransactionRecord[] = await this.storageService.download(
        this.address,
      );

      if (
        data.length > 0 &&
        !(await this.isBlockInCurrentDay(data[0]?.blockNumber))
      ) {
        data = [];
      }

      data.push(tx);

      await this.storageService.upload(data, this.address);
      return true;
    } catch (error) {
      console.log('Error fetching daily limits:', error);
      throw new Error(WalletError.FAILED_SAVE_TRANSACTION);
    }
  }

  /**
   * Checks if a given block number is within the current day.
   * @param blockNumber The block number to check.
   * @returns A boolean indicating whether the block is within the current day.
   */
  public async isBlockInCurrentDay(blockNumber: number): Promise<boolean> {
    try {
      const block = await this.signer.provider?.getBlock(blockNumber);

      if (!block) {
        throw new Error(WalletError.BLOCK_NOT_FOUND);
      }

      const blockTimestamp = block.timestamp;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setDate(endOfDay.getDate() + 1);
      endOfDay.setHours(0, 0, 0, 0);

      const startOfDayTimestamp = Math.floor(startOfDay.getTime() / 1000);
      const endOfDayTimestamp = Math.floor(endOfDay.getTime() / 1000);

      return (
        blockTimestamp >= startOfDayTimestamp &&
        blockTimestamp <= endOfDayTimestamp
      );
    } catch (error) {
      console.log('Error:', error);
      return false;
    }
  }
}

/**
 * Represents a Hot Wallet.
 */
export class HotWallet extends WalletManager {
  /**
   * Constructs a new HotWallet instance.
   * @param chainId The blockchain chain ID.
   * @param web3Service The Web3 service instance.
   * @param storageService The storage service instance.
   * @param configService The config service instance.
   * @param address The wallet address.
   * @param tokenId The token ID.
   */
  constructor(
    chainId: ChainId,
    web3Service: Web3Service,
    storageService: StorageService,
    configService: ConfigService,
    address: string,
    tokenId: TokenId,
  ) {
    super(
      chainId,
      web3Service,
      storageService,
      configService,
      address,
      tokenId,
    );
  }

  /**
   * Calculates the amount available for deposit to the wallet.
   * @returns The amount available for deposit.
   */
  public async calculateDepositAmount(): Promise<bigint> {
    const balance = await this.getBalance();
    const currentLimit = await this.getDailyLimit();

    const freeLimit = this.limits.dailyLimit - currentLimit;
    const depositLimit = this.limits.maxBalance - balance;

    const depositAmount = freeLimit < depositLimit ? freeLimit : depositLimit;

    if (depositAmount < 0n) {
      return 0n;
    }

    if (balance < this.limits.minBalance) {
      sendSlackNotification(`${this.address} token balance below minimum.`);
    }

    return depositAmount;
  }

  /**
   * Checks whether the wallet is verified.
   * @returns A boolean indicating whether the wallet is verified.
   */
  async isVerified(): Promise<boolean> {
    // TODO: Implement
    return true;
  }
}

export class RefillWallet extends WalletManager {
  constructor(
    chainId: ChainId,
    web3Service: Web3Service,
    storageService: StorageService,
    configService: ConfigService,
    address: string,
    tokenId: TokenId,
  ) {
    super(
      chainId,
      web3Service,
      storageService,
      configService,
      address,
      tokenId,
    );
  }

  /**
   * Transfers a specified amount to the given hot wallet.
   * @param hotWallet The hot wallet to transfer the amount to.
   * @param amount The amount to transfer.
   * @returns The transaction record.
   * @throws Error if the transfer fails.
   */
  async transfer(
    hotWallet: HotWallet,
    amount: bigint,
  ): Promise<ITransactionRecord> {
    try {
      let tx;
      if (this.tokenAddress && this.tokenId === TokenId.HMT) {
        const token = HMToken__factory.connect(this.tokenAddress, this.signer);

        tx = await token.transfer(hotWallet.address, amount);
      } else {
        tx = await this.signer.sendTransaction({
          to: hotWallet.address,
          value: amount,
        });
      }

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error(WalletError.RECEIPT_NOT_RECEIVED);
      }

      return {
        tokenId: hotWallet.tokenId,
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        value: amount.toString(),
      };
    } catch (error) {
      console.log('Failed to transfer funds:', error);
      throw new Error(WalletError.FAILED_TRANSFER_FUNDS);
    }
  }

  /**
   * Refills the specified hot wallet.
   * @param hotWallet The hot wallet to refill.
   * @throws Error if the wallet is not verified, or if the refill process fails.
   */
  async refill(hotWallet: HotWallet) {
    if (!(await hotWallet.isVerified())) {
      throw new Error(WalletError.WALLET_NOT_VERIFIED);
    }

    try {
      const depositAmount = await hotWallet.calculateDepositAmount();

      if (depositAmount === BigInt(0)) {
        return;
      }

      const transactionHistory = await this.transfer(hotWallet, depositAmount);

      await hotWallet.saveTransaction(transactionHistory);
    } catch (error) {
      console.log('Error during refill:', error);
      throw new Error(WalletError.FAILED_REFILL_WALLET);
    }
  }
}
