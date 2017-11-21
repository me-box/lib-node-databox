const databox = require('../databox.js');
const assert = require('assert');

let serverEndPoint = "tcp://127.0.0.1:5555";

describe('TS Client', function() {

    let tsc = databox.NewTimeSeriesClient(serverEndPoint,false);
    let someTimeInTheFuture = Date.now() + 10000;
    let dataSourceID = 'test' + Date.now(); //each test gets a fresh dataSourceID

    let numRecordsToWrite = 100;

    after(function () {
        tsc.zestClient.ZMQsoc.close();
    });

    describe('#Write', function() {
      it('should write and resolve [created]', function() {
        let proms = [];

        let write = (j,resolve) => {
                tsc.Write(dataSourceID,{"test":"data"+j})
                .then((resp)=>{
                    assert.equal('created',resp);
                    console.log(resp + " " + j + " " + Date.now());
                    j++;
                    if (j <= numRecordsToWrite) {
                        write(j,resolve);
                    } else {
                        console.log("resolving done writing");
                        resolve();
                    }
                });
        };

        return new Promise((resolve,reject)=>{
            write(0,resolve);
        })
        .then(() => {
            console.log("Done writing at " + Date.now());
        });

      });
    });

    describe('#Latest', function() {
        it('should read latest value and return it', function() {
            return tsc.Latest(dataSourceID)
              .then((res)=>{
                  console.log("Checking latest at " + Date.now());
                  assert.deepEqual(res.data,{"test":"data"+numRecordsToWrite});
              });
        });
      })

  });