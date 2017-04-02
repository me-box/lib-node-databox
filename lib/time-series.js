const utils = require('./utils.js');

exports.latest = function(href, dataSourceID) {
	dataSourceID && (href += '/' + dataSourceID);
	return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/ts/latest'
	});
};

exports.since = function(href, dataSourceID, startTimestamp) {
	startTimestamp ? href += '/' + dataSourceID : startTimestamp = dataSourceID;
	return utils.makeStoreRequest({
		method: 'GET',
		url: href + '/ts/since',
		json: { startTimestamp }
	});
};

exports.range = function(href, dataSourceID, startTimestamp, endTimestamp) {
	endTimestamp ? href += '/' + dataSourceID : (endTimestamp = startTimestamp, startTimestamp = dataSourceID);
	return utils.makeStoreRequest({
		method: 'GET',
		url: href + '/ts/range',
		json: { startTimestamp, endTimestamp }
	});
};

exports.write = function(href, dataSourceID, data) {
	data ? href += '/' + dataSourceID : data = dataSourceID;
	return utils.makeStoreRequest({
		method: 'POST',
		json: { data: data },
		url: href + '/ts'
	});
};
