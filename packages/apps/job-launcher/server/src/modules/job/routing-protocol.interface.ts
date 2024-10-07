export interface OracleOrder {
  [chainId: number]: {
    [reputationOracle: string]: {
      [oracleType: string]: {
        [jobType: string]: string[];
      };
    };
  };
}

export interface OracleIndex {
  [chainId: number]: {
    [reputationOracle: string]: {
      [oracleType: string]: {
        [jobType: string]: number;
      };
    };
  };
}

export interface OracleHash {
  [chainId: number]: {
    [reputationOracle: string]: {
      [oracleType: string]: {
        [jobType: string]: string;
      };
    };
  };
}
