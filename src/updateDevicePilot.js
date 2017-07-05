const rp = require('request-promise-native');
const { dpApiKey, dpBatchSize, dpApiUrl } = require('../config.js');

console.log(`using ${dpApiKey}`);

const uri = `${dpApiUrl}/ingest`;
const headers = { Authorization: `TOKEN ${dpApiKey}` };
const json = true;

const postToDevicePilot = (records) => (
  (records || []).length === 0
    ? Promise.resolve()
    : rp
        .post({
          uri,
          headers,
          json,
          body: records.splice(0, dpBatchSize),
        })
        .then((res) => {
          console.log(JSON.stringify(res));
          return postToDevicePilot(records);
        })
);

module.exports = postToDevicePilot;
