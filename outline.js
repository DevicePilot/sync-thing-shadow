var AWS = require('aws-sdk');
var iot = new AWS.Iot();
var iotdata = new AWS.IotData({endpoint: 'my.host.tld'});

// list-things
var params = {
  // attributeName: 'STRING_VALUE',
  // attributeValue: 'STRING_VALUE',
  // maxResults: 0,
  nextToken: 'STRING_VALUE', .. || null.
  // thingTypeName: 'STRING_VALUE'
};
iot.listThings(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});
// data (Object) — the de-serialized data returned from the request. Set to null if a request error occurs. The data object has the following properties:
// things — (Array<map>)
// The things.

// thingName — (String)
// The name of the thing.

// thingTypeName — (String)
// The name of the thing type, if the thing has been associated with a type.

// attributes — (map<String>)
// A list of thing attributes which are name-value pairs.

// version — (Integer)
// The version of the thing record in the registry.

// nextToken — (String)
// The token for the next set of results, or null if there are no additional results.


// get-thing-shadow
var params = {
  thingName: 'STRING_VALUE' /* required */
};
iotdata.getThingShadow(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});
// {
//     "state": {
//         "desired": {
//             "attribute1": integer2,
//             "attribute2": "string2",
//             ...
//             "attributeN": boolean2
//         },
//         "reported": {
//             "attribute1": integer1,
//             "attribute2": "string1",
//             ...
//             "attributeN": boolean1
//         },
//         "delta": {
//             "attribute3": integerX,
//             "attribute5": "stringY"
//         }
//     },
//     "metadata": {
//         "desired": {
//             "attribute1": {
//                 "timestamp": timestamp
//             },
//             "attribute2": {
//                 "timestamp": timestamp
//             },
//             ...
//             "attributeN": {
//                 "timestamp": timestamp
//             }
//         },
//         "reported": {
//             "attribute1": {
//                 "timestamp": timestamp
//             },
//             "attribute2": {
//                 "timestamp": timestamp
//             },
//             ...
//             "attributeN": {
//                 "timestamp": timestamp
//             }
//         }
//     },
//     "timestamp": timestamp,
//     "clientToken": "token",
//     "version": version
// }