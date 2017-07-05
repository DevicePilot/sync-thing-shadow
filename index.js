const AWS = require('aws-sdk');

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

const getThingShadowRecords = thingName =>
  iotdata
    .getThingShadow({ thingName })
    .promise()
    .then(({ payload }) => {
      const shadow = JSON.parse(payload);
      const { state, metadata, timestamp } = shadow;
      const $id = thingName;
      const $ts = (state.reported || {}).$ts;
      // todo: flatten state
      const fields = Object.keys(state.reported || {});
      const records = fields
        .filter(f =>
          f !== '$id' &&
          f !== '$ts' &&
          state.reported[f] !== undefined,
        )
        .map(f => ({
          $id,
          $ts: // respect $ts in data, then reported time, then finally shadow update time.
            $ts ||
            (metadata.reported || {})[f].timestamp * 1000 ||
            timestamp * 1000,
          [f]: state.reported[f],
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

const DP_BATCH_SIZE = 10;

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

