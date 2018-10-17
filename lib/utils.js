const https = require('https');
const url = require('url');
const fs = require('fs');
const request = require('request');
const promiseRetry = require('promise-retry');
const crypto = require('crypto');
const zestClient = require('nodezestclient');

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
	arbiterToken = fs.readFileSync("/run/secrets/ARBITER_TOKEN",{encoding:'binary'});
} else if (fs.existsSync("/run/secrets/CM_KEY")) {
	//we are running in the container manager
	arbiterToken = fs.readFileSync("/run/secrets/CM_KEY",{encoding:'binary'});
} else {
	// not running in in databox set up default values for testing
	arbiterURL = "tcp://127.0.0.1:4444";
	arbiterToken = "secret"
	console.warn('Warning: Using default values for arbiterURL and arbiterToken');
}

let ArbiterClient = zestClient.New(arbiterURL, arbiterURL, CORE_STORE_KEY);

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

exports.makeZestArbiterGETRequest = function(path) {
	return ArbiterClient.Get(arbiterToken, path, "JSON")
}

exports.makeZestArbiterPOSTRequest = function(path, json) {
	if(json !== null && typeof json === 'object') {
		json = JSON.stringify(json);
	}
	return ArbiterClient.Post(arbiterToken, path, json, "JSON")
}


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

let requestTokenCache = {}
exports.requestToken = function(hostname, endpoint, method) {

	return new Promise((resolve, reject) => {
		let key = crypto.createHash('md5').update(hostname+endpoint+method).digest('hex');

		if(key in requestTokenCache) {
			resolve(requestTokenCache[key]);
		} else {
			exports.makeZestArbiterPOSTRequest('/token', {
				target: hostname,
				path:   endpoint,
				method: method,
				caveats: [],
			})
			.then((res)=>{
				requestTokenCache[key] = res;
				resolve(requestTokenCache[key]);
			})
			.catch((err)=>{
				delete requestTokenCache[key];
				reject(err);
			})

		}
	});

};

exports.invalidateToken= function (hostname, endpoint, method) {
	let key = crypto.createHash('md5').update(hostname+endpoint+method).digest('hex');
	if(key in requestTokenCache) {
		delete requestTokenCache[key];
	}
}

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
