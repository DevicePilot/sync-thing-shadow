module.exports = {
  // import configuration
  includeRecord: r => r.$ts <= (process.env.DP_UNTIL || Date.now()),
    // use to ignore updates since connection.
  // aws configuration
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  // devicepilot configuration
  dpApiKey: process.env.DP_API_KEY,
  dpApiUrl: process.env.DP_API_URL || 'https://api.devicepilot.com',
  dpBatchSize: 250, // the maximum batch size allowed is 500.
  dpBatchDelay: 5000, // be a responsible api client.
};
