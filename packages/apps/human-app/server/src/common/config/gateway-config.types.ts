import {
  HCaptchaLabelingStatsEndpoints,
  HCaptchaLabelingVerifyEndpoints,
  ReputationOracleEndpoints,
} from '../enums/reputation-oracle-endpoints';

export type GatewayEndpoints =
  | HCaptchaLabelingStatsEndpoints
  | ReputationOracleEndpoints
  | HCaptchaLabelingVerifyEndpoints;
