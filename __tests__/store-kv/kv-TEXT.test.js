const storeClient = require('../../lib/store-client.js')
const EventEmitter = require('events');

const STORE_URI = 'tcp://127.0.0.1:5555'
const ARBITER_URI = 'tcp://127.0.0.1:4444'
const DATA_SOURCE_ID = Date.now()

test('Client:: KV write TEXT', async () => {
    let client = storeClient(STORE_URI, ARBITER_URI, false)
    let res = await client.KV.Write(DATA_SOURCE_ID, 'KeyWrite', 'TEST:data', 'TEXT')
    expect(res).toBe('created')
});

test('Client:: KV read TEXT', async () => {
    let client = storeClient(STORE_URI, ARBITER_URI, false)
    let res = await client.KV.Write(DATA_SOURCE_ID, 'KeyRead', 'TESTread:data', 'TEXT')
    expect(res).toBe('created')

    res = await client.KV.Read(DATA_SOURCE_ID, 'KeyRead', 'TEXT')
    expect(res).toEqual('TESTread:data')
});

test('Client:: KV Observe TEXT', async () => {

    let testData = [
        'TESTobs:data1',
        'TESTobs:data2',
        'TESTobs:data3',
        'TESTobs:data4',
    ]

    let client = storeClient(STORE_URI, ARBITER_URI, false)
    let emitter = await client.KV.Observe(DATA_SOURCE_ID, 0, 'TEXT')

    let receivedData = [];

    emitter.on('data', function (d) {
        receivedData.push(d.data);
    });

    let res = await client.KV.Write(DATA_SOURCE_ID, 'KeyObserve', testData[0], 'TEXT')
    expect(res).toBe('created')
    res = await client.KV.Write(DATA_SOURCE_ID, 'KeyObserve', testData[1], 'TEXT')
    expect(res).toBe('created')
    res = await client.KV.Write(DATA_SOURCE_ID, 'KeyObserve2', testData[2], 'TEXT')
    expect(res).toBe('created')
    res = await client.KV.Write(DATA_SOURCE_ID, 'KeyObserve2', testData[3], 'TEXT')
    expect(res).toBe('created')

    //wait a second for the observe request to be processed
    //or we dont get all the data.
    await sleep(500)

    expect(receivedData).toEqual(testData)
    await client.KV.StopObserving(DATA_SOURCE_ID);

});

test('Client:: KV Observe key TEXT', async () => {

    let testData = [
        'TESTobsKey:data1',
        'TESTobsKey:data2',
        'TESTobsKey:data3',
        'TESTobsKey:data4',
    ]

    let client = storeClient(STORE_URI, ARBITER_URI, false)
    let emitter = await client.KV.ObserveKey(DATA_SOURCE_ID, 'KeyObserveKey', 0, 'TEXT')

    let receivedData = [];

    emitter.on('data', function (d) {
        receivedData.push(d.data);
    });

    let res = await client.KV.Write(DATA_SOURCE_ID, 'KeyObserveKey', testData[0], 'TEXT')
    expect(res).toBe('created')
    res = await client.KV.Write(DATA_SOURCE_ID, 'KeyObserveKey', testData[1], 'TEXT')
    expect(res).toBe('created')
    res = await client.KV.Write(DATA_SOURCE_ID, 'KeyObserveKey', testData[2], 'TEXT')
    expect(res).toBe('created')
    res = await client.KV.Write(DATA_SOURCE_ID, 'KeyObserveKey', testData[3], 'TEXT')
    expect(res).toBe('created')

    //lets make sure we dont get data for other keys!!
    res = await client.KV.Write(DATA_SOURCE_ID, 'KeyObserveToAnotherKey', testData[3], 'TEXT')
    expect(res).toBe('created')

    //wait a second for the observe request to be processed
    //or we dont get all the data.
    await sleep(1000)

    expect(receivedData).toEqual(testData)
    await client.KV.StopObserving(DATA_SOURCE_ID, 'KeyObserveKey');

});

async function sleep(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}