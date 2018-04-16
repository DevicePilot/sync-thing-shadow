const rp = require('request-promise-native');
const { dpApiKey, dpBatchSize, dpApiUrl } = require('../config.js');

const uri = `${dpApiUrl}/devices`;
const headers = { Authorization: `TOKEN ${dpApiKey}` };
const json = true;

const postToDevicePilot = records => (
  (records || []).length === 0
    ? Promise.resolve()
    : rp
        .post({
          uri,
          headers,
          json,
          body: records.splice(0, dpBatchSize), // always prefer to batch together records.
        })
        .then(() => postToDevicePilot(records))
        // .catch(() => back-off and retry logic to be added.
);

module.exports = postToDevicePilot;
