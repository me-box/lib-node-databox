const request = require('request');
const https = require('https');
const url = require('url');
const WebSocket = require('ws');
const EventEmitter = require('events');

var arbiterURL   = process.env.DATABOX_ARBITER_ENDPOINT;
var hostname     = process.env.DATABOX_LOCAL_NAME;
var arbiterToken = process.env.ARBITER_TOKEN;

// Modify component URLs if not dunning in Docker
if (!require('containerized')()) {
	console.warn("Warning: Running outside Docker; Databox hostnames will be replaced with 'localhost'");
	if (arbiterURL)
		arbiterURL = arbiterURL.replace(url.parse(arbiterURL).hostname, 'localhost');
}

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

var getRootCatalog = function() {
	return new Promise((resolve, reject) => {
		request({
			method: 'GET',
			json: true,
			url: arbiterURL + '/cat',
			headers: { 'X-Api-Key': arbiterToken },
			agent: httpsAgent
		}, (err, res, body) => {
			if (err || res.statusCode !== 200) {
				reject(err || body);
				return;
			}
			resolve(body);
		});
	});
};

var requestToken = function(hostname, endpoint, method) {
	return new Promise((resolve, reject) => {
		request({
			method: 'POST',
			url: arbiterURL + '/token',
			json: {
				target: hostname,
				path:   endpoint,
				method: method
			},
			headers: { 'X-Api-Key': arbiterToken },
			agent: httpsAgent
		}, (err, res, body) => {
			if (err || res.statusCode !== 200) {
				reject(err || body);
				return;
			}
			resolve(body);
		});
	});
};

var makeStoreRequest = function() {
	var tokenCache = {};

	return (options) => {
		var route = {
			target: url.parse(options.url).hostname,
			path:   url.parse(options.url).pathname,
			method: options.method
		};
		var routeHash = JSON.stringify(route);

		return new Promise((resolve, reject) => {
			Promise.resolve().then(() => {
				if (!(routeHash in tokenCache))
					return requestToken(route.target, route.path, route.method);
				return tokenCache[routeHash];
			}).then((token) => {
				options.headers = options.headers || {};
				options.headers['X-Api-Key'] = tokenCache[routeHash] = token;

				return new Promise((resolve, reject) => {
					request(options, (err, res, body) => {
						if (err || res.statusCode !== 200) {
							reject(err || body);
							return;
						}
						resolve(body);
					});
				});
			}).then((body) => {
				resolve(body)
			}).catch((err) => {
				// TODO: If request was rejected because a token is expired, remove it from tokenCache so it can be renewed
				reject(err)
			});
		});
	};
}();

/////////////////////////////////////////////////////
// Util functions
/////////////////////////////////////////////////////

exports.listAvailableStores = function () {
	return new Promise((resolve, reject) => {
		getRootCatalog().then((cat) => {
			cat.items = cat.items.map((item) => {
				return {
					description: item['item-metadata'].filter((pair)=> pair.rel.startsWith('urn:X-hypercat:rels:hasDescription:'))[0].val,
					hostname: url.parse(item.href).hostname,
					href: item.href
				};
			});
			resolve(cat.items);
		}).catch((err) => reject(err));
	});
};

var getStoreCatalog = exports.getStoreCatalog = function(href) {
	return makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/cat',
		agent: httpsAgent
	});
};

var walkStoreCatalogs = exports.walkStoreCatalogs = function() {
	return new Promise((resolve, reject) => {
		getRootCatalog().then((cat) => {
			cat.items = cat.items
				.filter((item) => {
					// TODO: Remove once https://github.com/me-box/databox-container-manager/issues/34 is closed
					if (url.parse(item.href).hostname === 'databox-logstore')
						return false;
					var contentType = item['item-metadata'].filter((pair)=> pair.rel === 'urn:X-hypercat:rels:isContentType')[0];
					return contentType.val === 'application/vnd.hypercat.catalogue+json';
				})
				.map((item) => getStoreCatalog(item.href));

			return Promise.all(cat.items);
		}).then((cats) => resolve(cats)).catch((err) => reject(err));
	});
};

exports.mapStoreCatalogs = function(callback, thisArg) {
	return new Promise((resolve, reject) => {
		walkStoreCatalogs().then((stores) => {
			resolve(stores.map(callback, thisArg));
		}).catch((err) => reject(err));
	});
};

exports.timeseries = {

	latest: function(href, dataSourceID) {
		return makeStoreRequest({
			method: 'GET',
			json: true,
			url: href + '/' + dataSourceID + '/ts/latest',
			agent: httpsAgent
		});
	},

	since: function(href, dataSourceID, startTimestamp) {
		return makeStoreRequest({
			method: 'GET',
			url: href + '/' + dataSourceID + '/ts/since',
			json: { startTimestamp },
			agent: httpsAgent
		});
	},

	range: function(href, dataSourceID, startTimestamp, endTimestamp) {
		return makeStoreRequest({
			method: 'GET',
			url: href + '/' + dataSourceID + '/ts/range',
			json: { startTimestamp, endTimestamp },
			agent: httpsAgent
		});
	},

	write: function(href, dataSourceID, data) {
		return makeStoreRequest({
			method: 'POST',
			json: { data: data },
			url: href + '/' + dataSourceID + '/ts',
			agent: httpsAgent
		});
	}

};

exports.keyValue = {

	read: function(href, dataSourceID) {
		return makeStoreRequest({
			method: 'GET',
			json: true,
			url: href + '/' + dataSourceID + '/key',
			agent: httpsAgent
		});
	},

	write: function(href, dataSourceID, data) {
		return makeStoreRequest({
			method: 'POST',
			json: data,
			url: href + '/' + dataSourceID + '/key',
			agent: httpsAgent
		});
	}

};


exports.notifications = {

	connect: function (href) {
		return new Promise((resolve, reject) => {
			var storeURL = url.parse(href);
			requestToken(storeURL.hostname, '/ws', 'GET').then((token) => {
				var ws = new WebSocket('ws://' + storeURL.host + '/ws', null, { 'X-Api-Key': token });
				var notifications = new EventEmitter();
				ws.on('open', () => notifications.emit('open'));
				ws.on('message', (data) => {
					// TODO: Handle exception
					data = JSON.parse(data);
					notifications.emit('data', storeURL.hostname, data.datasource_id, data.data);
				});
				resolve(notifications);
			}).catch((err) => reject(err));
		});
	},

	subscribe: function(href, dataSourceID, type) {
		return makeStoreRequest({
			method: 'GET',
			url: href + '/sub/' + dataSourceID + '/' + type,
			agent: httpsAgent
		});
	},

	unsubscribe: function(href, dataSourceID, type) {
		return makeStoreRequest({
			method: 'GET',
			url: href + '/unsub/' + dataSourceID + '/' + type,
			agent: httpsAgent
		});
	},

};

//config.Env.push("HTTPS_CLIENT_PRIVATE_KEY=" +  httpsPem.clientprivate);
//config.Env.push("HTTPS_CLIENT_CERT=" +  httpsPem.clientcert);
//config.Env.push(dependency.name.toUpperCase().replace(/[^A-Z0-9]/g, '_') + "_ENDPOINT=" + 'https://' + dependency.name + ':8080');
//config.Env.push("DATASOURCE_" + datasource.clientid + "=" + JSON.stringify(sensor));
//config.Env.push("PACKAGE_" + manifestPackage.id + "=" + packageEnabled);
