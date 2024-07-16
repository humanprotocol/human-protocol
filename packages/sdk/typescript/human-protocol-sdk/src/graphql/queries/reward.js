"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_REWARD_ADDED_EVENTS_QUERY = void 0;
var graphql_tag_1 = require("graphql-tag");
var REWARD_ADDED_EVENT_FRAGMENT = (0, graphql_tag_1.default)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  fragment RewardAddedEventFields on RewardAddedEvent {\n    escrowAddress\n    staker\n    slasher\n    amount\n  }\n"], ["\n  fragment RewardAddedEventFields on RewardAddedEvent {\n    escrowAddress\n    staker\n    slasher\n    amount\n  }\n"])));
exports.GET_REWARD_ADDED_EVENTS_QUERY = (0, graphql_tag_1.default)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  query GetRewardAddedEvents($slasherAddress: String!) {\n    rewardAddedEvents(where: { slasher: $slasherAddress }) {\n      ...RewardAddedEventFields\n    }\n  }\n  ", "\n"], ["\n  query GetRewardAddedEvents($slasherAddress: String!) {\n    rewardAddedEvents(where: { slasher: $slasherAddress }) {\n      ...RewardAddedEventFields\n    }\n  }\n  ", "\n"])), REWARD_ADDED_EVENT_FRAGMENT);
var templateObject_1, templateObject_2;
