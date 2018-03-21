const databox = require('../databox.js');
const assert = require('assert');

let serverEndPoint = "tcp://127.0.0.1:5555";

describe('TS Client', function() {

    let tsc = databox.NewTimeSeriesClient(serverEndPoint,false);
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
        return tsc.Write(dataSourceID,{"value":3, "mytag":"third"})
            .then((res)=>{
                console.log('Write:: ',Date.now());
                timeOfThirdWrite = Date.now();
                assert.equal(res,"created");
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

    describe('#Latest', function() {
        it('should read latest value and return it', function() {
            console.log('Latest:: ',Date.now())
            return tsc.Latest(dataSourceID)
              .then((res)=>{
                  assert.deepEqual(res[0].data,{"value":3, "mytag":"third"});
              });
        });
      })

      describe('#Last 3', function() {
        it('should read last N values and return an array', function() {
          return tsc.LastN(dataSourceID,3)
              .then((res)=>{
                assert.deepEqual(res[0].data,{"value":3, "mytag":"third"});
                assert.deepEqual(res[1].data,{"value":2, "mytag":"second"});
                assert.deepEqual(res[2].data,{"value":1, "mytag":"first"});
            });
        });
      });

      describe('#Last 3 with max', function() {
        it('should read last N values and return the max', function() {
          return tsc.LastN(dataSourceID,3,"max")
              .then((res)=>{
                assert.deepEqual(res.result,3);
            });
        });
      });

      describe('#Last 3 with min', function() {
        it('should read last N values and return the min', function() {
          return tsc.LastN(dataSourceID,3,"min")
              .then((res)=>{
                assert.deepEqual(res.result,1);
            });
        });
      });

      describe('#Last 2 with count', function() {
        it('should read last N values and return the count', function() {
          return tsc.LastN(dataSourceID,2,"count")
              .then((res)=>{
                assert.deepEqual(res.result,2);
            });
        });
      });

      describe('#Last 2 with sd', function() {
        it('should read last N values and return the standard devation', function() {
          return tsc.LastN(dataSourceID,2,"sd")
              .then((res)=>{
                assert.deepEqual(res.result,0.7071067811865476);
            });
        });
      });

      describe('#Last 2 with count', function() {
        it('should read last N values and return the max', function() {
          return tsc.LastN(dataSourceID,2,"count")
              .then((res)=>{
                assert.deepEqual(res.result,2);
            });
        });
      });

      describe('#Last 1', function() {
        it('should read last N values and return an array', function() {
          return tsc.LastN(dataSourceID,1)
              .then((res)=>{
                assert.deepEqual(res[0].data,{"value":3, "mytag":"third"});
            });
        });
      });

      describe('#Last3 with filter', function() {
        it('should read last N values and return an array filtered on mytag:first', function() {
          return tsc.LastN(dataSourceID,3,"","mytag","equals","first")
              .then((res)=>{
                assert.deepEqual(res[0].data,{"value":1, "mytag":"first"});
            });
        });
      });

      describe('#Last3 with filter on unknown tag', function() {
        it('should read last N values and return an array filtered on blar:blar', function() {
          return tsc.LastN(dataSourceID,3,"","blar","equals","blar")
              .then((res)=>{
                assert.equal(res.length,0);
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

      describe('#FirstN with mean', function() {
        it('should read first N values and return the mean', function() {
          return tsc.FirstN(dataSourceID,2,"mean")
              .then((res)=>{
                assert.deepEqual(res.result,1.5);
            });
        });
      });

      describe('#FirstN with filter', function() {
        it('should read first N values and return an array filtered on mytag:first', function() {
          return tsc.FirstN(dataSourceID,2, "", "mytag", "equals", "first")
              .then((res)=>{
                assert.deepEqual(res[0].data,{"value":1, "mytag":"first"});
            });
        });
      });

      describe('#FirstN with filter and sum', function() {
        it('should read first N values and return an array filtered on mytag:first', function() {
          return tsc.FirstN(dataSourceID,2, "sum", "mytag", "equals", "first")
              .then((res)=>{
                assert.deepEqual(res.result,1);
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
                  assert.deepEqual(res[0].data,{"value":3, "mytag":"third"});
                  assert.deepEqual(res[1].data,{"value":2, "mytag":"second"});
                  assert.deepEqual(res[2].data,{"value":1, "mytag":"first"});
                });
        });
      });

      describe('#Range with mean', function() {
        it('should read range of values return the mean', function() {
            return tsc.Range(dataSourceID, startTime-100000,Date.now()+100000,"mean")
              .then((res)=>{
                  assert.deepEqual(res.result,2);
                });
        });
      });

      describe('#Range with filter', function() {
        it('should read range of values return an array filtered by mytag:second', function() {
            return tsc.Range(dataSourceID, startTime-100000,Date.now()+100000, "", "mytag","equals","second")
              .then((res)=>{
                  assert.deepEqual(res.length,1);
                  assert.deepEqual(res[0].data,{"value":2, "mytag":"second"});
                });
        });
      });

      describe('#Range with filter contains', function() {
        it('should read range of values return an array filtered by mytag:ir*', function() {
            return tsc.Range(dataSourceID, startTime-100000,Date.now()+100000, "", "mytag","contains","ir")
              .then((res)=>{
                  assert.deepEqual(res.length,2);
                  assert.deepEqual(res[0].data,{"value":3, "mytag":"third"});
                  assert.deepEqual(res[1].data,{"value":1, "mytag":"first"});
                });
        });
      });

      describe('#Range with filter contains and sum', function() {
        it('should read range of values return an array filtered by mytag:ir*', function() {
            return tsc.Range(dataSourceID, startTime-100000,Date.now()+100000, "sum", "mytag","contains","ir")
              .then((res)=>{
                  assert.deepEqual(res.result,4);
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
            return databox.DataSourceMetadataToHypercat(serverEndPoint+'/ts/',dsm)
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

            return tsc.Observe(dataSourceID,0,"JSON")
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
                    assert.deepEqual(receivedData[0].data,'{"value":1}');
                    assert.deepEqual(receivedData[1].data,'{"value":2}');
                    assert.deepEqual(receivedData[2].data,'{"value":3}');
                    tsc.StopObserving(dataSourceID);
                });
        });
      });

  });