const getAwsIotShadow = require('./src/getAwsIotShadow');
const updateDevicePilot = require('./src/updateDevicePilot');

getAwsIotShadow()
  .then(records => updateDevicePilot(records))
  .then(() => 'ok')
  .catch(err => console.error(err));
