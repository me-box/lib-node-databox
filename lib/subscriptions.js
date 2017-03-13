const utils = require('./utils.js');

const url = require('url');
const EventEmitter = require('events');

const WebSocket = require('ws');

const CM_HTTPS_CA_ROOT_CERT = process.env.CM_HTTPS_CA_ROOT_CERT;

exports.connect = function (href) {
	return new Promise((resolve, reject) => {
		var storeURL = url.parse(href);
		utils.requestToken(storeURL.hostname, '/ws', 'GET')
		.then((token) => {
			var ws = new WebSocket('wss://' + storeURL.host + '/ws', null, {
					headers: { 'x-api-key': token },
					agent: utils.httpsAgent,
					ca: [ CM_HTTPS_CA_ROOT_CERT ],
					//rejectUnauthorized: !!CM_HTTPS_CA_ROOT_CERT
				});
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
