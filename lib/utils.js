const https = require('https');
const url = require('url');
const fs = require('fs');
const request = require('request');
const promiseRetry = require('promise-retry');

var arbiterURL   = process.env.DATABOX_ARBITER_ENDPOINT;
var hostname     = process.env.DATABOX_LOCAL_NAME;

let CORE_STORE_KEY = "vl6wu0A@XP?}Or/&BR#LSxn>A+}L)p44/W[wXL3<";
if (fs.existsSync("/run/secrets/ZMQ_PUBLIC_KEY")) {
	CORE_STORE_KEY = fs.readFileSync("/run/secrets/ZMQ_PUBLIC_KEY");
} else {
	console.warn('Warning: No ZMQ_PUBLIC_KEY provided so Databox with use the default key');
}
exports.CORE_STORE_KEY = CORE_STORE_KEY;

let arbiterToken = "";
if (fs.existsSync("/run/secrets/ARBITER_TOKEN")) {
	arbiterToken = fs.readFileSync("/run/secrets/ARBITER_TOKEN",{encoding:'base64'});
} else if (fs.existsSync("/run/secrets/CM_KEY")) {
	//we are running in the container manager
	arbiterToken = fs.readFileSync("/run/secrets/CM_KEY",{encoding:'base64'});
} else {
	// not running in in databox disable arbiter requests
	arbiterURL = false;
	console.warn('Warning: No ARBITER_TOKEN provided so Databox will not request tokens from the arbiter');
}

// Configure HTTPS agent (as in stores)
let CM_HTTPS_CA_ROOT_CERT = false;
if (fs.existsSync("/run/secrets/DATABOX_ROOT_CA")) {
   CM_HTTPS_CA_ROOT_CERT = fs.readFileSync("/run/secrets/DATABOX_ROOT_CA");
}

var agentOptions = {};
if (CM_HTTPS_CA_ROOT_CERT === false) {
	console.warn('Warning: No HTTPS root certificate provided so Databox HTTPS certificates will not be checked');
	agentOptions.rejectUnauthorized = false;
} else {
	agentOptions.ca = CM_HTTPS_CA_ROOT_CERT;
}
exports.httpsAgent = new https.Agent(agentOptions);

exports.getHttpsCredentials = function() {

	let credentials = {};

	try {
		//HTTPS certs created by the container mangers for this components HTTPS server.
		credentials = {
			key:  fs.readFileSync("/run/secrets/DATABOX.pem") || '',
			cert: fs.readFileSync("/run/secrets/DATABOX.pem") || ''
		};
	} catch (e) {
		console.warn('Warning: No HTTPS certificate not provided HTTPS certificates missing.');
		credentials = {};
	}

	return credentials
}

exports.makeArbiterRequest = function(method, path, json) {
	return new Promise((resolve, reject) => {
		if(arbiterURL === false) {
			//running outside databox return an empty token
			resolve("");
		}

		request({
			method: method,
			url: arbiterURL + path,
			json: json,
			headers: { 'X-Api-Key': arbiterToken },
			agent: exports.httpsAgent
		}, (err, res, body) => {
			if (err || res.statusCode !== 200) {
				reject(err || body);
				return;
			}
			resolve(body);
		});
	});
};

exports.makeStoreRequest = function() {
	var tokenCache = {};

	return (options) => {
		var route = {
			target: url.parse(options.url).hostname,
			path:   url.parse(options.url).pathname,
			method: options.method || 'GET'
		};
		var routeHash = JSON.stringify(route);

		return new Promise((resolve, reject) => {
			Promise.resolve().then(() => {
				if (!(routeHash in tokenCache))
					return exports.requestToken(route.target, route.path, route.method);
				return tokenCache[routeHash];
			}).then((token) => {
				options.agent = exports.httpsAgent;
				options.headers = options.headers || {};
				options.headers['X-Api-Key'] = tokenCache[routeHash] = token;

				return new Promise((resolve, reject) => {
					request(options, (err, res, body) => {
						if (err || (res.statusCode < 200 || res.statusCode >= 300)) {
							reject(err || body || "[API Error]" + res.statusCode);
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

exports.requestToken = function(hostname, endpoint, method) {
	return exports.makeArbiterRequest('POST', '/token', {
		target: hostname,
		path:   endpoint,
		method: method
	});
};

exports.waitForStoreStatus = function (href, status, maxRetries) {
	href = (url => url.protocol + '//' + url.host)(url.parse(href));
	return promiseRetry(function (retry, number) {
		return exports.makeStoreRequest({
			method: 'GET',
			url: href + '/status'
		}).then((body) => {
			if (body !== status)
				retry('[waitForStoreStatus] Poll #' + number + ' failed: status is ' + body + ' not ' + status);
		}).catch(function (err) {
			console.error(err.retried || err);
			console.log('[waitForStoreStatus] Retrying in 1s...');
			retry(err);
		});
	}, { retries: maxRetries, factor: 1 });
};
