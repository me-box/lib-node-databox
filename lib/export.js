const utils = require('./utils.js');

const exportServiceURL = "https://export-service:8080"

exports.longpoll = function(destination, payload) {
	return utils.makeStoreRequest({
		method: 'POST',
		json: {
			id: '',
			uri: destination,
			data: JSON.stringify(payload)
		},
		url: exportServiceURL + '/lp/export'
	},
	{
		"destination": destination
	}
	);
};

exports.queue = function(href, key, data) {
	throw new Error('Unimplemented');
};
