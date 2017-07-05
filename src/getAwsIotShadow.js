const AWS = require('aws-sdk');
const flat = require('flat');
const { accessKeyId, secretAccessKey, region, endpoint } = require('../config.js');

AWS.config.update({
  region,
  credentials: new AWS.Credentials(accessKeyId, secretAccessKey),
});
const iot = new AWS.Iot();
const iotdata = new AWS.IotData({ endpoint });

const getThingNames = (thingNames = [], lastNextToken = null) =>
  iot
    .listThings({ nextToken: lastNextToken })
    .promise()
    .then(({ things, nextToken }) => {
      const names = things.map(t => t.thingName);
      thingNames.push(...names);
      return nextToken ? getThingNames(thingNames, nextToken) : Promise.resolve(thingNames);
    });

const extractShadow = (payload) => {
  const shadow = JSON.parse(payload);
  const { state, metadata, timestamp } = shadow;

  const reportedState = (state.reported || {});
  const flatState = flat(reportedState);

  const reportedMetadata = (metadata.reported || {});
  const flatMetadata = flat(reportedMetadata);
  const tsOnlyMetadata =
    Object.keys(flatMetadata)
      .filter(k => k.endsWith('.timestamp'))
      .reduce((o, k) => Object.assign({}, o, {
        [k.replace('.timestamp', '')]: flatMetadata[k],
      }), {});

  return {
    state: flatState,
    metadata: tsOnlyMetadata,
    timestamp,
  };
};

const getThingShadowRecords = thingName =>
  iotdata
    .getThingShadow({ thingName })
    .promise()
    .then(({ payload }) => {
      const { state, metadata, timestamp } = extractShadow(payload);
      const $id = thingName;
      const $ts = state.$ts;

      const fields = Object.keys(state);
      const records = fields
        .filter(f => f !== '$id' && f !== '$ts')
        .map(f => ({
          $id,
          $ts: // respect $ts in data, then reported time, then finally shadow update time.
            $ts ||
            metadata[f].timestamp * 1000 ||
            timestamp * 1000,
          [f]: state[f],
        }));
      return Promise.resolve(records);
    });

const getThingShadowAsRecords = () =>
  getThingNames()
    .then(thingNames =>
      Promise.all(
        thingNames.map(n => getThingShadowRecords(n)),
      ),
    )
    .then((recordSets) => {
      const records = [].concat(...recordSets);
      records.sort((a, b) => a.$ts - b.$ts);
      return Promise.resolve(records);
    });

module.exports = getThingShadowAsRecords;
