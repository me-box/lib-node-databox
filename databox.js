exports.catalog            = require('./lib/catalog.js');
exports.timeseries         = require('./lib/time-series.js');
exports.keyValue           = require('./lib/key-value.js');
exports.subscriptions      = require('./lib/subscriptions.js');

//export service
exports.export             = require('./lib/export.js');

//core-store
let coreStore = require('./lib/core-store.js');
exports.NewKeyValueClient            = coreStore.NewKeyValueClient;
exports.NewTimeSeriesClient          = coreStore.NewTimeSeriesClient;

//Helper functions
exports.waitForStoreStatus      = require('./lib/utils.js').waitForStoreStatus;
exports.getHttpsCredentials     = require('./lib/utils.js').getHttpsCredentials;
exports.NewDataSourceMetadata   = coreStore.NewDataSourceMetadata;
exports.DataSourceMetadataToHypercat = coreStore.DataSourceMetadataToHypercat;