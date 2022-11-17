const axios = require('axios');
const convertUrl = require('../utils/url');

module.exports = {
  getManifest: async (manifestUrl) => {
    const manifestResponse = await axios.get(convertUrl(manifestUrl));
    return manifestResponse.data;
  },
};
