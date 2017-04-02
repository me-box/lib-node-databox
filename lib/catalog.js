const utils = require('./utils.js');

const url = require('url');

exports.getRootCatalog = function() {
	return utils.makeArbiterRequest('GET', '/cat', true);
};

exports.getStoreCatalog = function(href) {
	href = (url => url.protocol + '//' + url.host)(url.parse(href));
	return utils.makeStoreRequest({
		method: 'GET',
		json: true,
		url: href + '/cat'
	});
};

exports.listAvailableStores = function () {
	return new Promise((resolve, reject) => {
		exports.getRootCatalog().then((cat) => {
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
		exports.getRootCatalog().then((cat) => {
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

exports.registerDatasource = function(href, metadata) {
	href = (url => url.protocol + '//' + url.host)(url.parse(href));
	return new Promise((resolve, reject) => {
		if (!metadata
			  || !metadata.description
			  || !metadata.contentType
			  || !metadata.vendor
			  || !metadata.type
			  || !metadata.datasourceid
			  || !metadata.storeType
			)
			reject('Missing required metadata');

		var cat = {
			"item-metadata": [{
					"rel": "urn:X-hypercat:rels:hasDescription:en",
					"val": metadata.description
				}, {
					"rel": "urn:X-hypercat:rels:isContentType",
					"val": metadata.contentType
				}, {
					"rel": "urn:X-databox:rels:hasVendor",
					"val": metadata.vendor
				}, {
					"rel": "urn:X-databox:rels:hasType",
					"val": metadata.type
				}, {
					"rel": "urn:X-databox:rels:hasDatasourceid",
					"val": metadata.datasourceid
				}, {
					"rel": "urn:X-databox:rels:hasStoreType",
					"val": metadata.storeType
				}],
			href: href + '/' + metadata.datasourceid
		};

		if (metadata.isActuator)
			cat['item-metadata'].push({
				"rel": "urn:X-databox:rels:isActuator",
				"val": metadata.isActuator
			});

		if (metadata.unit)
			cat['item-metadata'].push({
				"rel": "urn:X-databox:rels:hasUnit",
				"val": metadata.unit
			});

		if (metadata.location)
			cat['item-metadata'].push({
				"rel": "urn:X-databox:rels:hasLocation",
				"val": metadata.location
			});

		utils.makeStoreRequest({
			method: 'POST',
			json: cat,
			url: href + '/cat'
		}).then(() => resolve()).catch((err) => reject(err));
	});
};
