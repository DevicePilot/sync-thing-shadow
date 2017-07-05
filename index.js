const AWS = require('aws-sdk');

const iot = new AWS.Iot();
const iotdata = new AWS.IotData({ endpoint: process.env.AWS_ENDPOINT });

const getThingNames = (thingNames = [], lastNextToken = null) =>
  iot
    .listThings({ nextToken: lastNextToken })
    .promise()
    .then(({ things, nextToken }) => {
      const names = things.map(t => t.thingName);
      thingNames.push([...names]);
      return nextToken ? getThingNames(thingNames, nextToken) : Promise.resolve(thingNames);
    });

const getThingShadowRecords = thingName =>
  iotdata
    .getThingShadow({ thingName })
    .promise()
    .then(({ state, metadata, timestamp }) => {
      const $id = thingName;
      // todo: flatten state
      const fields = Object.keys(state.reported);
      const records = fields.map(f => ({
        $id,
        $ts: metadata.reported[f].timestamp || timestamp, // todo: convert to expected
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
      const records = [].concat(recordSets);
      records.sort((a, b) => a.$ts - b.$ts);
      return Promise.resolve(records);
    });

const DP_BATCH_SIZE = 200;

const postToDevicePilot = () =>
  getThingShadowAsRecords()
    .then((records) => {
      while (records) {
        const batch = records.splice(0, DP_BATCH_SIZE);
        console.log(`Posting ${JSON.stringify(batch)}`);
      }
    });

