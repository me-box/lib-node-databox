
/*jshint esversion: 6 */
const zestClient = require('nodezestclient');
const fs = require('fs');
const utils = require('./utils.js');
const url = require('url');
const EventEmitter = require('events');

// NewKeyValueClient returns a new KeyValueClient to enable reading and writing of binary data key value to the store
// reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment variable to databox apps and drivers.
exports.NewKeyValueClient = function (reqEndpoint, enableLogging) {

    let kvc = {
        Write: function (dataSourceID, key, payload, contentFormat = "JSON") {
            let path = "/kv/" + dataSourceID + "/" + key;
            return _write(this.zestClient,this.zestEndpoint, path, path, payload, contentFormat);
        },
        Read: function (dataSourceID, key, contentFormat = "JSON") {
            let path = "/kv/" + dataSourceID + "/" + key;
            return _read(this.zestClient,this.zestEndpoint, path, path, contentFormat);
        },
	    ListKeys: function (dataSourceID) {
            let path = "/kv/" + dataSourceID + "/keys";
            return _read(this.zestClient,this.zestEndpoint, path, path, "JSON");
        },
        Observe: function (dataSourceID, timeOut = 0, contentFormat = "JSON") {
            let path = "/kv/" + dataSourceID + "/*";
            return _observe(this.zestClient,this.zestEndpoint, path, timeOut, contentFormat);
        },
        ObserveKey: function (dataSourceID, key, timeOut = 0, contentFormat = "JSON") {
            let path = "/kv/" + dataSourceID + "/" + key;
            return _observe(this.zestClient,this.zestEndpoint, path, timeOut, contentFormat);
        },
        StopObserving: function (dataSourceID,key) {
            let path = "/kv/" + dataSourceID + "/" + key;
            this.zestClient.StopObserving(path);
        },
        RegisterDatasource: function (DataSourceMetadata) {
            return _registerDatasource(this.zestClient,this.zestEndpoint,'kv',DataSourceMetadata);
        },
        GetDatasourceCatalogue: function () {
            return _getDatasourceCatalogue(this.zestClient,this.zestEndpoint);
        }
    };

    kvc.zestEndpoint = reqEndpoint;
	kvc.zestDealerEndpoint = reqEndpoint.replace(":5555", ":5556");
    kvc.zestClient = zestClient.New(kvc.zestEndpoint, kvc.zestDealerEndpoint, utils.CORE_STORE_KEY, enableLogging);

    return kvc;
};

// NewTimeSeriesBlobClient returns a new TimeSeriesBlobClient to enable reading and writing of json data to the store
// reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment variable to databox apps and drivers.
exports.NewTimeSeriesBlobClient = function (reqEndpoint, enableLogging) {
    let tsc = {
        Write: function (dataSourceID, payload) {
            let path = "/ts/blob/" + dataSourceID;
            return _write(this.zestClient,this.zestEndpoint, path, path, payload, 'JSON');
        },
        WriteAt: function (dataSourceID, timestamp, payload) {
            let path = "/ts/blob/" + dataSourceID + '/at/' + timestamp;
            let tokenPath = "/ts/blob/" + dataSourceID + '/at/' + '*';
            return _write(this.zestClient,this.zestEndpoint, path, tokenPath, payload, 'JSON');
        },
        Latest: function (dataSourceID) {
            let path = "/ts/blob/" + dataSourceID + "/latest";
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Earliest: function (dataSourceID) {
            let path = "/ts/blob/" + dataSourceID + "/earliest";
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        LastN: function (dataSourceID, n) {
            let path = "/ts/blob/" + dataSourceID + "/last/" + n;
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        FirstN: function (dataSourceID, n) {
            let path = "/ts/blob/" + dataSourceID + "/first/" + n;
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Since: function (dataSourceID, sinceTimeStamp) {
            let path = "/ts/blob/" + dataSourceID + "/since/" + sinceTimeStamp;
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Range: function (dataSourceID, formTimeStamp, toTimeStamp) {
            let path = "/ts/blob/" + dataSourceID + "/range/" + formTimeStamp + "/" + toTimeStamp;
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Length: function (dataSourceID) {
            let path = "/ts/blob/" + dataSourceID + "/length"
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Observe: function (dataSourceID, timeOut = 0) {
            let path = "/ts/blob/" + dataSourceID;
            return _observe(this.zestClient,this.zestEndpoint, path, timeOut, 'JSON');
        },
        StopObserving: function (dataSourceID) {
            let path = "/ts/blob/" + dataSourceID;
            this.zestClient.StopObserving(path);
        },
        RegisterDatasource: function (DataSourceMetadata) {
            return _registerDatasource(this.zestClient,this.zestEndpoint,'ts/blob',DataSourceMetadata);
        },
        GetDatasourceCatalogue: function () {
            return _getDatasourceCatalogue(this.zestClient,this.zestEndpoint);
        }
    };

    tsc.zestEndpoint = reqEndpoint;
    tsc.zestDealerEndpoint = reqEndpoint.replace(":5555", ":5556");
    tsc.zestClient = zestClient.New(tsc.zestEndpoint, tsc.zestDealerEndpoint, utils.CORE_STORE_KEY, enableLogging);

    return tsc;
};

exports.NewTimeSeriesClient = function (reqEndpoint, enableLogging) {
    let tsc = {
        Write: function (dataSourceID, payload) {
            let path = "/ts/" + dataSourceID;
            return _write(this.zestClient,this.zestEndpoint, path, path, payload, 'JSON');
        },
        WriteAt: function (dataSourceID, timestamp, payload) {
            let path = "/ts/" + dataSourceID + '/at/' + timestamp;
            let tokenPath = "/ts/" + dataSourceID + '/at/' + '*';
            return _write(this.zestClient,this.zestEndpoint, path, tokenPath, payload, 'JSON');
        },
        Latest: function (dataSourceID) {
            let path = "/ts/" + dataSourceID + "/latest";
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Earliest: function (dataSourceID) {
            let path = "/ts/" + dataSourceID + "/earliest";
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        LastN: function (dataSourceID, n, aggregation = "", filterTagName = "", filterType = "", filterValue = "") {
            let path = "/ts/" + dataSourceID + "/last/" + n + calculatePath(aggregation,filterTagName,filterType,filterValue);
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        FirstN: function (dataSourceID, n, aggregation = "", filterTagName = "", filterType = "", filterValue = "") {
            let path = "/ts/" + dataSourceID + "/first/" + n + calculatePath(aggregation,filterTagName,filterType,filterValue);
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Since: function (dataSourceID, sinceTimeStamp, aggregation = "", filterTagName = "", filterType = "", filterValue = "") {
            let path = "/ts/" + dataSourceID + "/since/" + sinceTimeStamp + calculatePath(aggregation,filterTagName,filterType,filterValue);
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Range: function (dataSourceID, formTimeStamp, toTimeStamp, aggregation = "", filterTagName = "", filterType = "", filterValue = "") {
            let path = "/ts/" + dataSourceID + "/range/" + formTimeStamp + "/" + toTimeStamp + calculatePath(aggregation,filterTagName,filterType,filterValue);
            console.log("PATH::", path);
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Length: function (dataSourceID) {
            let path = "/ts/" + dataSourceID + "/length"
            return _read(this.zestClient,this.zestEndpoint, path, path, 'JSON');
        },
        Observe: function (dataSourceID, timeOut = 0) {
            let path = "/ts/" + dataSourceID
            return _observe(this.zestClient,this.zestEndpoint, path, timeOut, 'JSON');
        },
        StopObserving: function (dataSourceID) {
            let path = "/ts/" + dataSourceID;
            this.zestClient.StopObserving(path);
        },
        RegisterDatasource: function (DataSourceMetadata) {
            return _registerDatasource(this.zestClient,this.zestEndpoint,'ts',DataSourceMetadata);
        },
        GetDatasourceCatalogue: function () {
            return _getDatasourceCatalogue(this.zestClient,this.zestEndpoint);
        }
    };

    tsc.zestEndpoint = reqEndpoint;
    tsc.zestDealerEndpoint = reqEndpoint.replace(":5555", ":5556");
    tsc.zestClient = zestClient.New(tsc.zestEndpoint, tsc.zestDealerEndpoint, utils.CORE_STORE_KEY, enableLogging);

    return tsc;
};

let NewDataSourceMetadata = function() {
    return {
        Description:    "",
        ContentType:    "",
        Vendor:         "",
        DataSourceType: "",
        DataSourceID:   "",
        StoreType:      "",
        IsActuator:     false,
        Unit:           "",
        Location:       "",
    };
};
exports.NewDataSourceMetadata = NewDataSourceMetadata;

let DataSourceMetadataToHypercat = function (endpoint,metadata) {
    return new Promise((resolve, reject) => {
        if (!metadata
                || !metadata.Description
                || !metadata.ContentType
                || !metadata.Vendor
                || !metadata.DataSourceType
                || !metadata.DataSourceID
                || !metadata.StoreType
            ) {
            reject('Missing required metadata');
        }
        var cat = {
            "item-metadata": [{
                    "rel": "urn:X-hypercat:rels:hasDescription:en",
                    "val": metadata.Description
                }, {
                    "rel": "urn:X-hypercat:rels:isContentType",
                    "val": metadata.ContentType
                }, {
                    "rel": "urn:X-databox:rels:hasVendor",
                    "val": metadata.Vendor
                }, {
                    "rel": "urn:X-databox:rels:hasType",
                    "val": metadata.DataSourceType
                }, {
                    "rel": "urn:X-databox:rels:hasDatasourceid",
                    "val": metadata.DataSourceID
                }, {
                    "rel": "urn:X-databox:rels:hasStoreType",
                    "val": metadata.StoreType
                }],
            href: endpoint + metadata.DataSourceID
        };

        if (metadata.IsActuator)
            cat['item-metadata'].push({
                "rel": "urn:X-databox:rels:isActuator",
                "val": metadata.IsActuator
            });

        if (metadata.Unit)
            cat['item-metadata'].push({
                "rel": "urn:X-databox:rels:hasUnit",
                "val": metadata.Unit
            });

        if (metadata.Location)
            cat['item-metadata'].push({
                "rel": "urn:X-databox:rels:hasLocation",
                "val": metadata.Location
            });

            resolve(cat);
        });
}
exports.DataSourceMetadataToHypercat = DataSourceMetadataToHypercat;

let HypercatToSourceDataMetadata = function (hyperCatString) {

    return new Promise((resolve,reject)=>{

        let dm = NewDataSourceMetadata();
        let hypercatObj = null;
        try {
            hypercatObj = JSON.parse(hyperCatString);
        } catch (e) {
            reject(e);
            return;
        }

        hypercatObj["item-metadata"].forEach(element => {
            if (element["rel"] == "urn:X-hypercat:rels:hasDescription:en" ) {
                dm.Description = element["val"];
            }
            if (element["rel"] == "urn:X-hypercat:rels:isContentType" ) {
                dm.ContentType = element["val"];
            }
            if (element["rel"] == "urn:X-databox:rels:hasVendor" ) {
                dm.Vendor = element["val"];
            }
            if (element["rel"] == "urn:X-databox:rels:hasType" ) {
                dm.DataSourceType = element["val"];
            }
            if (element["rel"] == "urn:X-databox:rels:hasDatasourceid" ) {
                dm.DataSourceID = element["val"]
            }
            if (element["rel"] == "urn:X-databox:rels:hasStoreType" ) {
                dm.StoreType = element["val"];
            }
            if (element["rel"] == "urn:X-databox:rels:isActuator" ) {
                dm.IsActuator = element["val"];
            }
            if (element["rel"] == "urn:X-databox:rels:hasLocation" ) {
                dm.Location = element["val"];
            }
            if (element["rel"] == "urn:X-databox:rels:hasUnit" ) {
                dm.Unit = element["val"];
            }
        });

        let u = null;
        try {
            u = url.parse(hypercatObj.href)
        } catch (e) {
            reject(e);
            return;
        }

        let StoreURL = u.protocol + '//' + u.host

        resolve({"DataSourceMetadata":dm,"DataSourceURL":StoreURL})

    });

}
exports.HypercatToSourceDataMetadata = HypercatToSourceDataMetadata;

let calculatePath = function (aggregation, tagName, filterType, value) {
    let aggregationPath = "";
    if(aggregation !== "") {
        aggregationPath = "/" + aggregation;
    }

    if( tagName === "" || filterType === "" || value === "" ) {
        return aggregationPath;
    }

    return "/filter/" + tagName + "/" + filterType + "/" + value + aggregationPath;
}

let checkContentFormat = function (format) {
    switch (format.toUpperCase()) {
        case "TEXT":
            return true;
            break;
        case "BINARY":
            return true;
            break;
        case "JSON":
            return true;
            break;
        }

        return false;
};

let _write = function (zestClient,zestEndpoint, path, tokenPath, payload, contentFormat) {
    return new Promise((resolve, reject) => {
        if(checkContentFormat(contentFormat) === false) {
            reject("Write Error: Unsupported content format");
        }
        if(payload !== null && typeof payload === 'object' && contentFormat == 'JSON') {
            //convert to JSON if we have an object
            payload = JSON.stringify(payload);
        }
        let endPoint = url.parse(zestEndpoint);
        utils.requestToken(endPoint.hostname,tokenPath,"POST")
        .then((token)=>{
            zestClient.Post(token,path,payload,contentFormat)
            .then((resp)=>{
                resolve(resp);
            })
            .catch((err)=>{
                utils.invalidateToken(endPoint.hostname,path,"GET");
                reject("POST Error: for path" + path + " " + err);
            });

        })
        .catch((err)=>{
            utils.invalidateToken(endPoint.hostname,path,"GET");
            reject("TOKEN Error: for path" + tokenPath + " " + err);
        });
    });
};

let _read = function (zestClient,zestEndpoint, path, tokenPath, contentFormat) {
    return new Promise((resolve, reject) => {
        if(checkContentFormat(contentFormat) === false) {
            reject("Read Error: Unsupported content format");
        }
        let endPoint = url.parse(zestEndpoint);
        utils.requestToken(endPoint.hostname,tokenPath,"GET")
        .then((token)=>{
            zestClient.Get(token,path,contentFormat)
            .then((resp)=>{
                if(resp !== null && contentFormat == 'JSON') {
                    //convert to JSON if we have an object
                    resp = JSON.parse(resp);
                }
                resolve(resp);
            })
            .catch((err)=>{
                utils.invalidateToken(endPoint.hostname,path,"GET");
                reject("GET Error: for path" + path + " " + err);
            });

        })
        .catch((err)=>{
            utils.invalidateToken(endPoint.hostname,path,"GET");
            reject("TOKEN Error: for path" + tokenPath + " " + err);
        });
    });
};

let _registerDatasource = function (zestClient, zestEndpoint, storeType, DataSourceMetadata) {
    return new Promise((resolve, reject) => {
        if(DataSourceMetadata !== null && typeof DataSourceMetadata === 'object') {
            //convert to JSON if we have an object
            DataSourceMetadataToHypercat(zestEndpoint+"/"+storeType+"/",DataSourceMetadata)
            .then((hyperCatObj)=>{
                hyperCatString = JSON.stringify(hyperCatObj);
                let path = "/cat";
                let endPoint = url.parse(zestEndpoint);
                utils.requestToken(endPoint.hostname,path,"POST")
                .then((token)=>{
                    zestClient.Post(token,path,hyperCatString,"JSON")
                    .then((resp)=>{
                        resolve(resp)
                    })
                    .catch((err)=>{
                        utils.invalidateToken(endPoint.hostname,path,"GET");
                        reject("POST CAT ERROR::"+err);
                    });

                })
                .catch((err)=>{
                    utils.invalidateToken(endPoint.hostname,path,"GET");
                    reject("GET TOKEN ERROR::"+err);
                });
            })
            .catch((err)=>{
                reject("Hypercat Error::"+err);
            });
        } else {
            reject("Not a valid DataSourceMetadata object")
        }
    });
};

let _getDatasourceCatalogue = function (zestClient, zestEndpoint) {
    return new Promise((resolve, reject) => {
        let path = "/cat";
        let endPoint = url.parse(zestEndpoint);
        utils.requestToken(endPoint.hostname,path,"GET")
        .then((token)=>{
            zestClient.Get(token,path,"JSON")
            .then((resp)=>{
                resolve(resp)
            })
            .catch((err)=>{
                utils.invalidateToken(endPoint.hostname,path,"GET");
                reject("Get CAT ERROR::"+err);
            });

        })
        .catch((err)=>{
            utils.invalidateToken(endPoint.hostname,path,"GET");
            reject("GET TOKEN ERROR::"+err);
        });
    });
}

let _observe = function (zestClient, zestEndpoint, path, timeOut = 60, contentFormat = "JSON") {
    return new Promise((resolve, reject) => {
        if(checkContentFormat(contentFormat) === false) {
            reject("Observe Error: Unsupported content format");
        }
        let endPoint = url.parse(zestEndpoint);
        utils.requestToken(endPoint.hostname,path,"GET")
        .then((token)=>{
            zestClient.Observe(token,path,contentFormat, timeOut)
            .then((emitter)=>{

                let _emitter = new EventEmitter()

                emitter.on("data",(data)=>{
                    let obj = processObserveString(data)

                    if (obj === null) {
                        _emitter.emit("error","Malformed data received:: " + data)
                    } else {
                        _emitter.emit("data",obj)
                    }
                })
                emitter.on("error",(err)=>{
                    _emitter.emit("error",err)
                })

                resolve(_emitter);

            })
            .catch((err)=>{
                utils.invalidateToken(endPoint.hostname,path,"GET");
                reject("OBSERVE ERROR: for path " + path + " " +err);
            });

        })
        .catch((err)=>{
            utils.invalidateToken(endPoint.hostname,path,"GET");
            reject("OBSERVE TOKEN ERROR: for path " + path + " " + err);
        });

    });
}

processObserveString = function (observeString) {

    try {
        let parts = observeString.split(" ");
        let _ts = parseInt(parts[0]);
        let parts2 = parts[1].split(" ");

        let _dataSourceID = parts2[2];

        let _key = "";
        if (parts2.Length > 3) {
            _key = string(parts2[3]);
        }

        parts.splice(0,3)
        let _data = parts.join(' ');

        let JsonObserveResponse = {
            "timestamp":  _ts,
            "datasourceid": _dataSourceID,
            "key":          _key,
            "data":         _data,
        };

        return JsonObserveResponse;

    } catch (e) {
        return null;
    }

}