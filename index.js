/* eslint no-console: "off" */
const getAwsIotShadow = require('./src/getAwsIotShadow');
const updateDevicePilot = require('./src/updateDevicePilot');
const { endpoint, dpApiKey } = require('./config');

console.log(`Syncing ThingShadow for ${endpoint} to DevicePilot key ${dpApiKey}...`);

getAwsIotShadow()
  .then((records) => {
    console.log(`Received ${records.length} state records...`);
    return updateDevicePilot(records);
  })
  .then(() => console.log('Sync completed successfully.'))
  .catch(err => console.error(`Sync failed because: ${JSON.stringify(err)}`));
