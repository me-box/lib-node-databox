Node Databox
============

A Nodejs library for interfacing with Databox APIs.

Installation
------------

To use this library in your node project, run:

	npm install --save databox

and then within your project:

	const databox = require('node-databox');

Usage
-----

> :warning: While this library is at [0.X.X](http://semver.org/spec/v2.0.0.html) the API may change.

### waitForStoreStatus(href, status, maxRetries=10) ###

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_ | `String` | The store href |
| _status_ | `String` | The status to wait for (e.g. 'active' or 'standby') |
| _maxRetries_ | `Number` | Optional number of times to retry before timing out (default 10) |

**Returns** A `Promise` that resolves when a store status matches `status` or rejects with an error.

### catalog.getRootCatalog() ###

**Returns** A `Promise` that resolves with a JSON object of root catalog or rejects with an error.

### catalog.getStoreCatalog(href) ###

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_ | `String` | The store href |

**Returns** A `Promise` that resolves with a JSON object of a store catalog or rejects with an error.

### catalog.listAvailableStores() ###

A convenience function for listing available stores.

**Returns** A `Promise` that resolves with an array of objects with a store `description`, `hostname`, and `href`, or rejects with an error

### catalog.walkStoreCatalogs() ###

**Returns** A `Promise` that resolves with a JSON array of all store catalogs the calling container has access to or rejects with an error

### catalog.mapStoreCatalogs(callback, thisArg) ###

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _callback_ | `Function` | A function to map onto each store catalog |
| _thisArg_  | `Object`   | The value of `this` in the context of the callback function |

**Returns** A `Promise` that resolves with an array of return values of the callback called on each catalog or rejects with an error

### catalog.registerDatasource(href, metadata) ###

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_     | `String` | The store href |
| _metadata_ | `Object` | Dataource metadata |

**Example**

	catalog.registerDatasource('https://some-store:8080', {
		description: 'Test item',
		contentType: 'text/plain',
		vendor: 'Databox Inc.',
		tyoe: 'Test',
		datasourceid: 'MyLongId',
		storeType: 'databox-store-blob',
		// Optional
		isActuator: false,
		// Optional
		unit: 'cm',
		// Optional
		location: 'kitchen'
	});

**Returns** A `Promise` that resolves or rejects with an error

### timeseries.latest(href, dataSourceID) ###

Reads the latest entry from a given time series store

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_         | `String` | The target store href |
| _dataSourceID_ | `String` | The target datasource ID |

**Returns** A `Promise` that resolves with the latest entry for this timeseries data store endpoint or rejects with an error

### timeseries.since(href, dataSourceID, startTimestamp) ###

Reads since a given range from a given time series store

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_           | `String` | The target store href |
| _dataSourceID_   | `String` | The target datasource ID |
| _startTimestamp_ | `Number` | The timestamp from which to query time series data (inclusive) |

**Returns** A `Promise` that resolves with an array of data for this timeseries data store endpoint or rejects with an error

### timeseries.range(href, dataSourceID, startTimestamp, endTimestamp) ###

Reads in given range from a given time series store

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_           | `String` | The target store href |
| _dataSourceID_   | `String` | The target datasource ID |
| _startTimestamp_ | `Number` | The timestamp from which to query time series data (inclusive) |
| _endTimestamp_   | `Number` | The timestamp to which to query time series data (inclusive) |

**Returns** A `Promise` that resolves with an array of data for this timeseries data store endpoint or rejects with an error

### timeseries.write(href, dataSourceID, data) ###

Writes to a given time series store

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_         | `String` | The target store href |
| _dataSourceID_ | `String` | The target datasource ID |
| _data_         | `Object` | An object to write to a datasource time series |

**Returns** A `Promise` that resolves with the document written to the store (including automatically added timestamp) or rejects with an error

### keyValue.read(href, dataSourceID) ###

Reads from a given key-value store

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_ | `String` | The target store href |
| _key_  | `String` | The target key |

**Returns** A `Promise` that resolves with the document at this endpoint or rejects with an error

### keyValue.write(href, dataSourceID, data) ###

Writes to a given key-value store

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_ | `String` | The target store href |
| _key_  | `String` | The target key |
| _data_ | `Object` | The value to write |

**Returns** A `Promise` that resolves with the document written to the store or rejects with an error

### subscriptions.connect(href) ###

Connects to a target store's notification service

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_ | `String` | The target store href |

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `open` when the notification stream is opened, and `data` with store write event notifications of data for every route the connecting container is subscribed to. The callback function for that event has three parameters: `hostname` (the source store), `datasourceID` (the triggering datasource), and `data` which is the data actually written to the store. Otherwise if there's an error setting up the connection, the `Promise` rejects with an error.

### subscriptions.subscribe(href, dataSourceID, type) ###

Subscribes the caller to write notifications for a given route

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_         | `String` | The target store href |
| _dataSourceID_ | `String` | The target datasource ID |
| _type_         | `String` | "ts" for time series stores or "key" for key-value stores |

**Returns** A `Promise` that resolves silently if the subscription was a success or rejects with an error

### subscrciptions.unsubscribe(href, dataSourceID, type) ###

Unsubscribes the caller to write notifications for a given route

**Parameters**

| Name | Type | Description |
| ---- | ---- | ----------- |
| _href_         | `String` | The target store href |
| _dataSourceID_ | `String` | The target datasource ID |
| _type_         | `String` | "ts" for time series stores or "key" for key-value stores |

**Returns** A `Promise` that resolves silently if the unsubscription was a success or rejects with an error
