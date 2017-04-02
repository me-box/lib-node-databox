const utils = require('./utils.js');

exports.read = function(href, key) {
	key && (href += '/' + key);
	return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/kv'
	});
};

exports.write = function(href, key, data) {
	data ? href += '/' + key : data = key;
	return utils.makeStoreRequest({
		method: 'POST',
		json: data,
		url: href + '/kv'
	});
};
