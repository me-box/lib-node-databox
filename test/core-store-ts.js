const databox = require('../databox.js');
const assert = require('assert');

let serverEndPoint = "tcp://127.0.0.1:5555";

describe('TS Client', function() {

    let tsc = databox.NewTimeSeriesClient(serverEndPoint,false);
    let startTime = Date.now();
    let someTimeInTheFuture = Date.now() + 10000;
    let dataSourceID = 'test' + Date.now(); //each test gets a fresh dataSourceID

    after(function () {
        tsc.zestClient.ZMQsoc.close();
    });

    describe('#Write', function() {
      it('should write and resole created', function() {
        console.log('Write:: ',Date.now())
        return tsc.Write(dataSourceID,{"test":"data"})
            .then((res)=>{
                assert.equal(res,"created");
            });
      });
    });

    describe('#Latest', function() {
        it('should read latest value and return it', function() {
            console.log('Latest:: ',Date.now())
            return tsc.Latest(dataSourceID)
              .then((res)=>{
                  assert.deepEqual(res.data,{"test":"data"});
              });
        });
      })

    describe('#Write1', function() {
        it('should write and resole created', function() {
            console.log('Write1:: ',Date.now())
            return tsc.Write(dataSourceID,{"test":"data1"})
              .then((res)=>{
                  assert.equal(res,"created");
              });
        });
      });

      describe('#Write2', function() {
        it('should write and resole created', function() {
            console.log('Write2:: ',Date.now())
            return tsc.Write(dataSourceID,{"test":"data2"})
              .then((res)=>{
                  assert.equal(res,"created");
              });
        });
      });

      describe('#Write3', function() {
        it('should write and resole created', function() {
          return tsc.Write(dataSourceID,{"test":"data3"})
              .then((res)=>{
                console.log('Write3:: ',Date.now())
                  assert.equal(res,"created");
              });
        });
      });

    describe('#Latest', function() {
        it('should read latest value and return it', function() {
            console.log('Latest:: ',Date.now())
            return tsc.Latest(dataSourceID)
              .then((res)=>{
                  assert.deepEqual(res.data,{"test":"data3"});
              });
        });
      });

      describe('#Range', function() {
        it('should read range of values return an array', function() {
            return tsc.Range(dataSourceID, startTime-100000,Date.now()+100000)
              .then((res)=>{
                  assert.deepEqual(res.length,4);
                  assert.deepEqual(res[0].data,{"test":"data3"});
                  assert.deepEqual(res[1].data,{"test":"data2"});
                  assert.deepEqual(res[2].data,{"test":"data1"});
                  assert.deepEqual(res[3].data,{"test":"data"});
                });
        });
      });

      describe('#LastN', function() {
        it('should read last N values and return an array', function() {
          return tsc.LastN(dataSourceID,2)
              .then((res)=>{
                assert.deepEqual(res[0].data,{"test":"data3"});
                assert.deepEqual(res[1].data,{"test":"data2"});
            });
        });
      });

      describe('#FirstN', function() {
        it('should read first N values and return an array', function() {
          return tsc.FirstN(dataSourceID,2)
              .then((res)=>{
                assert.deepEqual(res[0].data,{"test":"data"});
                assert.deepEqual(res[1].data,{"test":"data1"});
            });
        });
      });

      describe('#Earliest', function() {
        it('should read the first inserted value and return data', function() {
          return tsc.Earliest(dataSourceID)
              .then((res)=>{
                assert.deepEqual(res.data,{"test":"data"});
            });
        });
      });

      describe('#Since', function() {
        it('should read values Since ts and return an array', function() {
          return tsc.Since(dataSourceID,startTime)
              .then((res)=>{
                assert.deepEqual(res[0].data,{"test":"data3"});
            });
        });
      });

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
                .then(()=>{ return tsc.Write(dataSourceID,{"test":"obs1"});})
                .then(()=>{ return tsc.Write(dataSourceID,{"test":"obs2"});})
                .then(()=>{ return tsc.Write(dataSourceID,{"test":"obs3"});})
                .then(()=>{
                    assert.deepEqual(receivedData[0],'{"test":"obs1"}');
                    assert.deepEqual(receivedData[1],'{"test":"obs2"}');
                    assert.deepEqual(receivedData[2],'{"test":"obs3"}');
                    tsc.StopObserving(dataSourceID);
                });
        });
      });

  });