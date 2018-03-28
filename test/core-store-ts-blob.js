const databox = require('../databox.js');
const assert = require('assert');

let serverEndPoint = "tcp://127.0.0.1:5555";

describe('TS Client', function() {

    let tsc = databox.NewTimeSeriesBlobClient(serverEndPoint,false);
    let startTime = Date.now();
    let timeOfThirdWrite = null;
    let someTimeInTheFuture = Date.now() + 10000;
    let dataSourceID = 'test' + Date.now(); //each test gets a fresh dataSourceID

    after(function () {
        tsc.zestClient.ZMQsoc.close();
    });

    describe('#Write', function() {
      it('should write and resolve created 1', function() {
        return tsc.Write(dataSourceID,{"value":1, "mytag":"first"})
            .then((res)=>{
                console.log('Write:: ',Date.now());
                assert.equal(res,"created");
            });
      });
    });

    describe('#Write', function() {
        it('should write and resolve created 2', function() {
          return tsc.Write(dataSourceID,{"value":2, "mytag":"second"})
              .then((res)=>{
                console.log('Write:: ',Date.now());
                  assert.equal(res,"created");
              });
        });
      });

    describe('#Write', function() {
    it('should write and resolve created 3', function() {
        return tsc.Write(dataSourceID,{"value":"three", "mytag":"third"})
            .then((res)=>{
                console.log('Write:: ',Date.now());
                timeOfThirdWrite = Date.now();
                assert.equal(res,"created");
            });
    });
    });

    describe('#Latest', function() {
        it('should read latest value and return it', function() {
            console.log('Latest:: ',Date.now())
            return tsc.Latest(dataSourceID)
              .then((res)=>{
                  assert.deepEqual(res[0].data,{"value":"three", "mytag":"third"});
              });
        });
      })

      describe('#LastN', function() {
        it('should read last N values and return an array', function() {
          return tsc.LastN(dataSourceID,3)
              .then((res)=>{
                assert.deepEqual(res[0].data,{"value":"three", "mytag":"third"});
                assert.deepEqual(res[1].data,{"value":2, "mytag":"second"});
                assert.deepEqual(res[2].data,{"value":1, "mytag":"first"});
            });
        });
      });

      describe('#LastN', function() {
        it('should read last N values and return an array', function() {
          return tsc.LastN(dataSourceID,1)
              .then((res)=>{
                assert.deepEqual(res[0].data,{"value":"three", "mytag":"third"});
            });
        });
      });

      describe('#Earliest', function() {
        it('should read the first inserted value and return data', function() {
          return tsc.Earliest(dataSourceID)
              .then((res)=>{
                assert.deepEqual(res[0].data,{"value":1, "mytag":"first"});
            });
        });
      });

      describe('#FirstN', function() {
        it('should read first N values and return an array', function() {
          return tsc.FirstN(dataSourceID,2)
              .then((res)=>{
                assert.deepEqual(res[0].data,{"value":1, "mytag":"first"});
                assert.deepEqual(res[1].data,{"value":2, "mytag":"second"});
            });
        });
      });

      describe('#Length', function() {
        it('should return the number of records stored', function() {
          return tsc.Length(dataSourceID)
              .then((res)=>{
                assert.deepEqual(res,{"length":3});
            });
        });
      });

      //
      // TODO THIS FAILS returns []
      //
      /*describe('#Since', function() {
        it('should read values Since ts and return an array', function() {
          return tsc.Since(dataSourceID,startTime)
              .then((res)=>{
                console.log(res)
                assert.deepEqual(res[0].data,{"value":3, "mytag":"third"});
                assert.deepEqual(res[1].data,{"value":2, "mytag":"second"});
                assert.deepEqual(res[2].data,{"value":1, "mytag":"first"});
            });
        });
      });*/

      describe('#Range', function() {
        it('should read range of values return an array', function() {
            return tsc.Range(dataSourceID, startTime-100000,Date.now()+100000)
              .then((res)=>{
                  assert.deepEqual(res.length,3);
                  assert.deepEqual(res[0].data,{"value":"three", "mytag":"third"});
                  assert.deepEqual(res[1].data,{"value":2, "mytag":"second"});
                  assert.deepEqual(res[2].data,{"value":1, "mytag":"first"});
                });
        });
      });

      //
      // TODO THIS FAILS returns all data
      //
      /*describe('#Range', function() {
        it('should read range of values return an array only containing the third value', function() {
            return tsc.Range(dataSourceID, timeOfThirdWrite,Date.now()+100000)
              .then((res)=>{
                  console.log(res)
                  assert.deepEqual(res.length,1);
                  assert.deepEqual(res[0].data,{"value":3, "mytag":"third"});
                });
        });
      });*/

      let dsm = databox.NewDataSourceMetadata();
      dsm.Description =    "Test DS";
      dsm.ContentType =    "application/json";
      dsm.Vendor =         "Test";
      dsm.DataSourceType = "testTsJson";
      dsm.DataSourceID =   "test";
      dsm.StoreType =      "ts";
      dsm.IsActuator =     false;
      dsm.Unit =           "none";
      dsm.Location =       "unknown";

      describe('#RegisterDatasource', function() {
        it('should Register Datasource in the catalogue', function() {


          return tsc.RegisterDatasource(dsm)
              .then((res)=>{
                console.log(res);
                assert.equal(res,"created");
            });
        });
    });

    describe('#GetDatasourceCataloge', function() {
        it('should Register Datasource in the catalogue', function() {
            let dsmObj = {};
            return databox.DataSourceMetadataToHypercat(serverEndPoint+'/ts/blob/',dsm)
                .then((dsmRes)=>{
                    dsmObj = dsmRes;
                    return tsc.GetDatasourceCatalogue();
                })
                .then((res)=>{
                  let cat = JSON.parse(res);
                  assert.deepEqual(dsmObj,cat['items'][0]);
                });
        });
    });

    describe('#Observe', function() {
        it('should return an event emitter that receives data when new values are written', function() {

            return tsc.Observe(dataSourceID)
              .then((emitter)=>{

                    receivedData = [];
                    emitter.on('data',function(d){
                        receivedData.push(d);
                    });

                    //wait a second for the observe request to be processed
                    //or we dont get all the data.
                    return new Promise((resolve,reject)=>{
                        setTimeout(resolve,1500);
                    });
                })
                .then(()=>{ return tsc.Write(dataSourceID,{"manifest-version":1,"name":"app-os-monitor","databox-type":"app","version":"0.3.0","description":"An app in golang to plot the output of the os monitor driver.","author":"Tosh Brown <Anthony.Brown@nottingham.ac.uk>","license":"MIT","tags":["template","app","nodejs"],"homepage":"https://github.com/me-box/app-os-monitor","repository":{"type":"git","url":"git https://github.com/me-box/app-os-monitor"},"packages":[{"name":"OS monitor Plotter","purpose":"To visualize your databox load and free memory","install":"required","risks":"None.","benefits":"You can see the data!","datastores":["loadavg1","loadavg5","loadavg15","freemem","loadavg1Structured","freememStructured"],"enabled":true}],"allowed-combinations":[],"datasources":[{"type":"loadavg1","required":true,"name":"loadavg1","clientid":"loadavg1","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 1 minute"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg1"}},{"type":"loadavg5","required":true,"name":"loadavg5","clientid":"loadavg5","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average over 5 minutes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg5"}},{"type":"loadavg15","required":true,"name":"loadavg15","clientid":"loadavg15","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average over 15 minutes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg15"}},{"type":"freemem","required":true,"name":"freemem","clientid":"freemem","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox free memory in bytes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"freemem"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"freemem"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"bytes"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/freemem"}},{"type":"loadavg1Structured","required":true,"name":"loadavg1Structured","clientid":"loadavg1Structured","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 1 minute structured"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg1Structured"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg1Structured"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/loadavg1Structured"}},{"type":"freememStructured","required":true,"name":"freememStructured","clientid":"freememStructured","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox free memory in bytes structured"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"freememStructured"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"freememStructured"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"bytes"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/freememStructured"}}],"export-whitelist":[{"url":"https://export.amar.io/","description":"Exports the data to amar.io"}],"resource-requirements":{},"displayName":"os monitor","storeUrl":"http://localhost:8181/app/get/?name=app-os-monitor"});})
                .then(()=>{ return tsc.Write(dataSourceID,{"value":2});})
                .then(()=>{ return tsc.Write(dataSourceID,{"value":3});})
                .then(()=>{
                    assert.deepEqual(receivedData[0].data,'{"manifest-version":1,"name":"app-os-monitor","databox-type":"app","version":"0.3.0","description":"An app in golang to plot the output of the os monitor driver.","author":"Tosh Brown <Anthony.Brown@nottingham.ac.uk>","license":"MIT","tags":["template","app","nodejs"],"homepage":"https://github.com/me-box/app-os-monitor","repository":{"type":"git","url":"git https://github.com/me-box/app-os-monitor"},"packages":[{"name":"OS monitor Plotter","purpose":"To visualize your databox load and free memory","install":"required","risks":"None.","benefits":"You can see the data!","datastores":["loadavg1","loadavg5","loadavg15","freemem","loadavg1Structured","freememStructured"],"enabled":true}],"allowed-combinations":[],"datasources":[{"type":"loadavg1","required":true,"name":"loadavg1","clientid":"loadavg1","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 1 minute"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg1"}},{"type":"loadavg5","required":true,"name":"loadavg5","clientid":"loadavg5","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average over 5 minutes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg5"}},{"type":"loadavg15","required":true,"name":"loadavg15","clientid":"loadavg15","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average over 15 minutes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg15"}},{"type":"freemem","required":true,"name":"freemem","clientid":"freemem","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox free memory in bytes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"freemem"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"freemem"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"bytes"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/freemem"}},{"type":"loadavg1Structured","required":true,"name":"loadavg1Structured","clientid":"loadavg1Structured","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 1 minute structured"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg1Structured"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg1Structured"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/loadavg1Structured"}},{"type":"freememStructured","required":true,"name":"freememStructured","clientid":"freememStructured","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox free memory in bytes structured"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"freememStructured"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"freememStructured"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"bytes"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/freememStructured"}}],"export-whitelist":[{"url":"https://export.amar.io/","description":"Exports the data to amar.io"}],"resource-requirements":{},"displayName":"os monitor","storeUrl":"http://localhost:8181/app/get/?name=app-os-monitor"}');
                    assert.deepEqual(receivedData[1].data,'{"value":2}');
                    assert.deepEqual(receivedData[2].data,'{"value":3}');
                    tsc.StopObserving(dataSourceID);
                });
        });
      });

      describe('#Lots of Json', function() {
        it('should write and resolve created 1', function() {
          return tsc.Write(dataSourceID,{"manifest-version":1,"name":"app-os-monitor","databox-type":"app","version":"0.3.0","description":"An app in golang to plot the output of the os monitor driver.","author":"Tosh Brown <Anthony.Brown@nottingham.ac.uk>","license":"MIT","tags":["template","app","nodejs"],"homepage":"https://github.com/me-box/app-os-monitor","repository":{"type":"git","url":"git https://github.com/me-box/app-os-monitor"},"packages":[{"name":"OS monitor Plotter","purpose":"To visualize your databox load and free memory","install":"required","risks":"None.","benefits":"You can see the data!","datastores":["loadavg1","loadavg5","loadavg15","freemem","loadavg1Structured","freememStructured"],"enabled":true}],"allowed-combinations":[],"datasources":[{"type":"loadavg1","required":true,"name":"loadavg1","clientid":"loadavg1","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 1 minute"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg1"}},{"type":"loadavg5","required":true,"name":"loadavg5","clientid":"loadavg5","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average over 5 minutes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg5"}},{"type":"loadavg15","required":true,"name":"loadavg15","clientid":"loadavg15","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average over 15 minutes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg15"}},{"type":"freemem","required":true,"name":"freemem","clientid":"freemem","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox free memory in bytes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"freemem"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"freemem"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"bytes"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/freemem"}},{"type":"loadavg1Structured","required":true,"name":"loadavg1Structured","clientid":"loadavg1Structured","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 1 minute structured"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg1Structured"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg1Structured"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/loadavg1Structured"}},{"type":"freememStructured","required":true,"name":"freememStructured","clientid":"freememStructured","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox free memory in bytes structured"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"freememStructured"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"freememStructured"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"bytes"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/freememStructured"}}],"export-whitelist":[{"url":"https://export.amar.io/","description":"Exports the data to amar.io"}],"resource-requirements":{},"displayName":"os monitor","storeUrl":"http://localhost:8181/app/get/?name=app-os-monitor"})
              .then((res)=>{
                  assert.equal(res,"created");
              })
              .then(()=>{
                return tsc.Latest(dataSourceID)
              })
              .then((res)=>{
                assert.deepEqual(res[0].data,{"manifest-version":1,"name":"app-os-monitor","databox-type":"app","version":"0.3.0","description":"An app in golang to plot the output of the os monitor driver.","author":"Tosh Brown <Anthony.Brown@nottingham.ac.uk>","license":"MIT","tags":["template","app","nodejs"],"homepage":"https://github.com/me-box/app-os-monitor","repository":{"type":"git","url":"git https://github.com/me-box/app-os-monitor"},"packages":[{"name":"OS monitor Plotter","purpose":"To visualize your databox load and free memory","install":"required","risks":"None.","benefits":"You can see the data!","datastores":["loadavg1","loadavg5","loadavg15","freemem","loadavg1Structured","freememStructured"],"enabled":true}],"allowed-combinations":[],"datasources":[{"type":"loadavg1","required":true,"name":"loadavg1","clientid":"loadavg1","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 1 minute"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg1"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg1"}},{"type":"loadavg5","required":true,"name":"loadavg5","clientid":"loadavg5","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average over 5 minutes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg5"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg5"}},{"type":"loadavg15","required":true,"name":"loadavg15","clientid":"loadavg15","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average over 15 minutes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg15"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/loadavg15"}},{"type":"freemem","required":true,"name":"freemem","clientid":"freemem","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox free memory in bytes"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"freemem"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"freemem"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"bytes"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/blob/freemem"}},{"type":"loadavg1Structured","required":true,"name":"loadavg1Structured","clientid":"loadavg1Structured","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox load average 1 minute structured"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"loadavg1Structured"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"loadavg1Structured"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"%"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/loadavg1Structured"}},{"type":"freememStructured","required":true,"name":"freememStructured","clientid":"freememStructured","granularities":[],"hypercat":{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"Databox free memory in bytes structured"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"freememStructured"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"freememStructured"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts"},{"rel":"urn:X-databox:rels:hasUnit","val":"bytes"}],"href":"tcp://driver-os-monitor-core-store:5555/ts/freememStructured"}}],"export-whitelist":[{"url":"https://export.amar.io/","description":"Exports the data to amar.io"}],"resource-requirements":{},"displayName":"os monitor","storeUrl":"http://localhost:8181/app/get/?name=app-os-monitor"});
              });
        });
      });

  });