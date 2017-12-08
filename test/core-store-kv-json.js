const databox = require('../databox.js');
const assert = require('assert');

let serverEndPoint = "tcp://127.0.0.1:5555";

describe('KV Client JSON', function() {

    let kvc = databox.NewKeyValueClient(serverEndPoint,false);
    let dataSourceID = 'test' + Date.now(); //each test gets a fresh dataSourceID

    after(function () {
        kvc.zestClient.ZMQsoc.close();
    });

    describe('#Write', function() {
      it('should write and resole created', function() {
        return kvc.Write(dataSourceID,{"test":"data"},'JSON')
            .then((res)=>{
                assert.equal(res,"created");
            });
      });
    });

    describe('#Read', function() {
        it('should read latest value and return it', function() {
            return kvc.Read(dataSourceID,'JSON')
              .then((res)=>{
                  assert.deepEqual(res,{"test":"data"});
              });
        });
      });

    let dsm = databox.NewDataSourceMetadata();
    dsm.Description =    "Test DS";
    dsm.ContentType =    "application/json";
    dsm.Vendor =         "Test";
    dsm.DataSourceType = "testTsJson";
    dsm.DataSourceID =   "test";
    dsm.StoreType =      "kv";
    dsm.IsActuator =     false;
    dsm.Unit =           "none";
    dsm.Location =       "unknown";

    describe('#RegisterDatasource', function() {
        it('should Register Datasource in the catalogue', function() {
            return kvc.RegisterDatasource(dsm)
                .then((res)=>{
                assert.equal(res,"created");
            });
        });
    });

    describe('#GetDatasourceCataloge', function() {
        it('should GET Datasource in the catalogue', function() {
            let dsmObj = {};
            return databox.DataSourceMetadataToHypercat(serverEndPoint+'/kv/',dsm)
            .then((dsmRes)=>{
                    dsmObj = dsmRes;
                    return kvc.GetDatasourceCatalogue();
                })
                .then((res)=>{
                  let cat = JSON.parse(res);
                  assert.deepEqual(dsmObj,cat['items'][0]);
                });
        });
    });

    describe('#Observe', function() {
        it('should return an event emitter that receives data when new values are written', function() {

            return kvc.Observe(dataSourceID,999,'JSON')
              .then((emitter)=>{

                    receivedData = [];
                    emitter.on('data',function(d){
                        receivedData.push(d);
                    });

                    //wait a second for the observe request to be processed
                    //or we dont get all the data.
                    return new Promise((resolve,reject)=>{
                        setTimeout(resolve,1000);
                    });
                })
                .then(()=>{ return kvc.Write(dataSourceID,{"test":"obs1"},'JSON');})
                .then(()=>{ return kvc.Write(dataSourceID,{"test":"obs2"},'JSON');})
                .then(()=>{ return kvc.Write(dataSourceID,{"test":"obs3"},'JSON');})
                .then(()=>{
                    assert.deepEqual(receivedData[0],'{"test":"obs1"}');
                    assert.deepEqual(receivedData[1],'{"test":"obs2"}');
                    assert.deepEqual(receivedData[2],'{"test":"obs3"}');
                    kvc.StopObserving(dataSourceID);
                });
        });
      });
  });