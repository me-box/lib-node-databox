const utils = require('./utils.js');

const url = require('url');
const EventEmitter = require('events');

const WebSocket = require('ws');
const https = require('https');

// Configure HTTPS agent (as in stores)
const CM_HTTPS_CA_ROOT_CERT = process.env.CM_HTTPS_CA_ROOT_CERT;
var agentOptions = {};
if (!CM_HTTPS_CA_ROOT_CERT) {
	console.warn('Warning: No HTTPS root certficate provided so Databox HTTPS certificates will not be checked');
	agentOptions.rejectUnauthorized = false;
} else {
	agentOptions.ca = CM_HTTPS_CA_ROOT_CERT;
}
var httpsAgent = new https.Agent(agentOptions);

exports.connect = function (href) {
	return new Promise((resolve, reject) => {
		var storeURL = url.parse(href);
		console.log("[connect] requesting token for", storeURL.hostname, '/ws', 'GET');
		utils.requestToken(storeURL.hostname, '/ws', 'GET')
		.then((token) => {
			console.log("[WS connecting] to ", 'wss://' + storeURL.host + '/ws');
			var ws = new WebSocket('wss://' + storeURL.host + '/ws', null, { 'x-api-key': token, 'agent': httpsAgent});
			var notifications = new EventEmitter();
			ws.on('open', () => notifications.emit('open'));
			ws.on('message', (data) => {
				// TODO: Handle exception
				data = JSON.parse(data);
				notifications.emit('data', storeURL.hostname, data.datasource_id, data.data);
			});
			ws.on('error',(error)=>{
				notifications.emit('error',error);
			});
			resolve(notifications);
		}).catch((err) => reject(err));
	});
};

exports.subscribe = function(href, dataSourceID, type) {
	return utils.makeStoreRequest({
		method: 'GET',
		url: href + '/sub/' + dataSourceID + '/' + type
	});
};

exports.unsubscribe = function(href, dataSourceID, type) {
	return utils.makeStoreRequest({
		method: 'GET',
		url: href + '/unsub/' + dataSourceID + '/' + type
	});
};
