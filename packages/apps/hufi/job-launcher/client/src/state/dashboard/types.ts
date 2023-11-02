export type LiquidityData = {
  avgTimeToComplete: number;
  performanceAccuracy: number;
  jobCostRange: {
    min: number;
    max: number;
    avg: number;
  };
  totalJobs: number;
};

export type OracleReputation = 'high' | 'medium' | 'low';

export type WorkersPerformance = {
  reputation: number;
  timeToComplete: number;
  completionAccuracy: number;
};

export type DashboardState = {
  liquidity?: LiquidityData;
  oracleReputation?: OracleReputation;
  workersPerformance?: WorkersPerformance;
  dataLoaded: boolean;
};
