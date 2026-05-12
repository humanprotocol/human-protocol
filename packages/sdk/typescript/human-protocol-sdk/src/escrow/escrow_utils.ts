import { ethers } from 'ethers';
import { NETWORKS } from '../constants';
import { ChainId, OrderDirection } from '../enums';
import {
  ErrorInvalidAddress,
  ErrorInvalidEscrowAddressProvided,
  ErrorUnsupportedChainID,
} from '../error';
import {
  CancellationRefundData,
  EscrowData,
  GET_CANCELLATION_REFUNDS_QUERY,
  GET_CANCELLATION_REFUND_BY_ADDRESS_QUERY,
  GET_ESCROWS_QUERY,
  GET_ESCROW_BY_ADDRESS_QUERY,
  GET_PAYOUTS_QUERY,
  GET_STATUS_UPDATES_QUERY,
  PayoutData,
  StatusEvent,
} from '../graphql';
import {
  ICancellationRefund,
  ICancellationRefundFilter,
  IEscrow,
  IEscrowsFilter,
  IPayout,
  IPayoutFilter,
  IStatusEvent,
  IStatusEventFilter,
  SubgraphOptions,
} from '../interfaces';
import { EscrowStatus } from '../types';
import { customGqlFetch, getSubgraphUrl, getUnixTimestamp } from '../utils';
/**
 * Utility helpers for escrow-related queries.
 *
 * @example
 * ```ts
 * import { ChainId, EscrowUtils } from '@human-protocol/sdk';
 *
 * const escrows = await EscrowUtils.getEscrows({
 *   chainId: ChainId.POLYGON_AMOY
 * });
 * console.log('Escrows:', escrows);
 * ```
 */
export class EscrowUtils {
  /**
   * This function returns an array of escrows based on the specified filter parameters.
   *
   * @param filter - Filter parameters.
   * @param options - Optional configuration for subgraph requests.
   * @returns List of escrows that match the filter.
   * @throws ErrorInvalidAddress If any filter address is invalid
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   *
   * @example
   * ```ts
   * import { ChainId, EscrowStatus } from '@human-protocol/sdk';
   *
   * const filters = {
   *   status: EscrowStatus.Pending,
   *   from: new Date(2023, 4, 8),
   *   to: new Date(2023, 5, 8),
   *   chainId: ChainId.POLYGON_AMOY
   * };
   * const escrows = await EscrowUtils.getEscrows(filters);
   * console.log('Found escrows:', escrows.length);
   * ```
   */
  public static async getEscrows(
    filter: IEscrowsFilter,
    options?: SubgraphOptions
  ): Promise<IEscrow[]> {
    if (filter.launcher && !ethers.isAddress(filter.launcher)) {
      throw ErrorInvalidAddress;
    }

    if (filter.recordingOracle && !ethers.isAddress(filter.recordingOracle)) {
      throw ErrorInvalidAddress;
    }

    if (filter.reputationOracle && !ethers.isAddress(filter.reputationOracle)) {
      throw ErrorInvalidAddress;
    }

    if (filter.exchangeOracle && !ethers.isAddress(filter.exchangeOracle)) {
      throw ErrorInvalidAddress;
    }

    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    const networkData = NETWORKS[filter.chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    let statuses;
    if (filter.status !== undefined) {
      statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      statuses = statuses.map((status) => EscrowStatus[status]);
    }
    const { escrows } = await customGqlFetch<{ escrows: EscrowData[] }>(
      getSubgraphUrl(networkData),
      GET_ESCROWS_QUERY(filter),
      {
        ...filter,
        launcher: filter.launcher?.toLowerCase(),
        reputationOracle: filter.reputationOracle?.toLowerCase(),
        recordingOracle: filter.recordingOracle?.toLowerCase(),
        exchangeOracle: filter.exchangeOracle?.toLowerCase(),
        status: statuses,
        from: filter.from ? getUnixTimestamp(filter.from) : undefined,
        to: filter.to ? getUnixTimestamp(filter.to) : undefined,
        orderDirection: orderDirection,
        first: first,
        skip: skip,
      },
      options
    );
    return (escrows || []).map((e) => mapEscrow(e, networkData.chainId));
  }

  /**
   * This function returns the escrow data for a given address.
   *
   * > This uses Subgraph
   *
   * @param chainId - Network in which the escrow has been deployed
   * @param escrowAddress - Address of the escrow
   * @param options - Optional configuration for subgraph requests.
   * @returns Escrow data or null if not found.
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   * @throws ErrorInvalidAddress If the escrow address is invalid
   *
   * @example
   * ```ts
   * import { ChainId } from '@human-protocol/sdk';
   *
   * const escrow = await EscrowUtils.getEscrow(
   *   ChainId.POLYGON_AMOY,
   *   "0x1234567890123456789012345678901234567890"
   * );
   * if (escrow) {
   *   console.log('Escrow status:', escrow.status);
   * }
   * ```
   */
  public static async getEscrow(
    chainId: ChainId,
    escrowAddress: string,
    options?: SubgraphOptions
  ): Promise<IEscrow | null> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    if (escrowAddress && !ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidAddress;
    }

    const { escrow } = await customGqlFetch<{ escrow: EscrowData | null }>(
      getSubgraphUrl(networkData),
      GET_ESCROW_BY_ADDRESS_QUERY(),
      { escrowAddress: escrowAddress.toLowerCase() },
      options
    );
    if (!escrow) return null;

    return mapEscrow(escrow, networkData.chainId);
  }

  /**
   * This function returns the status events for a given set of networks within an optional date range.
   *
   * > This uses Subgraph
   *
   * @param filter - Filter parameters.
   * @param options - Optional configuration for subgraph requests.
   * @returns Array of status events with their corresponding statuses.
   * @throws ErrorInvalidAddress If the launcher address is invalid
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   *
   * @example
   * ```ts
   * import { ChainId, EscrowStatus } from '@human-protocol/sdk';
   *
   * const fromDate = new Date('2023-01-01');
   * const toDate = new Date('2023-12-31');
   * const statusEvents = await EscrowUtils.getStatusEvents({
   *   chainId: ChainId.POLYGON,
   *   statuses: [EscrowStatus.Pending, EscrowStatus.Complete],
   *   from: fromDate,
   *   to: toDate
   * });
   * console.log('Status events:', statusEvents.length);
   * ```
   */
  public static async getStatusEvents(
    filter: IStatusEventFilter,
    options?: SubgraphOptions
  ): Promise<IStatusEvent[]> {
    const {
      chainId,
      statuses,
      from,
      to,
      launcher,
      escrowAddress,
      first = 10,
      skip = 0,
      orderDirection = OrderDirection.DESC,
    } = filter;

    if (launcher && !ethers.isAddress(launcher)) {
      throw ErrorInvalidAddress;
    }

    if (escrowAddress && !ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidAddress;
    }

    const networkData = NETWORKS[chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    // If statuses are not provided, use all statuses except Launched
    const effectiveStatuses = statuses ?? [
      EscrowStatus.Launched,
      EscrowStatus.Pending,
      EscrowStatus.Partial,
      EscrowStatus.Paid,
      EscrowStatus.Complete,
      EscrowStatus.Cancelled,
    ];

    const statusNames = effectiveStatuses.map((status) => EscrowStatus[status]);

    const data = await customGqlFetch<{
      escrowStatusEvents: StatusEvent[];
    }>(
      getSubgraphUrl(networkData),
      GET_STATUS_UPDATES_QUERY(from, to, launcher, escrowAddress),
      {
        status: statusNames,
        from: from ? getUnixTimestamp(from) : undefined,
        to: to ? getUnixTimestamp(to) : undefined,
        launcher: launcher || undefined,
        escrowAddress: escrowAddress || undefined,
        orderDirection,
        first: Math.min(first, 1000),
        skip,
      },
      options
    );

    if (!data || !data['escrowStatusEvents']) {
      return [];
    }

    return data['escrowStatusEvents'].map((event) => ({
      timestamp: Number(event.timestamp) * 1000,
      escrowAddress: event.escrowAddress,
      status: event.status as keyof typeof EscrowStatus,
      chainId,
      block: BigInt(event.block),
      txHash: event.txHash,
    }));
  }

  /**
   * This function returns the payouts for a given set of networks.
   *
   * > This uses Subgraph
   *
   * @param filter - Filter parameters.
   * @param options - Optional configuration for subgraph requests.
   * @returns List of payouts matching the filters.
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   * @throws ErrorInvalidAddress If any filter address is invalid
   *
   * @example
   * ```ts
   * import { ChainId } from '@human-protocol/sdk';
   *
   * const payouts = await EscrowUtils.getPayouts({
   *   chainId: ChainId.POLYGON,
   *   escrowAddress: '0x1234567890123456789012345678901234567890',
   *   recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
   *   from: new Date('2023-01-01'),
   *   to: new Date('2023-12-31')
   * });
   * console.log('Payouts:', payouts.length);
   * ```
   */
  public static async getPayouts(
    filter: IPayoutFilter,
    options?: SubgraphOptions
  ): Promise<IPayout[]> {
    const networkData = NETWORKS[filter.chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }
    if (filter.escrowAddress && !ethers.isAddress(filter.escrowAddress)) {
      throw ErrorInvalidAddress;
    }
    if (filter.recipient && !ethers.isAddress(filter.recipient)) {
      throw ErrorInvalidAddress;
    }

    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    const { payouts } = await customGqlFetch<{ payouts: PayoutData[] }>(
      getSubgraphUrl(networkData),
      GET_PAYOUTS_QUERY(filter),
      {
        escrowAddress: filter.escrowAddress?.toLowerCase(),
        recipient: filter.recipient?.toLowerCase(),
        from: filter.from ? getUnixTimestamp(filter.from) : undefined,
        to: filter.to ? getUnixTimestamp(filter.to) : undefined,
        first: Math.min(first, 1000),
        skip,
        orderDirection,
      },
      options
    );
    if (!payouts) {
      return [];
    }

    return payouts.map((payout) => ({
      id: payout.id,
      escrowAddress: payout.escrowAddress,
      recipient: payout.recipient,
      amount: BigInt(payout.amount),
      createdAt: Number(payout.createdAt) * 1000,
    }));
  }

  /**
   * This function returns the cancellation refunds for a given set of networks.
   *
   * > This uses Subgraph
   *
   * @param filter - Filter parameters.
   * @param options - Optional configuration for subgraph requests.
   * @returns List of cancellation refunds matching the filters.
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorInvalidAddress If the receiver address is invalid
   *
   * @example
   * ```ts
   * import { ChainId } from '@human-protocol/sdk';
   *
   * const cancellationRefunds = await EscrowUtils.getCancellationRefunds({
   *    chainId: ChainId.POLYGON_AMOY,
   *    escrowAddress: '0x1234567890123456789012345678901234567890',
   * });
   * console.log('Cancellation refunds:', cancellationRefunds.length);
   * ```
   */
  public static async getCancellationRefunds(
    filter: ICancellationRefundFilter,
    options?: SubgraphOptions
  ): Promise<ICancellationRefund[]> {
    const networkData = NETWORKS[filter.chainId];
    if (!networkData) throw ErrorUnsupportedChainID;
    if (filter.escrowAddress && !ethers.isAddress(filter.escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }
    if (filter.receiver && !ethers.isAddress(filter.receiver)) {
      throw ErrorInvalidAddress;
    }

    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    const { cancellationRefundEvents } = await customGqlFetch<{
      cancellationRefundEvents: CancellationRefundData[];
    }>(
      getSubgraphUrl(networkData),
      GET_CANCELLATION_REFUNDS_QUERY(filter),
      {
        escrowAddress: filter.escrowAddress?.toLowerCase(),
        receiver: filter.receiver?.toLowerCase(),
        from: filter.from ? getUnixTimestamp(filter.from) : undefined,
        to: filter.to ? getUnixTimestamp(filter.to) : undefined,
        first,
        skip,
        orderDirection,
      },
      options
    );

    if (!cancellationRefundEvents || cancellationRefundEvents.length === 0) {
      return [];
    }

    return cancellationRefundEvents.map((event) => ({
      id: event.id,
      escrowAddress: event.escrowAddress,
      receiver: event.receiver,
      amount: BigInt(event.amount),
      block: Number(event.block),
      timestamp: Number(event.timestamp) * 1000,
      txHash: event.txHash,
    }));
  }

  /**
   * This function returns the cancellation refund for a given escrow address.
   *
   * > This uses Subgraph
   *
   * @param chainId - Network in which the escrow has been deployed
   * @param escrowAddress - Address of the escrow
   * @param options - Optional configuration for subgraph requests.
   * @returns Cancellation refund data or null if not found.
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   *
   * @example
   * ```ts
   * import { ChainId } from '@human-protocol/sdk';
   *
   *
   * const cancellationRefund = await EscrowUtils.getCancellationRefund(
   *   ChainId.POLYGON_AMOY,
   *   "0x1234567890123456789012345678901234567890"
   * );
   * if (cancellationRefund) {
   *   console.log('Refund amount:', cancellationRefund.amount);
   * }
   * ```
   */
  public static async getCancellationRefund(
    chainId: ChainId,
    escrowAddress: string,
    options?: SubgraphOptions
  ): Promise<ICancellationRefund | null> {
    const networkData = NETWORKS[chainId];
    if (!networkData) throw ErrorUnsupportedChainID;

    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    const { cancellationRefundEvents } = await customGqlFetch<{
      cancellationRefundEvents: CancellationRefundData[];
    }>(
      getSubgraphUrl(networkData),
      GET_CANCELLATION_REFUND_BY_ADDRESS_QUERY(),
      { escrowAddress: escrowAddress.toLowerCase() },
      options
    );

    if (!cancellationRefundEvents || cancellationRefundEvents.length === 0) {
      return null;
    }

    return {
      id: cancellationRefundEvents[0].id,
      escrowAddress: cancellationRefundEvents[0].escrowAddress,
      receiver: cancellationRefundEvents[0].receiver,
      amount: BigInt(cancellationRefundEvents[0].amount),
      block: Number(cancellationRefundEvents[0].block),
      timestamp: Number(cancellationRefundEvents[0].timestamp) * 1000,
      txHash: cancellationRefundEvents[0].txHash,
    };
  }
}

function mapEscrow(e: EscrowData, chainId: ChainId | number): IEscrow {
  return {
    id: e.id,
    address: e.address,
    amountPaid: BigInt(e.amountPaid),
    balance: BigInt(e.balance),
    count: Number(e.count),
    factoryAddress: e.factoryAddress,
    finalResultsUrl: e.finalResultsUrl,
    finalResultsHash: e.finalResultsHash,
    intermediateResultsUrl: e.intermediateResultsUrl,
    intermediateResultsHash: e.intermediateResultsHash,
    launcher: e.launcher,
    jobRequesterId: e.jobRequesterId,
    manifestHash: e.manifestHash,
    manifest: e.manifest,
    recordingOracle: e.recordingOracle,
    reputationOracle: e.reputationOracle,
    exchangeOracle: e.exchangeOracle,
    recordingOracleFee: e.recordingOracleFee
      ? Number(e.recordingOracleFee)
      : null,
    reputationOracleFee: e.reputationOracleFee
      ? Number(e.reputationOracleFee)
      : null,
    exchangeOracleFee: e.exchangeOracleFee ? Number(e.exchangeOracleFee) : null,
    status: e.status,
    token: e.token,
    totalFundedAmount: BigInt(e.totalFundedAmount),
    createdAt: Number(e.createdAt) * 1000,
    cancellationRequestedAt: e.cancellationRequestedAt
      ? Number(e.cancellationRequestedAt) * 1000
      : null,
    chainId: Number(chainId),
  };
}
