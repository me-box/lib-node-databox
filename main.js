const zestClient = require('./lib/zest.js')
const arbiterClient = require('./lib/arbiter-client.js')
const config = require('./lib/config.js')
const url = require('url')
const EventEmitter = require('events')
const fs = require('fs')
const rp = require('request-promise-native')

// StoreClient returns a new client to read and write data to stores
// storeEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment variable
// and arbiterEndpoint is provided by the DATABOX_ARBITER_ENDPOINT environment variable
// to databox apps and drivers.
exports.NewStoreClient = function (storeEndpoint, arbiterEndpoint, enableLogging) {

    let zestEndpoint = storeEndpoint
    let zestDealerEndpoint = storeEndpoint.replace(':5555', ':5556')

    let zestCli = zestClient(zestEndpoint, zestDealerEndpoint, config.CORE_STORE_KEY, enableLogging)
    let arbiterCli = arbiterClient(arbiterEndpoint, enableLogging)

    let client = {

        config: config,
        zestEndpoint: zestEndpoint,
        zestDealerEndpoint: zestDealerEndpoint,
        zestCli: zestCli,
        arbiterCli: arbiterCli,

        RegisterDatasource: async function (DataSourceMetadata) {
            return _registerDatasource(arbiterCli, zestCli, DataSourceMetadata)
        },

        GetDatasourceCatalogue: async function () {
            return _read(arbiterCli, zestCli, '/cat', '/cat', 'JSON')
        },

        //KeyValueClient used to read and write of data key value to the store
        KV: {
            Read: async function (dataSourceID, key, contentFormat = 'JSON') {
                let path = `/kv/${dataSourceID}/${key}`
                return _read(arbiterCli, zestCli, path, path, contentFormat)
            },
            Write: async function (dataSourceID, key, payload, contentFormat = 'JSON') {
                let path = `/kv/${dataSourceID}/${key}`
                return _write(arbiterCli, zestCli, path, path, payload, contentFormat)
            },
            ListKeys: async function (dataSourceID) {
                let path = `/kv/${dataSourceID}/keys`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Observe: async function (dataSourceID, timeOut = 0, contentFormat = 'JSON') {
                let path = `/kv/${dataSourceID}/*`
                return _observe(arbiterCli, zestCli, path, timeOut, contentFormat)
            },
            ObserveKey: async function (dataSourceID, key, timeOut = 0, contentFormat = 'JSON') {
                let path = `/kv/${dataSourceID}/${key}`
                return _observe(arbiterCli, zestCli, path, timeOut, contentFormat)
            },
            StopObserving: async function (dataSourceID, key) {
                if (typeof key == 'undefined') {
                    key = '*'
                }
                let path = `/kv/${dataSourceID}/${key}`
                await zestCli.StopObserving(path)
            }
        },

        TSBlob: {
            Write: async function (dataSourceID, payload) {
                let path = `/ts/blob/${dataSourceID}`
                return _write(arbiterCli, zestCli, path, path, payload, 'JSON')
            },
            WriteAt: async function (dataSourceID, timestamp, payload) {
                let path = `/ts/blob/${dataSourceID}/at/${timestamp}`
                let tokenPath = `/ts/blob/${dataSourceID}/at/*`
                return _write(arbiterCli, zestCli, path, tokenPath, payload, 'JSON')
            },
            Latest: async function (dataSourceID) {
                let path = `/ts/blob/${dataSourceID}/latest`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Earliest: async function (dataSourceID) {
                let path = `/ts/blob/${dataSourceID}/earliest`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            LastN: async function (dataSourceID, n) {
                let path = `/ts/blob/${dataSourceID}/last/${n}`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            FirstN: async function (dataSourceID, n) {
                let path = `/ts/blob/${dataSourceID}/first/${n}`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Since: async function (dataSourceID, sinceTimeStamp) {
                let path = `/ts/blob/${dataSourceID}/since/${sinceTimeStamp}`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Range: async function (dataSourceID, formTimeStamp, toTimeStamp) {
                let path = `/ts/blob/${dataSourceID}/range/${formTimeStamp}/${toTimeStamp}`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Length: async function (dataSourceID) {
                let path = `/ts/blob/${dataSourceID}/length`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Observe: async function (dataSourceID, timeOut = 0) {
                let path = `/ts/blob/${dataSourceID}`
                return _observe(arbiterCli, zestCli, path, timeOut, 'JSON')
            },
            StopObserving: async function (dataSourceID) {
                let path = `/ts/blob/${dataSourceID}`
                await zestCli.StopObserving(path)
            }
        },

        TS: {
            Write: async function (dataSourceID, payload) {
                let path = '/ts/' + dataSourceID
                return _write(arbiterCli, zestCli, path, path, payload, 'JSON')
            },
            WriteAt: async function (dataSourceID, timestamp, payload) {
                let path = `/ts/${dataSourceID}/at/` + timestamp
                let tokenPath = `/ts/${dataSourceID}/at/*`
                return _write(arbiterCli, zestCli, path, tokenPath, payload, 'JSON')
            },
            Latest: async function (dataSourceID) {
                let path = `/ts/${dataSourceID}/latest`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Earliest: async function (dataSourceID) {
                let path = `/ts/${dataSourceID}/earliest`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            LastN: async function (dataSourceID, n, aggregation = '', filterTagName = '', filterType = '', filterValue = '') {
                let path = `/ts/${dataSourceID}/last/${n}${calculatePath(aggregation, filterTagName, filterType, filterValue)}`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            FirstN: async function (dataSourceID, n, aggregation = '', filterTagName = '', filterType = '', filterValue = '') {
                let path = `/ts/${dataSourceID}/first/${n}${calculatePath(aggregation, filterTagName, filterType, filterValue)}`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Since: async function (dataSourceID, sinceTimeStamp, aggregation = '', filterTagName = '', filterType = '', filterValue = '') {
                let path = `/ts/${dataSourceID}/since/${sinceTimeStamp}${calculatePath(aggregation, filterTagName, filterType, filterValue)}`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Range: async function (dataSourceID, formTimeStamp, toTimeStamp, aggregation = '', filterTagName = '', filterType = '', filterValue = '') {
                let path = `/ts/${dataSourceID}/range/${formTimeStamp}/${toTimeStamp}${calculatePath(aggregation, filterTagName, filterType, filterValue)}`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Length: async function (dataSourceID) {
                let path = `/ts/${dataSourceID}/length`
                return _read(arbiterCli, zestCli, path, path, 'JSON')
            },
            Observe: async function (dataSourceID, timeOut = 0) {
                let path = `/ts/${dataSourceID}`
                return _observe(arbiterCli, zestCli, path, timeOut, 'JSON')
            },
            StopObserving: async function (dataSourceID) {
                let path = `/ts/${dataSourceID}`
                await zestCli.StopObserving(path)
            }
        }
    }

    return client
}

let NewDataSourceMetadata = function () {
    return {
        Description: ' ',
        ContentType: ' ',
        Vendor: ' ',
        DataSourceType: ' ',
        DataSourceID: ' ',
        StoreType: ' ',
        IsActuator: false,
        Unit: ' ',
        Location: ' ',
    }
}
exports.NewDataSourceMetadata = NewDataSourceMetadata

let DataSourceMetadataToHypercat = function (endpoint, metadata) {
    ValidateDataSourceMetadata(metadata)

    var cat = {
        'item-metadata': [{
            'rel': 'urn:X-hypercat:rels:hasDescription:en',
            'val': metadata.Description
        }, {
            'rel': 'urn:X-hypercat:rels:isContentType',
            'val': metadata.ContentType
        }, {
            'rel': 'urn:X-databox:rels:hasVendor',
            'val': metadata.Vendor
        }, {
            'rel': 'urn:X-databox:rels:hasType',
            'val': metadata.DataSourceType
        }, {
            'rel': 'urn:X-databox:rels:hasDatasourceid',
            'val': metadata.DataSourceID
        }, {
            'rel': 'urn:X-databox:rels:hasStoreType',
            'val': metadata.StoreType
        }],
        href: endpoint + metadata.DataSourceID
    }

    if (metadata.IsActuator)
        cat['item-metadata'].push({
            'rel': 'urn:X-databox:rels:isActuator',
            'val': metadata.IsActuator
        })

    if (metadata.Unit)
        cat['item-metadata'].push({
            'rel': 'urn:X-databox:rels:hasUnit',
            'val': metadata.Unit
        })

    if (metadata.Location)
        cat['item-metadata'].push({
            'rel': 'urn:X-databox:rels:hasLocation',
            'val': metadata.Location
        })

    return cat
}
exports.DataSourceMetadataToHypercat = DataSourceMetadataToHypercat

let HypercatToDataSourceMetadata = function (hyperCat) {

    let dm = NewDataSourceMetadata()

    if (typeof (hyperCat) === 'string') {
        hyperCat = JSON.parse(hyperCat)
    }

    hyperCat['item-metadata'].forEach(element => {
        if (element['rel'] == 'urn:X-hypercat:rels:hasDescription:en')
            dm.Description = element['val']

        if (element['rel'] == 'urn:X-hypercat:rels:isContentType')
            dm.ContentType = element['val']

        if (element['rel'] == 'urn:X-databox:rels:hasVendor')
            dm.Vendor = element['val']

        if (element['rel'] == 'urn:X-databox:rels:hasType')
            dm.DataSourceType = element['val']

        if (element['rel'] == 'urn:X-databox:rels:hasDatasourceid')
            dm.DataSourceID = element['val']

        if (element['rel'] == 'urn:X-databox:rels:hasStoreType')
            dm.StoreType = element['val']

        if (element['rel'] == 'urn:X-databox:rels:isActuator')
            dm.IsActuator = element['val']

        if (element['rel'] == 'urn:X-databox:rels:hasLocation')
            dm.Location = element['val']

        if (element['rel'] == 'urn:X-databox:rels:hasUnit')
            dm.Unit = element['val']

    })

    return dm
}
exports.HypercatToDataSourceMetadata = HypercatToDataSourceMetadata

exports.GetStoreURLFromHypercat = function (hyperCat) {
	if (typeof(hyperCat) === 'string') {
		hyperCat = JSON.parse(hyperCat);
	}
	let u = url.parse(hyperCat.href)
	return u.protocol + '//' + u.host
}

exports.GetHttpsCredentials = function () {

    let credentials = {};

    try {
        //HTTPS certs created by the container mangers for this components HTTPS server.
        credentials = {
            key: fs.readFileSync('/run/secrets/DATABOX.pem'),
            cert: fs.readFileSync('/run/secrets/DATABOX.pem')
        };
    } catch (e) {
        console.warn('Warning: No HTTPS certificate not provided HTTPS certificates missing. Error', e);
        credentials = {};
    }

    return credentials
}

let _write = async function (arbiterClient, zestClient, path, tokenPath, payload, contentFormat) {

    validateContentFormat(contentFormat)

    if (payload !== null && typeof payload === 'object' && contentFormat == 'JSON') {
        //convert to JSON string if we have an object
        try {
            payload = JSON.stringify(payload)
        } catch (error) {
            throw `Write Error: invalid json payload, ${error}`
        }
    }

    try {
        let endPoint = url.parse(zestClient.zestEndpoint)
        let token = await arbiterClient.requestToken(endPoint.hostname, tokenPath, 'POST')
        let response = await zestClient.Post(token, path, payload, contentFormat)
        //TODO this is here to maintain backwards compatibility after moving to zest should be removed in future
        if (response == '') {
            response = 'created'
        }
        return response

    } catch (error) {
        throw (`Write Error: for path ${path}, ${error}`)
    }

}

let _read = async function (arbiterClient, zestClient, path, tokenPath, contentFormat) {
    validateContentFormat(contentFormat)

    try {
        let endPoint = url.parse(zestClient.zestEndpoint)
        let token = await arbiterClient.requestToken(endPoint.hostname, tokenPath, 'GET')
        let response = await zestClient.Get(token, path, contentFormat)

        if (response !== null && contentFormat == 'JSON') {
            //convert to JSON if we have an object
            response = JSON.parse(response)
        }

        return response

    } catch (error) {
        throw (`Read Error: for path ${path}, ${error}`)
    }

}

let validateContentFormat = function (format) {
    switch (format.toUpperCase()) {
        case 'TEXT':
            return true
        case 'BINARY':
            return true
        case 'JSON':
            return true
    }
    throw ('Error: Unsupported content format')
}

let _observe = async function (arbiterClient, zestClient, path, timeOut = 60, contentFormat = 'JSON') {

    contentFormat = contentFormat.toLocaleUpperCase()

    validateContentFormat(contentFormat)

    try {
        let endPoint = url.parse(zestClient.zestEndpoint)
        let token = await arbiterClient.requestToken(endPoint.hostname, path, 'GET')

        let observeEmitter = await zestClient.Observe(token, path, contentFormat, timeOut)

        let _emitter = new EventEmitter()

        observeEmitter.on('data', (data) => {
            let obj = processObserveString(data)

            if (obj === null) {
                _emitter.emit('error', 'Malformed data received:: ' + data)
            } else {
                if (contentFormat === 'JSON') {
                    obj.data = JSON.parse(obj.data)
                }
                _emitter.emit('data', obj)
            }
        })
        observeEmitter.on('error', (err) => {
            _emitter.emit('error', err)
        })

        return _emitter

    } catch (error) {
        throw (`Observe Error: for path ${path}, ${error}`)
    }
}

processObserveString = function (observeString) {

    try {
        let parts = observeString.split(' ')
        let _ts = parseInt(parts[0])
        let parts2 = parts[1].split(' ')

        let _dataSourceID = parts2[2]

        let _key = ''
        if (parts2.Length > 3) {
            _key = string(parts2[3])
        }

        parts.splice(0, 3)
        let _data = parts.join(' ')

        let JsonObserveResponse = {}

        if (_key !== '') {
            JsonObserveResponse = {
                'datasourceid': _dataSourceID,
                'key': _key,
                'data': _data,
            }
        } else {
            JsonObserveResponse = {
                'timestamp': _ts,
                'datasourceid': _dataSourceID,
                'data': _data,
            }
        }

        return JsonObserveResponse

    } catch (e) {
        return null
    }

}

let _registerDatasource = async function (arbiterClient, zestClient, DataSourceMetadata) {
    ValidateDataSourceMetadata(DataSourceMetadata)
    try {
        let hyperCatObj = await DataSourceMetadataToHypercat(zestClient.zestEndpoint + '/' + DataSourceMetadata.StoreType + '/', DataSourceMetadata)
        let hyperCatString = JSON.stringify(hyperCatObj)
        _write(arbiterClient, zestClient, '/cat', '/cat', hyperCatString, 'JSON')
    } catch (error) {
        throw (`RegisterDatasource Error:: ${error}`)
    }
}

let checkStoreType = function (storeType) {
    switch (storeType) {
        case 'kv':
            return true
        case 'ts':
            return true
        case 'ts/blob':
            return true
    }
    throw ('Error:: DataSourceMetadata invalid StoreType can be kv,ts or ts/blob')
}

let ValidateDataSourceMetadata = function (DataSourceMetadata) {
    if (!DataSourceMetadata
        || typeof (DataSourceMetadata) !== 'object'
        || !DataSourceMetadata.Description
        || !DataSourceMetadata.ContentType
        || !DataSourceMetadata.Vendor
        || !DataSourceMetadata.DataSourceType
        || !DataSourceMetadata.DataSourceID
        || !DataSourceMetadata.StoreType
    ) {
        throw ('Error:: Not a valid DataSourceMetadata object missing required property')
    }

    checkStoreType(DataSourceMetadata.StoreType)

    return true
}


let calculatePath = function (aggregation, tagName, filterType, value) {
    let aggregationPath = ''
    if (aggregation !== '') {
        aggregationPath = '/' + aggregation
    }

    if (tagName === '' || filterType === '' || value === '') {
        return aggregationPath
    }

    return '/filter/' + tagName + '/' + filterType + '/' + value + aggregationPath
}

// ExportClient returns a new export-service client.
// arbiterEndpoint is provided by the DATABOX_ARBITER_ENDPOINT environment
// variable to databox apps and drivers.
exports.NewExportClient = function (arbiterEndpoint, enableLogging) {
	let arbiterCli = arbiterClient(arbiterEndpoint, enableLogging)

	let client = {
		config: config,
		arbiterCli: arbiterCli,
		enableLogging: enableLogging, 

		Longpoll: async function (destination, payload, id) {
			let path = '/lp/export'
			return _export( arbiterCli, path, destination, payload, id, enableLogging )
		}
	}

	return client
}

const exportServiceURL = "https://export-service:8080"

let _export = async function ( arbiterClient, path, destination, payload, id, enableLogging ) {
	if(payload !== null && typeof payload === 'object') {
		try {
			payload = JSON.stringify(payload);
		} catch (error) {
			throw `Export Error: invalid payload, ${error}`
		}
	}
	try {
		let endPoint = url.parse( exportServiceURL )
		let token = await arbiterClient.requestToken(endPoint.hostname, path, 'POST',
        		// caveat (export-service specific)
			{ "destination": destination }
		)
		if (enableLogging) {
			console.log(`Export token for host ${endPoint.hostname} path ${path} POST destination ${destination}: ${token}`)
		}
		if (typeof (id) !== 'string') {
			id = ''
		}
		if (enableLogging) {
			console.log(`Export id ${id}`)
		}
		let options = {
			method: 'POST',
			json: {
				id: id,
				uri: destination,
				data: payload
			},
			url: exportServiceURL + path,
			agent: config.httpsAgent,
			headers: {
				'X-Api-Key': token,
				'Content-Type' : "application/json"
			}
		}
		let body = await rp( options ) 
		return body
	} catch (error ) {
		throw  (`Export Error: for path ${path} destination ${destination}, ${error}`)
	}
}

