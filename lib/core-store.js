
const zestClient = require('nodezestclient');
const fs = require('fs');
const utils = require('./utils.js');
const url = require('url');


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

    kvc.zestEndpoint = reqEndpoint;
	kvc.zestDealerEndpoint = reqEndpoint.replace(":5555", ":5556");
    kvc.zestClient = zestClient.New(kvc.zestEndpoint, kvc.zestDealerEndpoint, utils.CORE_STORE_KEY, enableLogging);

    return kvc;
};

// NewTimeSeriesClient returns a new TimeSeriesClient to enable reading and writing of binary data key value to the store
// reqEndpoint is provided in the DATABOX_ZMQ_ENDPOINT environment variable to databox apps and drivers.
exports.NewTimeSeriesClient = function (reqEndpoint, enableLogging) {
    let tsc = {
        Write: function (dataSourceID, payload) {
            return new Promise((resolve, reject) => {
                if(payload !== null && typeof payload === 'object') {
                    //convert to JSON if we have an object
                    payload = JSON.stringify(payload);
                }
                let path = "/ts/" + dataSourceID;
                let zestEndpoint = url.parse(this.zestEndpoint);
                utils.requestToken(zestEndpoint.hostname,path,"POST")
                .then((token)=>{
                    this.zestClient.Post(token,path,payload,"JSON")
                    .then((resp)=>{
                        resolve(resp)
                    })
                    .catch((err)=>{
                        reject("POST ERROR::"+err);
                    });

                })
                .catch((err)=>{
                    reject("GET TOKEN ERROR::"+err);
                });
            });
        },
        WriteAt: function (dataSourceID, timestamp, payload) {
            return new Promise((resolve, reject) => {
                if(payload !== null && typeof payload === 'object') {
                    //convert to JSON if we have an object
                    payload = JSON.stringify(payload);
                }
                let path = "/ts/" + dataSourceID + '/at/';
                let zestEndpoint = url.parse(this.zestEndpoint);
                utils.requestToken(zestEndpoint.hostname,path+'*',"POST")
                .then((token)=>{
                    path = path + timestamp;
                    this.zestClient.Post(token,path,payload,"JSON")
                    .then((resp)=>{
                        resolve(resp)
                    })
                    .catch((err)=>{
                        reject("POST ERROR::"+err);
                    });

                })
                .catch((err)=>{
                    reject("GET TOKEN ERROR::"+err);
                });
            });
        },
        Latest: function (dataSourceID) {
            return new Promise((resolve, reject) => {
                let path = "/ts/" + dataSourceID + "/latest";
                let zestEndpoint = url.parse(this.zestEndpoint);
                utils.requestToken(zestEndpoint.hostname,path,"GET")
                .then((token)=>{
                    this.zestClient.Get(token,path,"JSON")
                    .then((resp)=>{
                        resolve(JSON.parse(resp));
                    })
                    .catch((err)=>{
                        reject("POST ERROR::"+err);
                    });

                })
                .catch((err)=>{
                    reject("GET TOKEN ERROR::"+err);
                });
            });
        },
        LastN: function (dataSourceID, n) {
            return new Promise((resolve, reject) => {
                let path = "/ts/" + dataSourceID + "/last/" + n;
                let zestEndpoint = url.parse(this.zestEndpoint);
                utils.requestToken(zestEndpoint.hostname,path,"GET")
                .then((token)=>{
                    this.zestClient.Get(token,path,"JSON")
                    .then((resp)=>{
                        resolve(JSON.parse(resp));
                    })
                    .catch((err)=>{
                        reject("POST ERROR::"+err);
                    });

                })
                .catch((err)=>{
                    reject("GET TOKEN ERROR::"+err);
                });
            });
        },
        Since: function (dataSourceID, sinceTimeStamp) {
            return new Promise((resolve, reject) => {
                let path = "/ts/" + dataSourceID + "/since/" + sinceTimeStamp;
                let zestEndpoint = url.parse(this.zestEndpoint);
                utils.requestToken(zestEndpoint.hostname,path,"GET")
                .then((token)=>{
                    this.zestClient.Get(token,path,"JSON")
                    .then((resp)=>{
                        resolve(JSON.parse(resp));
                    })
                    .catch((err)=>{
                        reject("POST ERROR::"+err);
                    });

                })
                .catch((err)=>{
                    reject("GET TOKEN ERROR::"+err);
                });
            });
        },
        Range: function (dataSourceID, formTimeStamp, toTimeStamp) {

        },
        Observe: function (dataSourceID, timeOut) {
            return new Promise((resolve, reject) => {
                let path = "/ts/" + dataSourceID;
                let zestEndpoint = url.parse(this.zestEndpoint);
                utils.requestToken(zestEndpoint.hostname,path,"GET")
                .then((token)=>{
                    this.zestClient.Observe(token,path,"JSON", timeOut)
                    .then((emitter)=>{
                        resolve(emitter);
                    })
                    .catch((err)=>{
                        reject("OBSERVE ERROR::"+err);
                    });

                })
                .catch((err)=>{
                    reject("GET TOKEN ERROR::"+err);
                });

            });
        },
        StopObserving: function (dataSourceID) {
            let path = "/ts/" + dataSourceID;
            this.zestClient.StopObserving(path);
        },
        RegisterDatasource: function (DataSourceMetadata) {
            return new Promise((resolve, reject) => {
                if(DataSourceMetadata !== null && typeof DataSourceMetadata === 'object') {
                    //convert to JSON if we have an object
                    DataSourceMetadataToHypercat(DataSourceMetadata)
                    .then((hyperCatObj)=>{
                        hyperCatString = JSON.stringify(hyperCatObj);
                        let path = "/cat";
                        let zestEndpoint = url.parse(this.zestEndpoint);
                        utils.requestToken(zestEndpoint.hostname,path,"POST")
                        .then((token)=>{
                            this.zestClient.Post(token,path,hyperCatString,"JSON")
                            .then((resp)=>{
                                resolve(resp)
                            })
                            .catch((err)=>{
                                reject("POST CAT ERROR::"+err);
                            });

                        })
                        .catch((err)=>{
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
        },
        GetDatasourceCatalogue: function () {
            return new Promise((resolve, reject) => {
                let path = "/cat";
                let zestEndpoint = url.parse(this.zestEndpoint);
                utils.requestToken(zestEndpoint.hostname,path,"GET")
                .then((token)=>{
                    this.zestClient.Get(token,path,"JSON")
                    .then((resp)=>{
                        resolve(resp)
                    })
                    .catch((err)=>{
                        reject("Get CAT ERROR::"+err);
                    });

                })
                .catch((err)=>{
                    reject("GET TOKEN ERROR::"+err);
                });
            });
        }
    };

    tsc.zestEndpoint = reqEndpoint;
    tsc.zestDealerEndpoint = reqEndpoint.replace(":5555", ":5556");
    tsc.zestClient = zestClient.New(tsc.zestEndpoint, tsc.zestDealerEndpoint, utils.CORE_STORE_KEY, enableLogging);

    return tsc;
};

exports.NewDataSourceMetadata = function() {
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

let DataSourceMetadataToHypercat = function (metadata) {
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
            href: metadata.DataSourceID
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