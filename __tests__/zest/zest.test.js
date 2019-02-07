const zest = require('../../lib/zest.js')

const ROUTER_SOCKET = 'tcp://127.0.0.1:3333'
const DEALER_SOCKET = 'tcp://127.0.0.1:3334'
const DEFAULT_SERVER_KEY = "vl6wu0A@XP?}Or/&BR#LSxn>A+}L)p44/W[wXL3<"
const ENABLE_DEBUG = false
const DATA_SOURCE_ID = Date.now()

var zc
var zcObs

beforeAll(async () => {
    zc = zest(ROUTER_SOCKET, DEALER_SOCKET, DEFAULT_SERVER_KEY, ENABLE_DEBUG)
    zcObs = zest(ROUTER_SOCKET, DEALER_SOCKET, DEFAULT_SERVER_KEY, ENABLE_DEBUG)
});

test('Zest:: Write some data', async () => {
    let resp = await zc.Post('', `/kv/${DATA_SOURCE_ID}/1`, 'this is a test', 'TEXT')
    expect(resp).toBe("")
});

test('Zest:: Write some bad JSON data', async () => {
    try {
        await zc.Post('', `/kv/${DATA_SOURCE_ID}/1`, 'this is a test', 'JSON')
        expect(true).toBe('This should not happen Post bad json should throw error')
    } catch (error) {
        expect(error).toContain("JSON string is invalid")
    }
});

test('Zest:: test unknown content format', async () => {
    try {
        let resp = await zc.Post('', `/kv/${DATA_SOURCE_ID}/1`, 'this is a test', 'FISHPIE')
    } catch (error) {
        expect(error).toBe('Unknown content format')
    }

    try {
        let resp = await zc.Get('', `/kv/${DATA_SOURCE_ID}/1`, 'this is a test', 'TEST')
    } catch (error) {
        expect(error).toBe('Unknown content format')
    }

    try {
        let resp = await zc.Observe('', `/kv/${DATA_SOURCE_ID}/1`, 'this is a test', 'DATA')
    } catch (error) {
        expect(error).toBe('Unknown content format')
    }
});

test('Zest:: test known content format', async () => {
    try {
        await zc.Post('', `/kv/${DATA_SOURCE_ID}/1`, '{"data":"this is a test"}', 'JSON')
        await zc.Get('', `/kv/${DATA_SOURCE_ID}/1`, 'TEXT')
        await zc.Post('', `/kv/${DATA_SOURCE_ID}/1`, 'this is a test', 'BINARY')
    } catch (error) {
        //error if we get here it should pass
        expect("should not throw error").toBe(error)
    }
});

test('Zest:: Read some data', async () => {
    let resp = await zc.Get('', `/kv/${DATA_SOURCE_ID}/1`, 'TEXT')
    expect(resp).toBe('this is a test');
});

test('Zest:: Write some data then read some data', async () => {
    let resp = await zc.Post('', `/kv/${DATA_SOURCE_ID}/2`, 'this is a test 1', 'TEXT')
    expect(resp).toBe("")
    resp = await zc.Post('', `/kv/${DATA_SOURCE_ID}/2`, 'this is a test 2', 'TEXT')
    expect(resp).toBe("")
    resp = await zc.Post('', `/kv/${DATA_SOURCE_ID}/2`, 'this is a test 3', 'TEXT')
    expect(resp).toBe("")

    let getResp = await zc.Get('', `/kv/${DATA_SOURCE_ID}/2`, 'TEXT')
    expect(getResp).toBe('this is a test 3');
});

test('Zest:: Write data concurrently then read some data', async () => {

    let numWrites = 10
    let proms = []
    let expected = []

    for (let i = 1; i <= numWrites; i++) {
        proms.push(zc.Post('', `/kv/${DATA_SOURCE_ID}/${i}`, `this is a test ${i}`, 'TEXT'))
        expected.push("")
    }

    resp = await Promise.all(proms)
    expect(resp).toEqual(expected)

    proms = []
    expected = []
    for (let i = 1; i <= numWrites; i++) {
        proms.push(zc.Get('', `/kv/${DATA_SOURCE_ID}/${i}`, 'TEXT'))
        expected.push(`this is a test ${i}`)
    }
    resp = await Promise.all(proms)
    expect(resp).toEqual(expected)

});

test('Zest:: Observe', async () => {

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    let numWrites = 10
    let proms = []
    let expected = []
    let results = []

    let obsEmitter = await zcObs.Observe('', `/kv/${DATA_SOURCE_ID}/obsTest`, 'TEXT', 0)

    obsEmitter.on('data', (data) => {
        results.push(data)
    })

    for (let i = 1; i <= numWrites; i++) {
        let resp = await zc.Post('', `/kv/${DATA_SOURCE_ID}/obsTest`, `this is a test ${i}`, 'TEXT')
        expected.push(`this is a test ${i}`)
    }

    await sleep(500)

    for (let i = 0; i < numWrites; i++) {
        expect(results[i]).toContain(`this is a test ${i + 1}`)
    }

    zcObs.StopObserving(`/kv/${DATA_SOURCE_ID}/obsTest`)
});

test('Zest:: Observe 2', async () => {

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    let numWrites = 10
    let proms = []
    let expected = []
    let expected2 = []
    let results = []
    let results2 = []

    let obsEmitter = await zcObs.Observe('', `/kv/${DATA_SOURCE_ID}/obsTest`, 'TEXT', 0)
    let obsEmitter2 = await zcObs.Observe('', `/kv/${DATA_SOURCE_ID}/obsTest2`, 'TEXT', 0)

    obsEmitter.on('data', (data) => {
        results.push(data)
    })

    obsEmitter2.on('data', (data) => {
        results2.push(data)
    })

    for (let i = 1; i <= numWrites; i++) {
        await zc.Post('', `/kv/${DATA_SOURCE_ID}/obsTest`, `this is a test ${i}`, 'TEXT')
        expected.push(`this is a test ${i}`)
        await zc.Post('', `/kv/${DATA_SOURCE_ID}/obsTest2`, `this is a test 2 ${i}`, 'TEXT')
        expected2.push(`this is a test 2 ${i}`)
    }

    await sleep(500)

    for (let i = 0; i < numWrites; i++) {
        expect(results[i]).toContain(`this is a test ${i + 1}`)
    }

    for (let i = 0; i < numWrites; i++) {
        expect(results2[i]).toContain(`this is a test 2 ${i + 1}`)
    }

    zcObs.StopObserving(`/kv/${DATA_SOURCE_ID}/obsTest`)
    zcObs.StopObserving(`/kv/${DATA_SOURCE_ID}/obsTest2`)
});
