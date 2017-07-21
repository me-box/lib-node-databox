var databox = require('node-databox');
var https = require('https');
var express = require("express");

var store = 'https://databox-driver-sensordemo-node-databox-store-blob:8080'

const credentials = databox.getHttpsCredentials()

var app = express();

function parse(json) {
    var message = json["message"];
    var htmlHead = "<head><meta http-equiv=\"refresh\" content=\"5\"></head>";
    var htmlContent = "<h1>" + JSON.stringify(message) + "</h1>";
    var htmlPage = htmlHead + htmlContent;
    return htmlPage;
}

app.get("/ui", function(request, response) {
    console.log("get /ui");

    databox.waitForStoreStatus(store,'active',100)
	.then(() => {
	    return databox.keyValue.read(store, 'test');
	}).then((res) => {
	    console.log(res);
	    var html = parse(res);
	    response.send(html);
	}).catch((err) => {
	    console.error(err);
	    response.send(err);
	}); 
    
});

console.log("starting web server..");
https.createServer(credentials, app).listen(8080);



