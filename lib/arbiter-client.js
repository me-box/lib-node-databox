const zestClient = require('./zest.js');
const arbiterTokenCache = require('../lib/arbiter-token-cache.js')
const config = require('./config.js');

module.exports = function (reqEndpoint, enableLogging) {

    let arbiter = {
        requestTokenCache: {},

        requestToken: async function (targetHostname, path, method, caveat) {

            let token = this.tokenCache.getCachedToken(targetHostname, path, method, caveat)
            if (token !== false) {
                return token
            } else {
                try {
                    return await this.makeZestArbiterTokenRequest(targetHostname, path, method, caveat)
                } catch (error) {
                    throw `Error requesting token from arbiter for ${path} ${error}`
                }
            }
        },

        makeZestArbiterTokenRequest: async function (targetHostname, path, method, caveat) {
            let req = {
                target: targetHostname,
                path: path,
                method: method.toUpperCase(), //method is case sensitive make up always upper
                caveats: [],
            }

            if (caveat !== null && typeof caveat === 'object') {
                req.caveats = [caveat];
            }

            let reqJson = JSON.stringify(req);
            try {
                let token = this.zestClient.Post(this.config.ARBITER_TOKEN, '/token', reqJson, "JSON")
                this.tokenCache.cacheToken(targetHostname, path, method, caveat, token)
                return token
            } catch (error) {
                throw error
            }
        },

        config: config,
        tokenCache: arbiterTokenCache(),
        zestEndpoint: config.ARBITER_ENDPOINT,
        zestDealerEndpoint: reqEndpoint.replace(":4444", ":4445"),
    }

    arbiter.zestClient = zestClient(arbiter.zestEndpoint, arbiter.zestDealerEndpoint, config.CORE_STORE_KEY, false)

    return arbiter;

}