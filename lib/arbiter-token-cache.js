const crypto = require('crypto');

module.exports = function () {

    let arbiterCache = {
        tokenCache: {},

        invalidateToken: function (hostname, path, method, caveat) {
            let key = calculateCacheKey(hostname, path, method, caveat);
            if (key in this.tokenCache) {
                delete this.tokenCache[key];
            }
        },

        cacheToken: function (hostname, path, method, caveat, token) {
            let key = calculateCacheKey(hostname, path, method, caveat);
            this.tokenCache[key] = token;
        },

        getCachedToken: function (hostname, path, method, caveat) {
            let key = calculateCacheKey(hostname, path, method, caveat);
            if (key in this.tokenCache) {
                return this.tokenCache[key]
            }
            return false
        }

    }

    function calculateCacheKey(hostname, path, method, caveat) {
        return crypto.createHash('md5').update(hostname + path + method + caveatToJson(caveat)).digest('hex')
    }

    function caveatToJson(caveat) {
        let caveatJson = ""
        if (caveat !== null && typeof caveat === 'object') {
            return caveatJson = JSON.stringify(caveat);
        }
        return caveatJson
    }

    return arbiterCache;

}