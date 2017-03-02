const utils = require('./utils.js');

exports.read = function(href, dataSourceID) {
	return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/' + dataSourceID + '/key'
	});
};

exports.write = function(href, dataSourceID, data) {
	return utils.makeStoreRequest({
		method: 'POST',
		json: data,
		url: href + '/' + dataSourceID + '/key'
	});
};
