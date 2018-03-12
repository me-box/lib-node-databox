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
                .then(()=>{ return tsc.Write(dataSourceID,{"value":1});})
                .then(()=>{ return tsc.Write(dataSourceID,{"value":2});})
                .then(()=>{ return tsc.Write(dataSourceID,{"value":3});})
                .then(()=>{
                    assert.deepEqual(receivedData[0],'{"value":1}');
                    assert.deepEqual(receivedData[1],'{"value":2}');
                    assert.deepEqual(receivedData[2],'{"value":3}');
                    tsc.StopObserving(dataSourceID);
                });
        });
      });

  });