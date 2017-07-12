
var PubNub = require('pubnub');

var databox = require('node-databox');

var store = process.env.DATABOX_STORE_ENDPOINT;

function subscribe() {
   
    pubnub = new PubNub({
        subscribeKey : 'sub-c-5f1b7c8e-fbee-11e3-aa40-02ee2ddab7fe'
    })
              
    pubnub.addListener({
        message: function(message) {
	    //console.log(message);
	    databox.keyValue.write(store, 'test', message);
        }
    })      
    console.log("Subscribing..");
    pubnub.subscribe({
        channels: ['pubnub-sensor-network'] 
    });
};


databox.waitForStoreStatus(store,'active',100).then(()=>{

    databox.catalog.registerDatasource(store, {
	description: 'A demo sensor network Databox driver in Node.js',
	contentType: 'text/csv',
	vendor: 'Databox Inc.',
	type: 'test',
	datasourceid: 'test',
	storeType: 'databox-store-blob'
    });
    
}).then(subscribe);
