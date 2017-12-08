const databox = require('../databox.js');
const assert = require('assert');

let serverEndPoint = "tcp://127.0.0.1:5555";

describe('TS Client', function() {

    let tsc = databox.NewTimeSeriesClient(serverEndPoint,true);
    let someTimeInTheFuture = Date.now() + 10000;
    let dataSourceID = 'test' + Date.now(); //each test gets a fresh dataSourceID


    let numRecordsToWrite = 4;

    after(function () {
        tsc.zestClient.ZMQsoc.close();
    });

    describe('#Write', function() {
      it('should write and resolve [created]', function() {
        let proms = [];
        for(let i = 0; i<numRecordsToWrite; i++) {
            proms.push(tsc.Write(dataSourceID,{"test":"data"+i}).then((resp)=>{console.log("Tosh:" + resp)}).catch((err)=>{console.log("ERROR writing: " + err);}));
        }
        return Promise.all(proms)
                .then((res)=>{
                    console.log('Done Writing at :: ',Date.now())
                    assert.equal(res.length,numRecordsToWrite);
                });
      });
    });

    describe('#Latest', function() {
        this.timeout(5000);
        it('should read latest value and return it', function() {
            console.log('Latest:: ',Date.now())
            return tsc.Latest(dataSourceID)
              .then((res)=>{
                  assert.deepEqual(res.data,{"test":"data"+numRecordsToWrite});
              });
        });
      })

  });