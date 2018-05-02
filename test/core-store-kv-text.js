const databox = require('../databox.js');
const assert = require('assert');

let serverEndPoint = "tcp://127.0.0.1:5555";

describe('KV Client TEXT', function() {

    let kvc = databox.NewKeyValueClient(serverEndPoint,false);
    let dataSourceID = 'test' + Date.now(); //each test gets a fresh dataSourceID

    after(function () {
        kvc.zestClient.ZMQsoc.close();
    });

    describe('#Write', function() {
      it('should write and resole created', function() {
        return kvc.Write(dataSourceID,"textKey","data12345",'TEXT')
            .then((res)=>{
                assert.equal(res,"created");
            });
      });
    });

    describe('#Read', function() {
        it('should read latest value and return it', function() {
            return kvc.Read(dataSourceID,"textKey",'TEXT')
              .then((res)=>{
                  assert.equal(res,"data12345");
              });
        });
      });

    describe('#Observe', function() {
        it('should return an event emitter that receives data when new values are written', function() {

            return kvc.ObserveKey(dataSourceID, "textKey", 0, 'TEXT')
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
                .then(()=>{ return kvc.Write(dataSourceID,"textKey",'data12345','TEXT'); })
                .then(()=>{ return kvc.Write(dataSourceID,"textKey",'data123456','TEXT'); })
                .then(()=>{ return kvc.Write(dataSourceID,"textKey",'data1234567','TEXT'); })
                .then(()=>{
                    //wait a second for the observe request to be processed
                    //or we dont get all the data.
                    return new Promise((resolve,reject)=>{
                      setTimeout(resolve,1500);
                    });
                })
                .then(()=>{
                    assert.equal(receivedData[0].data,'data12345');
                    assert.equal(receivedData[1].data,'data123456');
                    assert.equal(receivedData[2].data,'data1234567');
                    kvc.StopObserving(dataSourceID,"textKey");
                });
        });
      });
  });