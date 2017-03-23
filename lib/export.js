const utils = require('./utils.js');

var exportServiceURL = process.env.DATABOX_EXPORT_SERVICE_ENDPOINT;

exports.longpoll = function(destination, payload) {
	return utils.makeStoreRequest({
		method: 'POST',
		json: {
			id: '',
			uri: destination,
			data: JSON.stringify(payload)
		},
		url: exportServiceURL + '/lp/export'
	});
};

exports.queue = function(href, key, data) {
	throw new Error('Unimplemented');
};
