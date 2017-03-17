const utils = require('./utils.js');

exports.read = function(href, key) {
	return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/' + key + '/kv'
	});
};

exports.write = function(href, key, data) {
	return utils.makeStoreRequest({
		method: 'POST',
		json: data,
		url: href + '/' + key + '/kv'
	});
};
