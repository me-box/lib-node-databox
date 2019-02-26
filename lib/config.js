const https = require('https');
const url = require('url');
const fs = require('fs');
const os = require('os');

const DATABOX_TESTING = !(process.env.DATABOX_VERSION);

if (DATABOX_TESTING) {
    require('dotenv').load();
}

exports.ARBITER_ENDPOINT = process.env.DATABOX_ARBITER_ENDPOINT;
var hostname = process.env.DATABOX_LOCAL_NAME || os.hostname;

let CORE_STORE_KEY = ""
if (fs.existsSync("/run/secrets/ZMQ_PUBLIC_KEY")) {
    CORE_STORE_KEY = fs.readFileSync("/run/secrets/ZMQ_PUBLIC_KEY");
} else {
    CORE_STORE_KEY = process.env.CORE_STORE_KEY;
    console.warn('Warning: No ZMQ_PUBLIC_KEY provided so Databox with use the default key');
}
exports.CORE_STORE_KEY = CORE_STORE_KEY;

let ARBITER_TOKEN = "";
if (fs.existsSync("/run/secrets/ARBITER_TOKEN")) {
    ARBITER_TOKEN = fs.readFileSync("/run/secrets/ARBITER_TOKEN", { encoding: 'binary' });
} else if (fs.existsSync("/run/secrets/CM_KEY")) {
    //we are running in the container manager
    ARBITER_TOKEN = fs.readFileSync("/run/secrets/CM_KEY", { encoding: 'binary' });
} else {
    // not running in in databox set up default values for testing
    ARBITER_TOKEN = process.env.ARBITER_TOKEN
    console.warn('Warning: Using default values for arbiterURL and arbiterToken');
}
exports.ARBITER_TOKEN = ARBITER_TOKEN

// Configure HTTPS agent to trust the databox instances HTTPS root certificate
let CM_HTTPS_CA_ROOT_CERT = false;
if (fs.existsSync("/run/secrets/DATABOX_ROOT_CA")) {
    CM_HTTPS_CA_ROOT_CERT = fs.readFileSync("/run/secrets/DATABOX_ROOT_CA");
}

var agentOptions = {};
if (CM_HTTPS_CA_ROOT_CERT === false) {
    console.warn('Warning: No HTTPS root certificate provided so Databox HTTPS certificates will not be checked');
    agentOptions.rejectUnauthorized = false;
} else {
    agentOptions.ca = CM_HTTPS_CA_ROOT_CERT;
}
exports.httpsAgent = new https.Agent(agentOptions);

exports.getHttpsCredentials = function () {

    let credentials = {};

    try {
        //HTTPS certs created by the container mangers for this components HTTPS server.
        credentials = {
            key: fs.readFileSync("/run/secrets/DATABOX.pem") || '',
            cert: fs.readFileSync("/run/secrets/DATABOX.pem") || ''
        };
    } catch (e) {
        console.warn('Warning: No HTTPS certificate not provided HTTPS certificates missing.');
        credentials = {};
    }

    return credentials
}