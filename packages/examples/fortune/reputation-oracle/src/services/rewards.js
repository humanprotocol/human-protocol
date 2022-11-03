
module.exports = {
  filterAddressesToReward: (web3, addressFortunesEntries) => {
    const filteredResults = [];
    const tmpHashMap = {};

    addressFortunesEntries.forEach((fortuneEntry) => {
      const { fortune } = fortuneEntry;
      if (tmpHashMap[fortune]) {
        return;
      }

      tmpHashMap[fortune] = true;
      filteredResults.push(fortuneEntry);
    });

    return filteredResults.map(fortune => fortune.worker).map(web3.utils.toChecksumAddress);
  },

  calculateRewardForWorker: (totalReward, workerAddresses) => {
    const rewardValue = Math.floor(totalReward / workerAddresses.length);
    return workerAddresses.map(() => rewardValue.toString());
  },
};
