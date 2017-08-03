const utils = require('./utils.js');

/*
* href: https://[store-host-name]:[port]/[datasorceID]
* Timestamps in seconds
*/

exports.latest = function(href) {
	return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/ts/latest'
	});
};

exports.last = function(href, n) {
	return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/ts/last/' + n
	});
};

exports.lastNsince = function (href, n, startTimestamp) {
    return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/ts/last/' + n + '/since/' + startTimestamp
	});
}

exports.lastNrange = function (href, n, startTimestamp, endTimestamp) {
    return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/ts/last/' + n + '/range/' + startTimestamp + '/' + endTimestamp
	});
}

exports.since = function(href, startTimestamp) {
	return utils.makeStoreRequest({
		method: 'GET',
		url: href + '/ts/since/' + startTimestamp,
	});
};

exports.range = function(href, startTimestamp, endTimestamp) {
	return utils.makeStoreRequest({
		method: 'GET',
		url: href + '/ts/range/' + startTimestamp + '/' + endTimestamp,
	});
};

exports.write = function(href, data) {
	return utils.makeStoreRequest({
		method: 'POST',
		json: { data: data },
		url: href + '/ts'
	});
};