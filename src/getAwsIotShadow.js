const AWS = require('aws-sdk');
const flat = require('flat');
const { accessKeyId, secretAccessKey, region, endpoint, includeRecord } = require('../config.js');

AWS.config.update({
  region,
  credentials: new AWS.Credentials(accessKeyId, secretAccessKey),
});
const iot = new AWS.Iot();
const iotData = new AWS.IotData({ endpoint });

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
    timestamps: tsOnlyMetadata,
    timestamp,
  };
};

const getThingShadowRecords = thingName =>
  iotData
    .getThingShadow({ thingName })
    .promise()
    .then(({ payload }) => {
      const { state, timestamps, timestamp } = extractShadow(payload);
      const $id = thingName;

      const fields = Object.keys(state);
      const records = fields
        .filter(f => f !== '$id' && f !== '$ts')
        .map(f => ({
          $id,
          $ts: // prefer reported time, to complete shadow update time.
            timestamps[f] * 1000 ||
            timestamp * 1000,
          [f]: state[f],
        }));
      return Promise.resolve(records);
    });

const groupRecordsByTime = (recordSets) => {
  // records in DevicePilot can be grouped by common $id and $ts.
  const records = [].concat(...(recordSets || []).map((set) => {
    set.sort((a, b) => a.$ts - b.$ts);
    const chunks = [];
    let chunk = {};
    set.forEach((r) => {
      if (r.$ts === chunk.$ts) {
        Object.assign(chunk, r);
      } else {
        if (chunk.$ts) { chunks.push(chunk); }
        chunk = r;
      }
    });
    if (chunk.$ts) { chunks.push(chunk); }
    return chunks;
  }));
  return records;
};

const getThingShadowAsRecords = () =>
  getThingNames()
    .then(thingNames => Promise.all(thingNames.map(n => getThingShadowRecords(n))))
    .then((recordSets) => {
      const records = groupRecordsByTime(recordSets);
      // records should be sorted going forward in time.
      records.sort((a, b) => a.$ts - b.$ts);
      const inRange = records.filter(includeRecord);
      return Promise.resolve(inRange);
    });

module.exports = getThingShadowAsRecords;
