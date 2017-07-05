const AWS = require('aws-sdk');
const flat = require('flat');

const region = process.env.AWS_REGION;
const endpoint = process.env.AWS_ENDPOINT;

const iot = new AWS.Iot({ region });
const iotdata = new AWS.IotData({ region, endpoint });

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

const DP_BATCH_SIZE = 100;

const postToDevicePilot = () =>
  getThingShadowAsRecords()
    .then((records) => {
      while (records.length > 0) {
        const batch = records.splice(0, DP_BATCH_SIZE);
        console.log(`Posting ${JSON.stringify(batch)}`);
      }
    });

postToDevicePilot()
    .catch(err => console.error(err)); // eslint-disable-line no-console

