const databox = require('../databox.js');
const assert = require('assert');

let serverEndPoint = "tcp://127.0.0.1:5555";

describe('Export', function() {

    describe('#Request token with destination caveat', function() {
        it('should get a token with a caveat ', function() {
            return databox.requestToken("127.0.0.1","/export/lp","POST",{"destination":"https://export.amar.io/"})
            .then((res) => {
                return assert.equal(res.length,264);
            })
            .catch((msg) => {
                return assert.fail(msg)
            });
        });
    });

    describe('#Request token with destination caveat', function() {
        it('should get unauthorized a token with a caveat ', function() {
            return databox.requestToken("127.0.0.1","/export/lp","POST",{"destination":"https://exportwqwq.amar.io/"})
            .then((res) => {
                return assert.fail("This token should not be granted")
            })
            .catch((msg) => {
                return assert.equal(msg,"unauthorized")
            });
        });
    });

});
