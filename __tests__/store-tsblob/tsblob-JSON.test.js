const storeClient = require('../../lib/store-client.js')
const EventEmitter = require('events');

const STORE_URI = 'tcp://127.0.0.1:5555'
const ARBITER_URI = 'tcp://127.0.0.1:4444'
const DATA_SOURCE_ID = Date.now()

test('Client:: TSBlob write JSON', async () => {
    let client = storeClient(STORE_URI, ARBITER_URI, false)
    let res = await client.TSBlob.Write(DATA_SOURCE_ID, { 'TEST': 'First data' })
    expect(res).toBe('created')
});

test('Client:: TSBlob latest JSON', async () => {
    let client = storeClient(STORE_URI, ARBITER_URI, false)
    let res = await client.TSBlob.Write(DATA_SOURCE_ID, { 'TestLatest': 'data' })
    expect(res).toBe('created')

    res = await client.TSBlob.Latest(DATA_SOURCE_ID)
    expect(res[0].data).toEqual({ 'TestLatest': 'data' })
});

test('Client:: TSBlob lastN JSON no data', async () => {
    let client = storeClient(STORE_URI, ARBITER_URI, false)

    res = await client.TSBlob.LastN(DATA_SOURCE_ID + 'missing', 50)
    expect(res).toEqual([])
});

test('Client:: TSBlob length JSON', async () => {
    let client = storeClient(STORE_URI, ARBITER_URI, false)

    let numRecords = 10;

    for (let i = 0; i < numRecords; i++) {
        const res = await client.TSBlob.Write(DATA_SOURCE_ID + 'TestLength', { 'TestLength': `data${i}` })
        expect(res).toBe('created')
    }

    res = await client.TSBlob.Length(DATA_SOURCE_ID + 'TestLength')
    expect(res).toEqual({ "length": numRecords })
});

test('Client:: TSBlob lastN JSON', async () => {

    let client = storeClient(STORE_URI, ARBITER_URI, false)

    let testData = [
        { 'TESTLastN': 'data1' },
        { 'TESTLastN': 'data2' },
        { 'TESTLastN': 'data3' },
        { 'TESTLastN': 'data4' },
        { 'TESTLastN': 'data5' },
        { 'TESTLastN': 'data6' },
    ]

    for (const d of testData) {
        const res = await client.TSBlob.Write(DATA_SOURCE_ID, d)
        expect(res).toBe('created')
    }

    let res = await client.TSBlob.LastN(DATA_SOURCE_ID, testData.length)

    expect(res.length).toBe(testData.length)

    expect(res[5].data).toEqual(testData[0])
    expect(res[4].data).toEqual(testData[1])
    expect(res[3].data).toEqual(testData[2])
    expect(res[2].data).toEqual(testData[3])
    expect(res[1].data).toEqual(testData[4])
    expect(res[0].data).toEqual(testData[5])

});

test('Client:: TSBlob FirstN JSON', async () => {

    let client = storeClient(STORE_URI, ARBITER_URI, false)

    let testData = [
        { 'TESTFirstN': 'data1' },
        { 'TESTFirstN': 'data2' },
        { 'TESTFirstN': 'data3' },
        { 'TESTFirstN': 'data4' },
        { 'TESTFirstN': 'data5' },
        { 'TESTFirstN': 'data6' },
    ]

    for (const d of testData) {
        const res = await client.TSBlob.Write(DATA_SOURCE_ID + 'FirstN', d)
        expect(res).toBe('created')
    }

    let res = await client.TSBlob.FirstN(DATA_SOURCE_ID + 'FirstN', 5)

    expect(res.length).toBe(5)

    expect(res[0].data).toEqual(testData[0])
    expect(res[1].data).toEqual(testData[1])
    expect(res[2].data).toEqual(testData[2])
    expect(res[3].data).toEqual(testData[3])
    expect(res[4].data).toEqual(testData[4])

    expect(res[5]).toBeUndefined()

});

test('Client:: TSBlob Earliest JSON', async () => {

    let client = storeClient(STORE_URI, ARBITER_URI, false)

    let testData = [
        { 'TESTEarliest': 'data1' },
        { 'TESTEarliest': 'data2' },
        { 'TESTEarliest': 'data3' },
        { 'TESTEarliest': 'data4' },
        { 'TESTEarliest': 'data5' },
        { 'TESTEarliest': 'data6' },
    ]

    let startTime = Date.now()
    for (const d of testData) {
        const res = await client.TSBlob.Write(DATA_SOURCE_ID + 'Earliest', d)
        await sleep(500)
        expect(res).toBe('created')
    }

    let res = await client.TSBlob.Earliest(DATA_SOURCE_ID + 'Earliest', startTime - 100, startTime + 1500)

    expect(res.length).toBe(1)

    expect(res[0].data).toEqual(testData[0])


});


test('Client:: TSBlob Range JSON', async () => {

    let client = storeClient(STORE_URI, ARBITER_URI, false)

    let testData = [
        { 'TESTRange': 'data1' },
        { 'TESTRange': 'data2' },
        { 'TESTRange': 'data3' },
        { 'TESTRange': 'data4' },
        { 'TESTRange': 'data5' },
        { 'TESTRange': 'data6' },
    ]

    let startTime = Date.now()
    for (const d of testData) {
        const res = await client.TSBlob.Write(DATA_SOURCE_ID + 'Range', d)
        await sleep(500)
        expect(res).toBe('created')
    }

    let res = await client.TSBlob.Range(DATA_SOURCE_ID + 'Range', startTime - 100, startTime + 1500)

    expect(res.length).toBe(3)

    expect(res[0].data).toEqual(testData[2])
    expect(res[1].data).toEqual(testData[1])
    expect(res[2].data).toEqual(testData[0])

});

test('Client:: TSBlob Since JSON', async () => {

    let client = storeClient(STORE_URI, ARBITER_URI, false)

    let testData = [
        { 'TESTSince': 'data1' },
        { 'TESTSince': 'data2' },
        { 'TESTSince': 'data3' },
        { 'TESTSince': 'data4' },
        { 'TESTSince': 'data5' },
        { 'TESTSince': 'data6' },
    ]

    let startTime = Date.now()
    for (const d of testData) {
        const res = await client.TSBlob.Write(DATA_SOURCE_ID + 'Since', d)
        await sleep(500)
        expect(res).toBe('created')
    }

    let res = await client.TSBlob.Since(DATA_SOURCE_ID + 'Since', startTime + 1500)

    expect(res.length).toBe(3)

    expect(res[0].data).toEqual(testData[5])
    expect(res[1].data).toEqual(testData[4])
    expect(res[2].data).toEqual(testData[3])

});


test('Client:: TSBlob Observe JSON', async () => {

    let testData = [
        { 'TESTobs': 'data1' },
        { 'TESTobs': 'data2' },
        { 'TESTobs': 'data3' },
        { 'TESTobs': 'data4' },
    ]

    let client = storeClient(STORE_URI, ARBITER_URI, false)
    let emitter = await client.TSBlob.Observe(DATA_SOURCE_ID)

    let receivedData = [];

    emitter.on('data', function (d) {
        receivedData.push(d.data);
    });

    let res = await client.TSBlob.Write(DATA_SOURCE_ID, testData[0])
    expect(res).toBe("created")
    res = await client.TSBlob.Write(DATA_SOURCE_ID, testData[1])
    expect(res).toBe("created")
    res = await client.TSBlob.Write(DATA_SOURCE_ID, testData[2])
    expect(res).toBe("created")
    res = await client.TSBlob.Write(DATA_SOURCE_ID, testData[3])
    expect(res).toBe("created")

    //wait a second for the observe request to be processed
    //or we dont get all the data.
    await sleep(500)

    expect(receivedData).toEqual(testData)
    client.TSBlob.StopObserving(DATA_SOURCE_ID);

});

async function sleep(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}