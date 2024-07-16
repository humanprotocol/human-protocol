"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
/* eslint-disable no-console */
var statistics_1 = require("../src/statistics");
var constants_1 = require("../src/constants");
var enums_1 = require("../src/enums");
var getEscrowStatistics = function (statisticsClient) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _b = (_a = console).log;
                _c = ['Escrow statistics:'];
                return [4 /*yield*/, statisticsClient.getEscrowStatistics()];
            case 1:
                _b.apply(_a, _c.concat([_g.sent()]));
                _e = (_d = console).log;
                _f = ['Escrow statistics from 5/8 - 6/8:'];
                return [4 /*yield*/, statisticsClient.getEscrowStatistics({
                        from: new Date(2023, 4, 8),
                        to: new Date(2023, 5, 8),
                    })];
            case 2:
                _e.apply(_d, _f.concat([_g.sent()]));
                return [2 /*return*/];
        }
    });
}); };
var getWorkerStatistics = function (statisticsClient) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _b = (_a = console).log;
                _c = ['Worker statistics:'];
                return [4 /*yield*/, statisticsClient.getWorkerStatistics()];
            case 1:
                _b.apply(_a, _c.concat([_g.sent()]));
                _e = (_d = console).log;
                _f = ['Worker statistics from 5/8 - 6/8:'];
                return [4 /*yield*/, statisticsClient.getWorkerStatistics({
                        from: new Date(2023, 4, 8),
                        to: new Date(2023, 5, 8),
                    })];
            case 2:
                _e.apply(_d, _f.concat([_g.sent()]));
                return [2 /*return*/];
        }
    });
}); };
var getPaymentStatistics = function (statisticsClient) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _b = (_a = console).log;
                _c = ['Payment statistics:'];
                return [4 /*yield*/, statisticsClient.getPaymentStatistics()];
            case 1:
                _b.apply(_a, _c.concat([(_g.sent()).dailyPaymentsData.map(function (p) { return (__assign(__assign({}, p), { totalAmountPaid: p.totalAmountPaid.toString() })); })]));
                _e = (_d = console).log;
                _f = ['Payment statistics from 5/8 - 6/8:'];
                return [4 /*yield*/, statisticsClient.getPaymentStatistics({
                        from: new Date(2023, 4, 8),
                        to: new Date(2023, 5, 8),
                    })];
            case 2:
                _e.apply(_d, _f.concat([(_g.sent()).dailyPaymentsData.map(function (p) { return (__assign(__assign({}, p), { totalAmountPaid: p.totalAmountPaid.toString() })); })]));
                return [2 /*return*/];
        }
    });
}); };
var getHMTStatistics = function (statisticsClient) { return __awaiter(void 0, void 0, void 0, function () {
    var hmtStatistics, hmtStatisticsRange;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, statisticsClient.getHMTStatistics()];
            case 1:
                hmtStatistics = _a.sent();
                console.log('HMT statistics:', __assign(__assign({}, hmtStatistics), { totalTransferAmount: hmtStatistics.totalTransferAmount.toString(), totalTransferCount: hmtStatistics.totalTransferCount, holders: hmtStatistics.holders.map(function (h) { return (__assign(__assign({}, h), { balance: h.balance.toString() })); }), dailyHMTData: hmtStatistics.dailyHMTData.map(function (d) { return (__assign(__assign({}, d), { totalTransactionAmount: d.totalTransactionAmount.toString() })); }) }));
                return [4 /*yield*/, statisticsClient.getHMTStatistics({
                        from: new Date(2023, 4, 8),
                        to: new Date(2023, 5, 8),
                    })];
            case 2:
                hmtStatisticsRange = _a.sent();
                console.log('HMT statistics from 5/8 - 6/8:', __assign(__assign({}, hmtStatisticsRange), { totalTransferAmount: hmtStatisticsRange.totalTransferAmount.toString(), totalTransferCount: hmtStatistics.totalTransferCount, holders: hmtStatisticsRange.holders.map(function (h) { return (__assign(__assign({}, h), { balance: h.balance.toString() })); }), dailyHMTData: hmtStatisticsRange.dailyHMTData.map(function (d) { return (__assign(__assign({}, d), { totalTransactionAmount: d.totalTransactionAmount.toString() })); }) }));
                return [2 /*return*/];
        }
    });
}); };
var getHmtHolders = function (statisticsClient) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _b = (_a = console).log;
                _c = ['HMT holder:'];
                return [4 /*yield*/, statisticsClient.getHMTHolders({
                        address: constants_1.HMTOKEN_OWNER_ADDRESS
                    })];
            case 1:
                _b.apply(_a, _c.concat([_g.sent()]));
                _e = (_d = console).log;
                _f = ['HMT holders sorted:'];
                return [4 /*yield*/, statisticsClient.getHMTHolders({
                        orderDirection: 'desc',
                    })];
            case 2:
                _e.apply(_d, _f.concat([_g.sent()]));
                return [2 /*return*/];
        }
    });
}); };
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var statisticsClient;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!constants_1.NETWORKS[enums_1.ChainId.POLYGON]) {
                    return [2 /*return*/];
                }
                statisticsClient = new statistics_1.StatisticsClient(constants_1.NETWORKS[enums_1.ChainId.POLYGON]);
                return [4 /*yield*/, getEscrowStatistics(statisticsClient)];
            case 1:
                _a.sent();
                return [4 /*yield*/, getWorkerStatistics(statisticsClient)];
            case 2:
                _a.sent();
                return [4 /*yield*/, getPaymentStatistics(statisticsClient)];
            case 3:
                _a.sent();
                return [4 /*yield*/, getHMTStatistics(statisticsClient)];
            case 4:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })();
