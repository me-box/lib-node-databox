const utils = require('./utils.js');

exports.latest = function(href, dataSourceID) {
	return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/' + dataSourceID + '/ts/latest'
	});
};

exports.since = function(href, dataSourceID, startTimestamp) {
	return utils.makeStoreRequest({
		method: 'GET',
		url: href + '/' + dataSourceID + '/ts/since',
		json: { startTimestamp }
	});
};

exports.range = function(href, dataSourceID, startTimestamp, endTimestamp) {
	return utils.makeStoreRequest({
		method: 'GET',
		url: href + '/' + dataSourceID + '/ts/range',
		json: { startTimestamp, endTimestamp }
	});
};

exports.write = function(href, dataSourceID, data) {
	return utils.makeStoreRequest({
		method: 'POST',
		json: { data: data },
		url: href + '/' + dataSourceID + '/ts'
	});
};
