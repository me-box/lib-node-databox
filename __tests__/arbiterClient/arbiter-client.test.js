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
        await arbiter.requestToken("127.0.0.1", "/", "post", "")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBe('Error requesting token from arbiter for / unauthorized');
    }

});

// actually this is authorised!
/*test('Arbiter:: Request token for unauthorized method', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    try {
        await arbiter.requestToken("127.0.0.1", "/cat", "DELETE", "")
        expect(true).toBe(false)
    } catch (error) {
	expect(error).toBe('Error requesting token from arbiter for /cat unauthorized');
    }

});
*/

test('Arbiter:: Request token for authorized method', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    try {
        let token = await arbiter.requestToken("127.0.0.1", "/cat", "GET", "")
        expect(typeof (token)).toBe('string')
    } catch (error) {
        expect(error).toBe(null)
    }

});

test('Arbiter:: Request token for invalid method', async () => {
    let arbiter = arbiterClient(config.ARBITER_ENDPOINT, false)
    try {
        await arbiter.requestToken("127.0.0.1", "/cat", "FISH", "")
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBe('Error requesting token from arbiter for /cat unauthorized');
    }

});
