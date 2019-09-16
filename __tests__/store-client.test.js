const storeClient = require('../main.js')

const STORE_URI = 'tcp://127.0.0.1:5555'
const ARBITER_URI = 'tcp://127.0.0.1:4444'
const DATA_SOURCE_ID = Date.now()

test('Client:: Check initialisation', async () => {
    let client = storeClient.NewStoreClient(STORE_URI, ARBITER_URI, false)
    expect(client.zestEndpoint).toBe(STORE_URI)
    expect(client.zestDealerEndpoint).toMatch(/5556/)
});

test('Client:: Check Env Vars are Loaded', async () => {
    let client = storeClient.NewStoreClient(STORE_URI, ARBITER_URI, false)
    expect(client.config.CORE_STORE_KEY).toBe('vl6wu0A@XP?}Or/&BR#LSxn>A+}L)p44/W[wXL3<')
    expect(client.config.ARBITER_TOKEN).toBe('secret')
});

test('Client:: invalid DataSourceMetadata', async () => {
    let client = storeClient.NewStoreClient(STORE_URI, ARBITER_URI, false)
    try {
        await client.RegisterDatasource({})
    } catch (error) {
        expect(error).toBe('Error:: Not a valid DataSourceMetadata object missing required property')
    }
});

test('Client:: valid DataSourceMetadata invalid store type', async () => {
    let client = storeClient.NewStoreClient(STORE_URI, ARBITER_URI, false)
    try {
        let dsm = storeClient.NewDataSourceMetadata()
        await client.RegisterDatasource(dsm)
    } catch (error) {
        expect(error).toBe('Error:: DataSourceMetadata invalid StoreType can be kv,ts or ts/blob')
    }
});

test('Client:: valid DataSourceMetadata valid store type', async () => {
    let client = storeClient.NewStoreClient(STORE_URI, ARBITER_URI, false)
    try {
        let dsm = storeClient.NewDataSourceMetadata()
        dsm.StoreType = 'ts'
        await client.RegisterDatasource(dsm)
        expect(true).toBe(true)
    } catch (error) {
        expect(error).toBe(null)
    }
});

test('Client:: invalid storeType', async () => {
    let client = storeClient.NewStoreClient(STORE_URI, ARBITER_URI, false)
    try {
        let dsm = storeClient.NewDataSourceMetadata()
        dsm.StoreType = 'fish/pie'
        await client.RegisterDatasource(dsm)
    } catch (error) {
        expect(error).toBe('Error:: DataSourceMetadata invalid StoreType can be kv,ts or ts/blob')
    }
});


test('Client:: RegisterDatasource', async () => {
    let client = storeClient.NewStoreClient(STORE_URI, ARBITER_URI, false)
    try {
        let dsm = storeClient.NewDataSourceMetadata()
        dsm.StoreType = 'ts'
        dsm.DataSourceID = DATA_SOURCE_ID
        dsm.Description = `this is ds ${DATA_SOURCE_ID}`
        await client.RegisterDatasource(dsm)
        await sleep(500)
        let catalogue = await client.GetDatasourceCatalogue()
        expect(JSON.stringify(catalogue)).toMatch(new RegExp(`this is ds ${DATA_SOURCE_ID}`, ""))
    } catch (error) {
	expect(error).toBe(null)
    }
});

const TEST_HYPERCAT='{"item-metadata":[{"rel":"urn:X-hypercat:rels:hasDescription:en","val":"hello world actuator"},{"rel":"urn:X-hypercat:rels:isContentType","val":"application/json"},{"rel":"urn:X-databox:rels:hasVendor","val":"Databox Inc."},{"rel":"urn:X-databox:rels:hasType","val":"helloWorldActuator"},{"rel":"urn:X-databox:rels:hasDatasourceid","val":"helloWorldActuator"},{"rel":"urn:X-databox:rels:hasStoreType","val":"ts/blob"},{"rel":"urn:X-databox:rels:isActuator","val":true},{"rel":"urn:X-databox:rels:hasUnit","val":" "},{"rel":"urn:X-databox:rels:hasLocation","val":" "}],"href":"tcp://driver-helloworld-node-core-store:5555/ts/blob/helloWorldActuator"}';

test('Client:: GetStoreURLFromHypercat', async () => {
	let url = storeClient.GetStoreURLFromHypercat( TEST_HYPERCAT )
	expect( url ).toBe( 'tcp://driver-helloworld-node-core-store:5555' )
});

test('Client:: HypercatToDataSourceMetadata', async () => {
	let dsm = storeClient.HypercatToDataSourceMetadata( TEST_HYPERCAT )
	expect( dsm.DataSourceID ).toBe( 'helloWorldActuator' )
        expect( dsm.DataSourceType ).toBe( 'helloWorldActuator' )
	expect( dsm.StoreType ).toBe( 'ts/blob' )
	expect( dsm.IsActuator ).toBe( true )
});

async function sleep(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}
