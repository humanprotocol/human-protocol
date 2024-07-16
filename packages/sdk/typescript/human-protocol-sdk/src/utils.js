"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubgraphUrl = exports.isValidUrl = exports.throwError = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
var ethers_1 = require("ethers");
var error_1 = require("./error");
var constants_1 = require("./constants");
/**
 * **Handle and throw the error.*
 *
 * @param {any} e
 * @returns
 */
var throwError = function (e) {
    if (ethers_1.ethers.isError(e, 'INVALID_ARGUMENT')) {
        throw new error_1.InvalidArgumentError(e.message);
    }
    else if (ethers_1.ethers.isError(e, 'CALL_EXCEPTION')) {
        throw new error_1.ContractExecutionError(e.reason);
    }
    else if (ethers_1.ethers.isError(e, 'TRANSACTION_REPLACED')) {
        throw new error_1.TransactionReplaced(e.message);
    }
    else if (ethers_1.ethers.isError(e, 'REPLACEMENT_UNDERPRICED')) {
        throw new error_1.ReplacementUnderpriced(e.message);
    }
    else if (ethers_1.ethers.isError(e, 'NUMERIC_FAULT')) {
        throw new error_1.NumericFault(e.message);
    }
    else if (ethers_1.ethers.isError(e, 'NONCE_EXPIRED')) {
        throw new error_1.NonceExpired(e.message);
    }
    else {
        throw new error_1.EthereumError(e.message);
    }
};
exports.throwError = throwError;
/**
 * **URL validation.*
 *
 * @param {string} url
 * @returns
 */
var isValidUrl = function (url) {
    try {
        new URL(url);
        return true;
    }
    catch (err) {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
/**
 * **Get the subgraph URL.*
 *
 * @param {NetworkData} networkData
 * @param {string} apiKey
 * @returns
 */
var getSubgraphUrl = function (networkData) {
    var subgraphUrl = networkData.subgraphUrl;
    if (process.env.SUBGRAPH_API_KEY) {
        subgraphUrl = networkData.subgraphUrlApiKey.replace(constants_1.SUBGRAPH_API_KEY_PLACEHOLDER, process.env.SUBGRAPH_API_KEY);
    }
    else {
        // eslint-disable-next-line no-console
        console.warn(error_1.WarnSubgraphApiKeyNotProvided);
    }
    return subgraphUrl;
};
exports.getSubgraphUrl = getSubgraphUrl;
