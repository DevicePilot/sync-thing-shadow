/* eslint no-console: "off" */
const rp = require('request-promise-native');
const { dpApiKey, dpBatchSize, dpApiUrl, dpBatchDelay } = require('../config.js');

const uri = `${dpApiUrl}/devices`;
const headers = { Authorization: `TOKEN ${dpApiKey}` };
const json = true;

const showProgress = (records) => {
  // stay within api usage by waiting between batches.
  console.log(`Sending shadow updates (${(records || []).length}) remaining...`);
  return new Promise(res => setTimeout(res, dpBatchDelay));
};

const postToDevicePilot = records => (
  (records || []).length === 0
    ? Promise.resolve()
    : showProgress(records)
      .then(() => rp
        .post({
          uri,
          headers,
          json,
          body: records.splice(0, dpBatchSize), // always prefer to batch together records.
        }))
      .then(() => postToDevicePilot(records))
      // .catch(() => TODO: back-off and retry logic.
);

module.exports = postToDevicePilot;
