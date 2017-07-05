const {
  dpApiKey,
  dpBatchSize = 100,
} = require('../config.js');

console.log(`using ${dpApiKey}`);

const postToDevicePilot = (records) => {
  while (records.length > 0) {
    const batch = records.splice(0, dpBatchSize);
    console.log(`Posting ${JSON.stringify(batch)}`);
  }
};

module.exports = postToDevicePilot;
