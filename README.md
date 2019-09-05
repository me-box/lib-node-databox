# Node Databox


A Nodejs library used by databox apps and drivers to interfac with Databox APIs.

## Installation

To use this library in your node project, run:

    npm install --save node-databox

and then within your project:

    const databox = require('node-databox');

# Usage


> :warning: While this library is at [1.0.0](http://semver.org/spec/v2.0.0.html) the API may change.

Examples of usage are provided in the https://github.com/me-box/databox-quickstart repository.


## Helper Functions

These functions are useful for parsing the configuration data passed to your app or driver.

### GetHttpsCredentials()

**Returns** An object containing the HTTPS credentials to pass to https.createServer when offering an https server. These are read from /run/secrets/DATABOX.pem and are generated by the container-manager at run time. This is useful for apps and driver offering interfaces over https.

### NewDataSourceMetadata ()

**Returns** An empty DataSourceMetadata object

DataSourceMetadata objects are used to describe your data source when creating a new one. They look like this:

```JS
    {
        Description:    "", // Text Description of your dataSource
        ContentType:    "", // The format the data is written in
                            // JSON,BINARY or TEXT.
        Vendor:         "", // Your company name.
        DataSourceType: "", // A short type string that represents your data
                            // it is used by apps to find the data you offer.
        DataSourceID:   "", // the ID of this data source, as the creator you
                            // are responsible for ensuring this is unique
                            // within your data store.
        StoreType:      "", // The type of store this uses
                            // (ts,ts/blob or kv)
        IsActuator:  false, // is this an IsActuator? it true other apps can
                            // request write access to this datasource
        Unit:           "", // Text representation of the units
        Location:       "", // Text representation of location Information
    };
```

### DataSourceMetadataToHypercat (DataSourceMetadata)

 Name | Type | Description |
| ---- | ---- | ----------- |
| _DataSourceMetadata_ | `Object` | An object of the form returned by NewDataSourceMetadata |

**Returns** An object representing the hypercat item represented by DataSourceMetadata.

### HypercatToDataSourceMetadata (hyperCatString)

 Name | Type | Description |
| ---- | ---- | ----------- |
| _hyperCatString_ | `String` | A string representation of the hypercat Item representing a data source |

**Returns** an object of the form { "DataSourceMetadata": <DataSourceMetadata>, "DataSourceURL":store_url}

### HypercatToDataStoreUrl (hyperCatString)

 Name | Type | Description |
| ---- | ---- | ----------- |
| _hyperCatString_ | `String` | A string representation of the hypercat Item representing a data source |

**Returns** a string holding the store endpoint URL

## Using the databox core-store

The databox core-store supports the reading, writing, querying of time series and key value data. It is the default store for Databox version 0.3.0 and greater.

The time series API has support for writing generic JSON blobs (see TSBlob) or data in a specific format (see TS) which allows extra functionality such as joining, filtering and aggregation on the data. The key value API stores data against keys (see KV). All three type of data can be accessed through the databox.StoreClient.

## databox.NewStoreClient (STORE_URI, ARBITER_URI, enableLogging)


| Name | Type | Description |
| ---- | ---- | ----------- |
| _STORE_URI_ | `String` | dataStore to access found in DATABOX_STORE_URL for drivers and in HypercatToDataStoreUrl( DATASOURCE_[clientId] ) for each datasource required by an app |
| _ARBITER_URI_ | `String` | the URI to the arbiter available in DATABOX_ARBITER_ENDPOINT env var within databox |
| _enableLogging_ | `Bool` | Turns on verbose debug output |

**Returns** a new StoreClient that is connected to the provided store.

**example**
To create a new client to access a store:
```js
   const databox = require('node-databox');
   let client = databox.NewStoreClient(STORE_URI, ARBITER_URI, false)
```

### databox.StoreClient.RegisterDatasource (DataSourceMetadata)

This function registers your data sources with your store. Registering your data source makes them available to other databox apps.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _DataSourceMetadata_ | `Object` | of the form returned by NewDataSourceMetadata |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.


## storeClient.TS

These functions allow you to manage structured json data in the time series store and allow for filtering and aggregation of the data.

Data written into a TimeSeriesStore must contain, A value (integer or floating point number) and a tag is an identifier with corresponding string value. For example:{"room": "lounge", "value": 1}. Tagging a value provides a way to group values together when accessing them. In the example provided you could retrieve all values that are in a room called 'lounge'.

Data returned from a query is a JSON dictionary containing a timestamp in epoch milliseconds and the actual data. For example:{"timestamp":1513160985841,"data":{"foo":"bar","value":1}}. Data can also be aggregated by applying functions across values. Aggregation functions result in a response of a single value. For example: {"result":1}.

The storeClient.TS supports the following functions:


### storeClient.TS.Write (dataSourceID, payload)

Data written to the store for the given dataSourceID data is timestamped with milliseconds since the unix epoch on insert.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _payload_ | `Object` | A JSON serializable Object to write to the store |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### storeClient.TS.WriteAt (dataSourceID, timestamp, payload)

Writes data to the store for the given dataSourceID at the given timestamp. Timestamp should be in milliseconds since the unix epoch.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timestamp_ | `Int` | milliseconds since the unix epoch |
| _payload_ | `Object` | A JSON serializable Object to write to the store |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### storeClient.TS.Latest (dataSourceID)

Reads the latest data written to the provided dataSourceID.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```
 on success or rejects with error message on error.

### storeClient.TS.LastN (dataSourceID,n)

Reads the last N items written to the provided dataSourceID.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _N_ | `Int` | number of results to return |
| _aggregation_ | `String` sum|count|min|max|mean|median|sd | Optional aggregation function |
| _filterTagName_ | `String` | The name of the tag to filter on |
| _filterType_ | `String` equals|contains | where 'equals' is an exact match and 'contains' is a substring match |
| _filterValue_ | `String` | the value to search for in the tag data |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```
 on success or rejects with error message on error.

### storeClient.TS.Since (dataSourceID, sinceTimeStamp, aggregation, filterTagName, filterType, filterValue)

Read all entries since a time (inclusive)

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _sinceTimeStamp_ | `Int` | timestamp im ms form to return data after |
| _aggregation_ | `String` sum|count|min|max|mean|median|sd | Optional aggregation function |
| _filterTagName_ | `String` | Optional name of the tag to filter on |
| _filterType_ | `String` equals|contains | Optional where 'equals' is an exact match and 'contains' is a substring match |
| _filterValue_ | `String` | Optional value to search for in the tag data |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```

### storeClient.TS.Range (dataSourceID, fromTimeStamp, toTimeStamp, aggregation, filterTagName, filterType, filterValue)

Read all entries in a time range (inclusive)

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _fromTimeStamp_ | `Int` | timestamp in ms form which to return data after |
| _toTimeStamp_ | `Int` | timestamp in ms before which data will be returned |
| _aggregation_ | `String` sum|count|min|max|mean|median|sd | Optional aggregation function |
| _filterTagName_ | `String` | Optional name of the tag to filter on |
| _filterType_ | `String` equals|contains | Optional where 'equals' is an exact match and 'contains' is a substring match |
| _filterValue_ | `String` | Optional value to search for in the tag data |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```

### storeClient.TS.Observe (dataSourceID,timeout)

This function allows you to receive data from a data source as soon as it is written.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timeout_ | `int` | stop sending data after timeout seconds |

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain an Object of the form
```js
   {
        "timestamp"    : 1510768103558,
        "datasourceid" : dataSourceID,
        "key"          : key name,
        "data"         : { value:[numeric value] ,[tag name]:[tag value] }
    }
```

### storeClient.TS.StopObserving (dataSourceID)

Closes the connection to stop observing data on the provided _dataSourceID_.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** Void


## StoreClient.TSBlob

These functions allow you to manage unstructured json data in the time series store.

> :warning: If data is written into a TimeSeriesBlobStore filtering and aggregation functions are not supported.

The StoreClient.TSBlob supports the following functions:

### StoreClient.TSBlob.Write (dataSourceID, payload)

Writes data to the store for the given dataSourceID data is timestamped with milliseconds since the unix epoch on insert.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _payload_ | `Object` | A JSON serializable Object to write to the store |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### StoreClient.TSBlob.WriteAt (dataSourceID, timestamp, payload)

Writes data to the store for the given dataSourceID at the given timestamp. Timestamp should be in milliseconds since the unix epoch.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timestamp_ | `Int` | milliseconds since the unix epoch |
| _payload_ | `Object` | A JSON serializable Object to write to the store |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### StoreClient.TSBlob.Latest (dataSourceID)

Reads the latest data written to the provided dataSourceID.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** a `Promise` that resolves with an Object of the form
```js
   {
      timestamp: 1510768103558,
      data: { data written by driver }
   }
```
 on success or rejects with error message on error.

### StoreClient.TSBlob.LastN (dataSourceID,n)

Reads the last N items written to the provided dataSourceID.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _N_ | `Int` | number of results to return |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
```js
   {
      timestamp: 1510768103558,
      data: { data written by driver }
   }
```
 on success or rejects with error message on error.

### StoreClient.TSBlob.Since (dataSourceID, sinceTimeStamp)

Read all entries since a time (inclusive)

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _sinceTimeStamp_ | `Int` | timestamp im ms form which to return data after |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```

### StoreClient.TSBlob.Range (dataSourceID, fromTimeStamp, toTimeStamp)

Read all entries in a time range (inclusive)

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _fromTimeStamp_ | `Int` | timestamp in ms form which to return data after |
| _toTimeStamp_ | `Int` | timestamp in ms before which data will be returned |

**Returns** a `Promise` that resolves with an ***array of Objects*** of the form
```js
   {
      timestamp: 1510768103558,
      data: { value:[numeric value] ,[tag name]:[tag value] }
   }
```

### StoreClient.TSBlob.Observe (dataSourceID,timeout)

This function allows you to receive data from a data source as soon as it is written.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timeout_ | `int` | stop sending data after timeout seconds |

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain an Object of the form
```js
   {
        "timestamp"  : 1510768103558,
        "datasourceid" : dataSourceID,
        "key"          : key name,
        "data"         : { data written by driver },
    }
```

### StoreClient.TSBlob.StopObserving (dataSourceID)

Closes the connection to stop observing data on the provided _dataSourceID_.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** Void


## StoreClient.KV

The Key Value Store allows the storage of TEXT, JSON and binary data agents keys. The default content format is JSON.

The StoreClient.KV encapsulates the following functions:


### StoreClient.KV.Write (dataSourceID, KeyName, payload, contentFormat)

Writes data to the store for the given dataSourceID data. Writes to the same key overwrite the data.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _KeyName_ | `String` | the key you wish to write to |
| _payload_ | `Object` | A JSON serializable Object to write to the store |
| _contentFormat_ | `String` | JSON TEXT or BINARY |

**Returns** a `Promise` that resolves with "created" on success or rejects with error message on error.

### StoreClient.KV.ListKeys (dataSourceID)

Lists the stored keys for this dataSourceID

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to read from |

**Returns** as `Promise` that resolves with the data on success or rejects with error message on error. The type of the returned data is an `Array` of `Strings`.

### StoreClient.KV.Read (dataSourceID, KeyName, contentFormat)

Reads data from the store for the given dataSourceID. data is timestamped with milliseconds since the unix epoch on insert.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to read from |
| _KeyName_ | `String` | the key you wish read from |
| _contentFormat_ | `String` | JSON TEXT or BINARY |

**Returns** a `Promise` that resolves with the data on success or rejects with error message on error. The type of the returned data depends on the _contentFormat_ read.


### StoreClient.KV.Observe (dataSourceID,timeout,contentFormat)

This function allows you to receive data from all keys under a data source as soon as it is written. This will observe all keys under a single data source

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timeout_ | `int` | stop sending data after timeout seconds |
| _contentFormat_ | `String` | JSON TEXT or BINARY |

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain data stored at the provided dataSourceID. The type of the return data depends on _contentFormat_.
```js
   {
        "timestamp"  : 1510768103558,
        "datasourceid" : dataSourceID,
        "key"          : key name,
        "data"         : { data written by driver },
    }
```

### StoreClient.KV.ObserveKey (dataSourceID,KeyName,timeout,contentFormat)

This function allows you to receive data from a data source as soon as it is written. This will observe a single key under a single data source

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |
| _timeout_ | `int` | stop sending data after timeout seconds |
| _contentFormat_ | `String` | JSON TEXT or BINARY |

**Returns** A `Promise` that resolves with an `EventEmitter` that emits `data` when data is written to the observed _dataSourceID_, the `Promise` rejects with an error. The `data` event will contain data stored at the provided dataSourceID. The type of the return data depends on _contentFormat_.
```js
   {
        "timestamp"  : 1510768103558,
        "datasourceid" : dataSourceID,
        "key"          : key name,
        "data"         : { data written by driver },
    }
```

### StoreClient.KV.StopObserving (dataSourceID)

Closes the connection to stop observing data on the provided _dataSourceID_.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _dataSourceID_ | `String` | dataSourceID to write to |

**Returns** Void

## Development of databox was supported by the following funding

```
EP/N028260/1, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N028260/2, Databox: Privacy-Aware Infrastructure for Managing Personal Data

EP/N014243/1, Future Everyday Interaction with the Autonomous Internet of Things

EP/M001636/1, Privacy-by-Design: Building Accountability into the Internet of Things (IoTDatabox)

EP/M02315X/1, From Human Data to Personal Experience

```
