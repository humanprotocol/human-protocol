const axios = require('axios');
const convertUrl = require('../utils/url');

module.exports = {
  bulkPayout: async (reputationOracleUrl, escrowAddress, fortunes) => {
    console.log('Doing bulk payouts');
    // a cron job might check how much annotations are in work
    // if this is full - then just push them to the reputation oracle

    await axios.post(convertUrl(reputationOracleUrl), { escrowAddress, fortunes });
  },
};
