export interface NetworkSettings {
  1338: ReputationSettings;
  80001: ReputationSettings;
}

export interface ReputationSettings {
  httpServer: string;
  reputation: string;
}

export const networks: NetworkSettings = {
  1338: {
    httpServer: 'http://127.0.0.1:8545',
    reputation: '0x67d269191c92Caf3cD7723F116c85e6E9bf55933',
  },
  80001: {
    httpServer: 'http://127.0.0.1:8545',
    reputation: '0x67d269191c92Caf3cD7723F116c85e6E9bf55933',
  },
};
