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
        return kvc.Write(dataSourceID,"key1",{"test":"data"},'JSON')
            .then(()=>{
                return kvc.Write(dataSourceID,"key2",{"test":"data"},'JSON')
            })
            .then((res)=>{
                assert.equal(res,"created");
            });
      });
    });

    describe('#Read', function() {
        it('should read latest value and return it', function() {
            return kvc.Read(dataSourceID,"key1",'JSON')
              .then((res)=>{
                  assert.deepEqual(res,{"test":"data"});
              });
        });
      });

      describe('#ListKeys', function() {
        it('should read a list of keys return it as a array', function() {
            return kvc.ListKeys(dataSourceID)
              .then((res)=>{
                console.log(res);
                  assert.deepEqual(res,["key2", "key1"]);
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

    describe('#ObserveKey', function() {
        it('should return an event emitter that receives data when new values are written', function() {

            return kvc.ObserveKey(dataSourceID,"key2",999,'JSON')
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
                .then(()=>{ return kvc.Write(dataSourceID,"key2",{"test":"obs1"},'JSON');})
                .then(()=>{ return kvc.Write(dataSourceID,"key2",{"test":"obs2"},'JSON');})
                .then(()=>{ return kvc.Write(dataSourceID,"key2",{"test":"obs3"},'JSON');})
                .then(()=>{
                    assert.deepEqual(receivedData[0].data,'{"test":"obs1"}');
                    assert.deepEqual(receivedData[1].data,'{"test":"obs2"}');
                    assert.deepEqual(receivedData[2].data,'{"test":"obs3"}');
                    kvc.StopObserving(dataSourceID, "key2");
                });
        });
      });

      describe('#Observe', function() {
        it('should return an event emitter that receives data when new values are written', function() {

            return kvc.Observe(dataSourceID, 0, "JSON")
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
                .then(()=>{ return kvc.Write(dataSourceID,"ObserveKey1",{"test":"obs1"},'JSON');})
                .then(()=>{ return kvc.Write(dataSourceID,"ObserveKey2",{"test":"obs2"},'JSON');})
                .then(()=>{ return kvc.Write(dataSourceID,"ObserveKey3",{"test":"obs3"},'JSON');})
                .then(()=>{
                    assert.deepEqual(receivedData[0].data,'{"test":"obs1"}');
                    assert.deepEqual(receivedData[1].data,'{"test":"obs2"}');
                    assert.deepEqual(receivedData[2].data,'{"test":"obs3"}');
                    kvc.StopObserving(dataSourceID, "*");
                });
        });
      });
  });