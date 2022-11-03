
const EscrowFile = require('../build/contracts/Escrow.json');

module.exports = {
  getBalance: async (web3, escrowAddress) => {
    const Escrow = new web3.eth.Contract(EscrowFile.abi, escrowAddress);
    return Number(await Escrow.methods.getBalance().call());
  },

  bulkPayOut: async (web3, escrowAddress, workerAddresses, rewards, resultsUrl, resultHash) => {
    const Escrow = new web3.eth.Contract(EscrowFile.abi, escrowAddress);
    const gasNeeded = await Escrow.methods.bulkPayOut(workerAddresses, rewards, resultsUrl, resultHash, 1).estimateGas({ from: web3.eth.defaultAccount });
    const gasPrice = await web3.eth.getGasPrice();

    console.log(`bulkpayout will be send, gasNeeded : ${gasNeeded}, gasPrice: ${gasPrice} `);

    await Escrow.methods.bulkPayOut(workerAddresses, rewards, resultsUrl, resultHash, 1).send({ from: web3.eth.defaultAccount, gas: gasNeeded, gasPrice });
  },

  bulkPaid: async (web3, escrowAddress) => {
    const Escrow = new web3.eth.Contract(EscrowFile.abi, escrowAddress);
    const result = await Escrow.methods.bulkPaid().call();
    return result;
  },

};
