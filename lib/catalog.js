const utils = require('./utils.js');

const url = require('url');

exports.getRootCatalog = function() {
	return utils.makeArbiterRequest('GET', '/cat', true);
};

exports.getStoreCatalog = function(href) {
	return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/cat'
	});
};

exports.listAvailableStores = function () {
	return new Promise((resolve, reject) => {
		utils.getRootCatalog().then((cat) => {
			cat.items = cat.items.map((item) => {
				return {
					description: item['item-metadata'].filter((pair)=> pair.rel.startsWith('urn:X-hypercat:rels:hasDescription:'))[0].val,
					hostname: url.parse(item.href).hostname,
					href: item.href
				};
			});
			resolve(cat.items);
		}).catch((err) => reject(err));
	});
};

exports.walkStoreCatalogs = function() {
	return new Promise((resolve, reject) => {
		getRootCatalog().then((cat) => {
			cat.items = cat.items
				.filter((item) => {
					// TODO: Remove once https://github.com/me-box/databox-container-manager/issues/34 is closed
					if (url.parse(item.href).hostname === 'databox-logstore')
						return false;
					var contentType = item['item-metadata'].filter((pair)=> pair.rel === 'urn:X-hypercat:rels:isContentType')[0];
					return contentType.val === 'application/vnd.hypercat.catalogue+json';
				})
				.map((item) => exports.getStoreCatalog(item.href));

			return Promise.all(cat.items);
		}).then((cats) => resolve(cats)).catch((err) => reject(err));
	});
};

exports.mapStoreCatalogs = function(callback, thisArg) {
	return new Promise((resolve, reject) => {
		exports.walkStoreCatalogs().then((stores) => {
			resolve(stores.map(callback, thisArg));
		}).catch((err) => reject(err));
	});
};
