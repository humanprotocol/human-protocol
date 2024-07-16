"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_PAYOUTS_QUERY = void 0;
var graphql_tag_1 = require("graphql-tag");
var PAYOUT_FRAGMENT = (0, graphql_tag_1.default)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  fragment PayoutFields on Payout {\n    id\n    escrowAddress\n    recipient\n    amount\n    createdAt\n  }\n"], ["\n  fragment PayoutFields on Payout {\n    id\n    escrowAddress\n    recipient\n    amount\n    createdAt\n  }\n"])));
var GET_PAYOUTS_QUERY = function (filter) {
    var escrowAddress = filter.escrowAddress, recipient = filter.recipient, from = filter.from, to = filter.to;
    var WHERE_CLAUSE = "\n    where: {\n      ".concat(escrowAddress ? "escrowAddress: $escrowAddress" : '', "\n      ").concat(recipient ? "recipient: $recipient" : '', "\n      ").concat(from ? "createdAt_gte: $from" : '', "\n      ").concat(to ? "createdAt_lt: $to" : '', "\n    }\n  ");
    var LIMIT_CLAUSE = "\n    first: 1000\n  ";
    return (0, graphql_tag_1.default)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    query getPayouts(\n      $escrowAddress: String\n      $recipient: String\n      $from: Int\n      $to: Int\n    ) {\n      payouts(\n        ", "\n        orderBy: createdAt,\n        orderDirection: desc,\n        ", "\n      ) {\n        ...PayoutFields\n      }\n    }\n    ", "\n  "], ["\n    query getPayouts(\n      $escrowAddress: String\n      $recipient: String\n      $from: Int\n      $to: Int\n    ) {\n      payouts(\n        ", "\n        orderBy: createdAt,\n        orderDirection: desc,\n        ", "\n      ) {\n        ...PayoutFields\n      }\n    }\n    ", "\n  "])), WHERE_CLAUSE, LIMIT_CLAUSE, PAYOUT_FRAGMENT);
};
exports.GET_PAYOUTS_QUERY = GET_PAYOUTS_QUERY;
var templateObject_1, templateObject_2;
