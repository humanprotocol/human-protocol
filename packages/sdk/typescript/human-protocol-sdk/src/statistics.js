"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsClient = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
var ethers_1 = require("ethers");
var graphql_request_1 = require("graphql-request");
var graphql_1 = require("./graphql");
var utils_1 = require("./utils");
var constants_1 = require("./constants");
/**
 * ## Introduction
 *
 * This client enables to obtain statistical information from the subgraph.
 *
 * Unlikely from the other SDK clients, `StatisticsClient` does not require `signer` or `provider` to be provided.
 * We just need to create client object using relevant network data.
 *
 * ```ts
 * constructor(network: NetworkData)
 * ```
 *
 * A `Signer` or a `Provider` should be passed depending on the use case of this module:
 *
 * - **Signer**: when the user wants to use this model in order to send transactions caling the contract functions.
 * - **Provider**: when the user wants to use this model in order to get information from the contracts or subgraph.
 *
 * ## Installation
 *
 * ### npm
 * ```bash
 * npm install @human-protocol/sdk
 * ```
 *
 * ### yarn
 * ```bash
 * yarn install @human-protocol/sdk
 * ```
 *
 * ## Code example
 *
 * ```ts
 * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
 *
 * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
 * ```
 */
var StatisticsClient = /** @class */ (function () {
    /**
     * **StatisticsClient constructor**
     *
     * @param {NetworkData} networkData - The network information required to connect to the Statistics contract
     */
    function StatisticsClient(networkData) {
        this.networkData = networkData;
        this.subgraphUrl = (0, utils_1.getSubgraphUrl)(networkData);
    }
    /**
     * This function returns the statistical data of escrows.
     *
     *
     * **Input parameters**
     *
     * ```ts
     * interface IStatisticsParams {
     *   from?: Date;
     *   to?: Date;
     *   limit?: number;
     * }
     * ```
     *
     * ```ts
     * type DailyEscrowsData = {
     *   timestamp: Date;
     *   escrowsTotal: number;
     *   escrowsPending: number;
     *   escrowsSolved: number;
     *   escrowsPaid: number;
     *   escrowsCancelled: number;
     * };
     *
     * type EscrowStatistics = {
     *   totalEscrows: number;
     *   dailyEscrowsData: DailyEscrowsData[];
     * };
     * ```
     *
     *
     * @param {IStatisticsParams} params Statistics params with duration data
     * @returns {EscrowStatistics} Escrow statistics data.
     *
     *
     * **Code example**
     *
     * ```ts
     * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
     *
     * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
     *
     * const escrowStatistics = await statisticsClient.getEscrowStatistics();
     * const escrowStatisticsApril = await statisticsClient.getEscrowStatistics({
     *    from: new Date('2021-04-01'),
     *    to: new Date('2021-04-30'),
     * });
     * ```
     */
    StatisticsClient.prototype.getEscrowStatistics = function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var escrowStatistics, eventDayDatas, e_1;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, (0, graphql_request_1.default)(this.subgraphUrl, graphql_1.GET_ESCROW_STATISTICS_QUERY)];
                    case 1:
                        escrowStatistics = (_a.sent()).escrowStatistics;
                        return [4 /*yield*/, (0, graphql_request_1.default)(this.subgraphUrl, (0, graphql_1.GET_EVENT_DAY_DATA_QUERY)(params), {
                                from: params.from ? params.from.getTime() / 1000 : undefined,
                                to: params.to ? params.to.getTime() / 1000 : undefined,
                            })];
                    case 2:
                        eventDayDatas = (_a.sent()).eventDayDatas;
                        return [2 /*return*/, {
                                totalEscrows: +escrowStatistics.totalEscrowCount,
                                dailyEscrowsData: eventDayDatas.map(function (eventDayData) { return ({
                                    timestamp: new Date(+eventDayData.timestamp * 1000),
                                    escrowsTotal: +eventDayData.dailyEscrowCount,
                                    escrowsPending: +eventDayData.dailyPendingStatusEventCount,
                                    escrowsSolved: +eventDayData.dailyCompletedStatusEventCount,
                                    escrowsPaid: +eventDayData.dailyPaidStatusEventCount,
                                    escrowsCancelled: +eventDayData.dailyCancelledStatusEventCount,
                                }); }),
                            }];
                    case 3:
                        e_1 = _a.sent();
                        return [2 /*return*/, (0, utils_1.throwError)(e_1)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This function returns the statistical data of workers.
     *
     *
     * **Input parameters**
     *
     * ```ts
     * interface IStatisticsParams {
     *   from?: Date;
     *   to?: Date;
     *   limit?: number;
     * }
     * ```
     *
     * ```ts
     * type DailyWorkerData = {
     *   timestamp: Date;
     *   activeWorkers: number;
     * };
     *
     * type WorkerStatistics = {
     *   dailyWorkersData: DailyWorkerData[];
     * };
     * ```
     *
     *
     * @param {IStatisticsParams} params Statistics params with duration data
     * @returns {WorkerStatistics} Worker statistics data.
     *
     *
     * **Code example**
     *
     * ```ts
     * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
     *
     * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
     *
     * const workerStatistics = await statisticsClient.getWorkerStatistics();
     * const workerStatisticsApril = await statisticsClient.getWorkerStatistics({
     *    from: new Date('2021-04-01'),
     *    to: new Date('2021-04-30'),
     * });
     * ```
     */
    StatisticsClient.prototype.getWorkerStatistics = function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var eventDayDatas, e_2;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, graphql_request_1.default)(this.subgraphUrl, (0, graphql_1.GET_EVENT_DAY_DATA_QUERY)(params), {
                                from: params.from ? params.from.getTime() / 1000 : undefined,
                                to: params.to ? params.to.getTime() / 1000 : undefined,
                            })];
                    case 1:
                        eventDayDatas = (_a.sent()).eventDayDatas;
                        return [2 /*return*/, {
                                dailyWorkersData: eventDayDatas.map(function (eventDayData) { return ({
                                    timestamp: new Date(+eventDayData.timestamp * 1000),
                                    activeWorkers: +eventDayData.dailyWorkerCount,
                                }); }),
                            }];
                    case 2:
                        e_2 = _a.sent();
                        return [2 /*return*/, (0, utils_1.throwError)(e_2)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This function returns the statistical data of payments.
     *
     *
     * **Input parameters**
     *
     * ```ts
     * interface IStatisticsParams {
     *   from?: Date;
     *   to?: Date;
     *   limit?: number;
     * }
     * ```
     *
     * ```ts
     * type DailyPaymentData = {
     *   timestamp: Date;
     *   totalAmountPaid: BigNumber;
     *   totalCount: number;
     *   averageAmountPerWorker: BigNumber;
     * };
     *
     * type PaymentStatistics = {
     *   dailyPaymentsData: DailyPaymentData[];
     * };
     * ```
     *
     *
     * @param {IStatisticsParams} params Statistics params with duration data
     * @returns {PaymentStatistics} Payment statistics data.
     *
     *
     * **Code example**
     *
     * ```ts
     * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
     *
     * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
     *
     * console.log(
     *   'Payment statistics:',
     *   (await statisticsClient.getPaymentStatistics()).dailyPaymentsData.map(
     *     (p) => ({
     *       ...p,
     *       totalAmountPaid: p.totalAmountPaid.toString(),
     *       averageAmountPerJob: p.averageAmountPerJob.toString(),
     *       averageAmountPerWorker: p.averageAmountPerWorker.toString(),
     *     })
     *   )
     * );
     *
     * console.log(
     *   'Payment statistics from 5/8 - 6/8:',
     *   (
     *     await statisticsClient.getPaymentStatistics({
     *       from: new Date(2023, 4, 8),
     *       to: new Date(2023, 5, 8),
     *     })
     *   ).dailyPaymentsData.map((p) => ({
     *     ...p,
     *     totalAmountPaid: p.totalAmountPaid.toString(),
     *     averageAmountPerJob: p.averageAmountPerJob.toString(),
     *     averageAmountPerWorker: p.averageAmountPerWorker.toString(),
     *   }))
     * );
     * ```
     */
    StatisticsClient.prototype.getPaymentStatistics = function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var eventDayDatas, e_3;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, graphql_request_1.default)(this.subgraphUrl, (0, graphql_1.GET_EVENT_DAY_DATA_QUERY)(params), {
                                from: params.from ? params.from.getTime() / 1000 : undefined,
                                to: params.to ? params.to.getTime() / 1000 : undefined,
                            })];
                    case 1:
                        eventDayDatas = (_a.sent()).eventDayDatas;
                        return [2 /*return*/, {
                                dailyPaymentsData: eventDayDatas.map(function (eventDayData) { return ({
                                    timestamp: new Date(+eventDayData.timestamp * 1000),
                                    totalAmountPaid: ethers_1.ethers.toBigInt(eventDayData.dailyPayoutAmount),
                                    totalCount: +eventDayData.dailyPayoutCount,
                                    averageAmountPerWorker: eventDayData.dailyWorkerCount === '0'
                                        ? ethers_1.ethers.toBigInt(0)
                                        : ethers_1.ethers.toBigInt(eventDayData.dailyPayoutAmount) /
                                            ethers_1.ethers.toBigInt(eventDayData.dailyWorkerCount),
                                }); }),
                            }];
                    case 2:
                        e_3 = _a.sent();
                        return [2 /*return*/, (0, utils_1.throwError)(e_3)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This function returns the statistical data of HMToken.
     *
     *
     * **Input parameters**
     *
     * ```ts
     * interface IStatisticsParams {
     *   from?: Date;
     *   to?: Date;
     *   limit?: number;
     * }
     * ```
     *
     * ```ts
     * type HMTHolder = {
     *   address: string;
     *   balance: BigNumber;
     * }
     *
     * type DailyHMTData = {
     *   timestamp: Date;
     *   totalTransactionAmount: BigNumber;
     *   totalTransactionCount: number;
     * };
     *
     * type HMTStatistics = {
     *   totalTransferAmount: BigNumber;
     *   totalTransferCount: BigNumber;
     *   totalHolders: number;
     *   holders: HMTHolder[];
     *   dailyHMTData: DailyHMTData[];
     * };
     * ```
     *
     *
     * @param {IStatisticsParams} params Statistics params with duration data
     * @returns {HMTStatistics} HMToken statistics data.
     *
     *
     * **Code example**
     *
     * ```ts
     * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
     *
     * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
     *
     * const hmtStatistics = await statisticsClient.getHMTStatistics();
     *
     * console.log('HMT statistics:', {
     *   ...hmtStatistics,
     *   totalTransferAmount: hmtStatistics.totalTransferAmount.toString(),
     *   holders: hmtStatistics.holders.map((h) => ({
     *     ...h,
     *     balance: h.balance.toString(),
     *   })),
     *   dailyHMTData: hmtStatistics.dailyHMTData.map((d) => ({
     *     ...d,
     *     totalTransactionAmount: d.totalTransactionAmount.toString(),
     *   })),
     * });
     *
     * const hmtStatisticsRange = await statisticsClient.getHMTStatistics({
     *   from: new Date(2023, 4, 8),
     *   to: new Date(2023, 5, 8),
     * });
     *
     * console.log('HMT statistics from 5/8 - 6/8:', {
     *   ...hmtStatisticsRange,
     *   totalTransferAmount: hmtStatisticsRange.totalTransferAmount.toString(),
     *   holders: hmtStatisticsRange.holders.map((h) => ({
     *     ...h,
     *     balance: h.balance.toString(),
     *   })),
     *   dailyHMTData: hmtStatisticsRange.dailyHMTData.map((d) => ({
     *     ...d,
     *     totalTransactionAmount: d.totalTransactionAmount.toString(),
     *   })),
     * });
     * ```
     */
    StatisticsClient.prototype.getHMTStatistics = function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var hmtokenStatistics, holders, eventDayDatas, e_4;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, (0, graphql_request_1.default)(this.subgraphUrl, graphql_1.GET_HMTOKEN_STATISTICS_QUERY)];
                    case 1:
                        hmtokenStatistics = (_a.sent()).hmtokenStatistics;
                        return [4 /*yield*/, (0, graphql_request_1.default)(this.subgraphUrl, (0, graphql_1.GET_HOLDERS_QUERY)())];
                    case 2:
                        holders = (_a.sent()).holders;
                        return [4 /*yield*/, (0, graphql_request_1.default)(this.subgraphUrl, (0, graphql_1.GET_EVENT_DAY_DATA_QUERY)(params), {
                                from: params.from ? params.from.getTime() / 1000 : undefined,
                                to: params.to ? params.to.getTime() / 1000 : undefined,
                            })];
                    case 3:
                        eventDayDatas = (_a.sent()).eventDayDatas;
                        return [2 /*return*/, {
                                totalTransferAmount: ethers_1.ethers.toBigInt(hmtokenStatistics.totalValueTransfered),
                                totalTransferCount: Number(hmtokenStatistics.totalTransferEventCount),
                                totalHolders: +hmtokenStatistics.holders,
                                holders: holders.map(function (holder) { return ({
                                    address: holder.address,
                                    balance: ethers_1.ethers.toBigInt(holder.balance),
                                }); }),
                                dailyHMTData: eventDayDatas.map(function (eventDayData) { return ({
                                    timestamp: new Date(+eventDayData.timestamp * 1000),
                                    totalTransactionAmount: ethers_1.ethers.toBigInt(eventDayData.dailyHMTTransferAmount),
                                    totalTransactionCount: +eventDayData.dailyHMTTransferCount,
                                    dailyUniqueSenders: +eventDayData.dailyUniqueSenders,
                                    dailyUniqueReceivers: +eventDayData.dailyUniqueReceivers,
                                }); }),
                            }];
                    case 4:
                        e_4 = _a.sent();
                        return [2 /*return*/, (0, utils_1.throwError)(e_4)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This function returns the holders of the HMToken with optional filters and ordering.
     *
     * **Input parameters**
     *
     * @param {IHMTHoldersParams} params HMT Holders params with filters and ordering
     * @returns {HMTHolder[]} List of HMToken holders.
     *
     * **Code example**
     *
     * ```ts
     * import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';
     *
     * const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
     *
     * const hmtHolders = await statisticsClient.getHMTHolders({
     *   orderDirection: 'asc',
     * });
     *
     * console.log('HMT holders:', hmtHolders.map((h) => ({
     *   ...h,
     *   balance: h.balance.toString(),
     * })));
     * ```
     */
    StatisticsClient.prototype.getHMTHolders = function () {
        return __awaiter(this, arguments, void 0, function (params) {
            var address, orderDirection, query, holders, e_5;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        address = params.address, orderDirection = params.orderDirection;
                        query = (0, graphql_1.GET_HOLDERS_QUERY)(address);
                        return [4 /*yield*/, (0, graphql_request_1.default)(this.subgraphUrl, query, {
                                address: address,
                                orderBy: 'balance',
                                orderDirection: orderDirection,
                            })];
                    case 1:
                        holders = (_a.sent()).holders;
                        return [2 /*return*/, holders.map(function (holder) {
                                if (holder.address === constants_1.HMTOKEN_OWNER_ADDRESS) {
                                    holder.balance += constants_1.HMTOKEN_INITIAL_MINTED_SUPPLY;
                                }
                                return {
                                    address: holder.address,
                                    balance: ethers_1.ethers.toBigInt(holder.balance),
                                };
                            })];
                    case 2:
                        e_5 = _a.sent();
                        return [2 /*return*/, (0, utils_1.throwError)(e_5)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return StatisticsClient;
}());
exports.StatisticsClient = StatisticsClient;
