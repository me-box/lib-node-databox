const arbiterTokenCache = require('../../lib/arbiter-token-cache.js')()


test('ArbiterTokenCache:: token cache', async () => {

    let hostname = "testHost"
    let path = "/ts/test"
    let method = "POST"
    let caveat = { "destination": "https://export.amar.io/" }
    let testToken = "TEST TOKEN!"

    arbiterTokenCache.cacheToken(hostname, path, method, caveat, testToken)

    let token = arbiterTokenCache.getCachedToken(hostname, path, method, caveat)

    expect(token).toBe(testToken)

});

test('ArbiterTokenCache:: token delete', async () => {

    let hostname = "testHost"
    let path = "/ts/test2"
    let method = "POST"
    let caveat = { "destination": "https://export.amar.io/" }
    let testToken = "TEST TOKEN 2!"

    arbiterTokenCache.cacheToken(hostname, path, method, caveat, testToken)

    let token = arbiterTokenCache.getCachedToken(hostname, path, method, caveat)

    expect(token).toBe(testToken)

    arbiterTokenCache.invalidateToken(hostname, path, method, caveat)

    token = arbiterTokenCache.getCachedToken(hostname, path, method, caveat)

    expect(token).toBe(false)
});

test('ArbiterTokenCache:: token empty', async () => {

    let hostname = "testHost"
    let path = "/ts/dose/not/exist"
    let method = "POST"
    let caveat = { "destination": "https://export.amar.io/" }

    token = arbiterTokenCache.getCachedToken(hostname, path, method, caveat)

    expect(token).toBe(false)
});