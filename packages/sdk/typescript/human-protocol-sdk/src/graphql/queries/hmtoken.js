"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_HOLDERS_QUERY = void 0;
var graphql_tag_1 = require("graphql-tag");
var HOLDER_FRAGMENT = (0, graphql_tag_1.default)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  fragment HolderFields on Holder {\n    address\n    balance\n  }\n"], ["\n  fragment HolderFields on Holder {\n    address\n    balance\n  }\n"])));
var GET_HOLDERS_QUERY = function (address) {
    var WHERE_CLAUSE = "\n    where: {\n      ".concat(address ? "address: $address," : '', "\n    }\n  ");
    return (0, graphql_tag_1.default)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    query GetHolders(\n      $address: String\n      $orderBy: String\n      $orderDirection: String\n    ) {\n      holders(\n        ", "\n        orderBy: $orderBy,\n        orderDirection: $orderDirection\n      ) {\n        ...HolderFields\n      }\n    }\n    ", "\n  "], ["\n    query GetHolders(\n      $address: String\n      $orderBy: String\n      $orderDirection: String\n    ) {\n      holders(\n        ", "\n        orderBy: $orderBy,\n        orderDirection: $orderDirection\n      ) {\n        ...HolderFields\n      }\n    }\n    ", "\n  "])), WHERE_CLAUSE, HOLDER_FRAGMENT);
};
exports.GET_HOLDERS_QUERY = GET_HOLDERS_QUERY;
var templateObject_1, templateObject_2;
