const arbiterClient = require('../../lib/arbiter-client.js')
const config = require('../../lib/config')

test('Arbiter:: Check initialisation', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    expect(arbiter.zestEndpoint).toBe("tcp://127.0.0.1:4444")
    expect(arbiter.zestDealerEndpoint).toBe("tcp://127.0.0.1:4445")
});

test('Arbiter:: Check Env Vars are Loaded', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    expect(config.ARBITER_TOKEN).toBe("secret")
});

test('Arbiter:: Request token valid', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    let token = await arbiter.requestToken("127.0.0.1", "/kv/test/key", "post", "")
    expect(typeof (token)).toBe('string')
});

test('Arbiter:: Request token for unauthorized path', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    try {
        expect(arbiter.requestToken("127.0.0.1", "/", "post", "")).toThrow('Error requesting token from arbiter for / unauthorized');
    } catch (error) {

    }

});

test('Arbiter:: Request token for unauthorized method', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    try {
        expect(arbiter.requestToken("127.0.0.1", "/cat", "DELETE", "")).toThrow('Error requesting token from arbiter for / unauthorized');
    } catch (error) {

    }

});

test('Arbiter:: Request token for authorized method', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    try {
        expect(arbiter.requestToken("127.0.0.1", "/cat", "GET", "")).toThrow('Error requesting token from arbiter for / unauthorized');
    } catch (error) {

    }

});

test('Arbiter:: Request token for invalid method', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    try {
        expect(arbiter.requestToken("127.0.0.1", "/cat", "FISH", "")).toThrow('Error requesting token from arbiter for / unauthorized');
    } catch (error) {

    }

});