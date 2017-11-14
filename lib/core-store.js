
let zestClient = require('nodezestclient');

let serverKey = fs.readFileSync("/run/secrets/ZMQ_PUBLIC_KEY");

// NewKeyValueClient returns a new KeyValueClient to enable reading and writing of binary data key value to the store
// reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment variable to databox apps and drivers.
exports.NewKeyValueClient = function (reqEndpoint, enableLogging) {

    let kvc = {
        Post: function () {

        },
        Get: function () {

        },
        Observe: function () {

        }
    };

    kvc.zestEndpoint = reqEndpoint
	kvc.zestDealerEndpoint = reqEndpoint.replace(":5555", ":5556");
    kvc.zestClient = zestClient.New(kvc.zestEndpoint, kvc.zestDealerEndpoint, serverKey, enableLogging);

    return kvc
};

// NewTimeSeriesClient returns a new TimeSeriesClient to enable reading and writing of binary data key value to the store
// reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment variable to databox apps and drivers.
exports.NewTimeSeriesClient = function (reqEndpoint, enableLogging) {
    let tsc = {
        Post: function () {

        },
        Get: function () {

        },
        Observe: function () {

        }
    };

    tsc.zestEndpoint = reqEndpoint
	tsc.zestDealerEndpoint = reqEndpoint.replace(":5555", ":5556");
    tsc.zestClient = zestClient.New(kvc.zestEndpoint, kvc.zestDealerEndpoint, serverKey, enableLogging);

    return kvc
};