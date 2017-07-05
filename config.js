module.exports = {
  // aws common configuration
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  // aws iot configuration
  endpoint: process.env.AWS_ENDPOINT,
  // devicepilot configuration
  dpApiKey: process.env.DP_API_KEY,
  dpApiUrl: process.env.DP_API_URL || 'https://api.devicepilot.com',
  dpBatchSize: 100,
};
