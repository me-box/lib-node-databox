const zmq = require('zeromq')
const hex = require('hexer')
const os = require('os')
const EventEmitter = require('events')

module.exports = function (endpoint, dealerEndpoint, serverKey, logging) {
    const enableLogging = logging
    const server_key = serverKey
    const end_point = endpoint

    const openRouterSocket = async function () {

        let soc = zmq.createSocket('req')
        curveKeypair = zmq.curveKeypair();
        soc.curve_serverkey = new Buffer.from(server_key, 'utf8');
        soc.curve_publickey = new Buffer.from(curveKeypair.public, 'utf8');
        soc.curve_secretkey = new Buffer.from(curveKeypair.secret, 'utf8');
        soc.connect(end_point)
        return soc

    }

    const zestClient = {
        zestEndpoint: end_point,
        zestDealerEndpoint: dealerEndpoint,

        Observers: {}, //a dict to keep track of observers so they can be closed if needed.

        Post: async function (token, path, payload, contentFormat) {
            try {
                checkContentFormat(contentFormat)
                checkPayloadFormat(contentFormat, payload)

                let zh = NewZestHeader()
                zh.code = 2
                zh.token = token
                zh.tkl = token.length

                zh.payload = formatPayload(payload, contentFormat)

                zh.oc = 3
                zh.options.push(NewZestOptionHeader(11, path, path.length))
                let hostname = os.hostname()
                zh.options.push(NewZestOptionHeader(3, hostname, hostname.length))
                zh.options.push(
                    NewZestOptionHeader(12, contentFormatToInt(contentFormat), 2)
                ) //uint32

                let msg = MarshalZestHeader(zh)
                let resp = await sendRequestAndAwaitResponse(msg)
                let parsedResponse = handleResponse(resp)
                return parsedResponse.payload
            } catch (error) {
                throw error
            }
        },

        Get: async function (token, path, contentFormat) {
            try {
                checkContentFormat(contentFormat)

                let zh = NewZestHeader()
                zh.code = 1
                zh.token = token
                zh.tkl = token.length
                zh.oc = 3
                zh.options.push(NewZestOptionHeader(11, path, path.length))
                let hostname = os.hostname()
                zh.options.push(NewZestOptionHeader(3, hostname, hostname.length))
                zh.options.push(
                    NewZestOptionHeader(12, contentFormatToInt(contentFormat), 2)
                ) //uint32

                let msg = MarshalZestHeader(zh)
                let resp = await sendRequestAndAwaitResponse(msg)
                let parsedResponse = handleResponse(resp)
                return parsedResponse.payload
            } catch (error) {
                throw error
            }

        },

        Observe: async function (token, path, contentFormat, timeOut = 0) {
            try {
                checkContentFormat(contentFormat)

                //
                // Perform a post to get the ident and server key for the observe
                // dealer socket
                //
                let zh = NewZestHeader()
                zh.code = 1
                zh.token = token
                zh.tkl = token.length
                zh.oc = 5
                zh.options.push(NewZestOptionHeader(11, path, path.length))
                let hostname = os.hostname()
                zh.options.push(NewZestOptionHeader(3, hostname, hostname.length))
                zh.options.push(NewZestOptionHeader(6, '', 0))
                zh.options.push(
                    NewZestOptionHeader(12, contentFormatToInt(contentFormat), 2)
                ) //uint32
                zh.options.push(NewZestOptionHeader(14, timeOut, 4)) //uint64
                log(zh)

                let msg = MarshalZestHeader(zh)
                resp = await sendRequestAndAwaitResponse(msg)
                let parsedResponse = handleResponse(resp)

                //
                // set up the dealer
                //
                let dealer = await zmq.createSocket('dealer')
                dealer.identity = parsedResponse.payload

                serverKeyOption = parsedResponse.options.filter(opt => {
                    return opt.number == 2048
                })
                dealerServerKey = serverKeyOption[0].value

                log('Identity: ' + parsedResponse.payload)
                log('dealerServerKey: ' + dealerServerKey)

                curveKeyPair = zmq.curveKeypair()
                dealer.curve_serverkey = new Buffer.from(dealerServerKey, 'hex')
                dealer.curve_publickey = new Buffer.from(curveKeyPair.public, 'utf8')
                dealer.curve_secretkey = new Buffer.from(curveKeyPair.secret, 'utf8')

                dealer.connect(this.zestDealerEndpoint)

                //
                // build Event emitter to return to client
                //
                let EE = new EventEmitter()

                this.Observers[path] = { dealer, EE }

                dealer.on('message', function (msg) {
                    try {
                        let zh = handleResponse(msg)
                        EE.emit('data', zh.payload)
                    } catch (err) {
                        EE.emit('error', msg)
                    }
                })

                dealer.on('error', function (msg) {
                    EE.emit('error', msg)
                })

                dealer.on('end', function (msg) {
                    EE.emit('error', msg)
                })

                dealer.on('connect', function (msg) {
                    EE.emit('error', msg)
                })

                dealer.on('close', function (msg) {
                    EE.emit('error', msg)
                })

                return EE
            } catch (error) {
                throw error
            }
        },

        StopObserving: async function (path) {
            if (zestClient.Observers[path]) {
                zestClient.Observers[path]['dealer'].close()
                await zestClient.Observers[path]['EE'].removeAllListeners('data')
                await zestClient.Observers[path]['EE'].removeAllListeners('error')
                await zestClient.Observers[path]['EE'].removeAllListeners('end')
                await zestClient.Observers[path]['EE'].removeAllListeners('connect')
                await zestClient.Observers[path]['EE'].removeAllListeners('close')
                zestClient.Observers[path]['EE'] = null
                delete zestClient.Observers[path]
            }
        },
    }

    function log(msg) {
        if (enableLogging) {
            console.log('[Node ZestClient ] ', msg)
        }
    }

    async function sendRequestAndAwaitResponse(msg) {

        return new Promise(async (resolve, reject) => {
            let soc = await openRouterSocket()

            log('Sending request:')
            log('\n' + hex(msg))

            soc.send(msg)

            soc.on('message', function (msg) {
                log('soc.on message')
                resolve(msg)
                soc.close()
            })

            soc.on('error', function (msg) {
                reject(msg)
                soc.close()
            })
        })
    }

    function formatPayload(payload, format) {
        if (Buffer.isBuffer(payload)) {
            return payload.toString()
        }

        if (typeof payload === 'object') {
            try {
                return JSON.stringify(payload)
            } catch (error) {
                throw 'JSON string is invalid ' + error
            }
        }

        if (typeof payload === 'string' && format.toUpperCase() == 'JSON') {
            try {
                JSON.parse(payload)
                return payload
            } catch (error) {
                throw 'JSON string is invalid ' + error
            }
        }

        return payload
    }

    function checkPayloadFormat(format, payload) {

        let payloadType = typeof (payload)

        switch (format.toUpperCase()) {
            case 'TEXT':
                if (payloadType === 'string')
                    return true
                throw "Payload must be string for content type TEXT"
            case 'BINARY':
                if (payloadType === 'string' || Buffer.isBuffer(payload))
                    return true
                throw "Payload must be string of buffer for content type BINARY"
            case 'JSON':
                if ((payloadType === 'object' || payloadType === 'string') && !Buffer.isBuffer(payload))
                    return true
                throw "Payload must be an Object or valid JSON string for content type JSON"
        }

        throw "Unknown content format"
    }

    function checkContentFormat(format) {
        switch (format.toUpperCase()) {
            case 'TEXT':
                return true
            case 'BINARY':
                return true
            case 'JSON':
                return true
        }

        throw "Unknown content format"
    }

    function contentFormatToInt(format) {
        switch (format.toUpperCase()) {
            case 'TEXT':
                return 0
            case 'BINARY':
                return 42
            case 'JSON':
                return 50
        }

        throw "Unknown content format"
    }

    let NewZestOptionHeader = function (number, value, len) {
        return {
            number: number,
            len: len,
            value: value
        }
    }

    let NewZestHeader = function () {
        return {
            oc: 0,
            code: 0,
            tkl: 0,
            token: '',
            options: [],
            payload: ''
        }
    }

    function MarshalZestHeader(zh) {
        log(zh)

        let optionsLen = zh.options.reduce((len, option) => {
            return { len: 4 + len.len + option.len }
        })

        let buf = Buffer.alloc(
            8 + zh.tkl + optionsLen.len + Buffer.byteLength(zh.payload, 'utf8')
        )

        buf.writeUInt8(zh.code, 0)
        buf.writeUInt8(zh.oc, 1)
        buf.writeUInt16BE(zh.tkl, 2)
        buf.write(zh.token, 4)

        let offset = 4 + zh.tkl
        for (let i = 0; i < zh.oc; i++) {
            zoh = MarshalZestOptionsHeader(zh.options[i])
            zoh.copy(buf, offset)
            offset += zoh.length
        }

        buf.write(zh.payload, offset, Buffer.byteLength(zh.payload, 'utf8'), 'utf8')

        return buf
    }

    function ParseZestHeader(msgBuf) {
        let zh = NewZestHeader()
        zh.code = msgBuf.readUInt8(0)
        zh.oc = msgBuf.readUInt8(1)
        zh.tkl = msgBuf.readUInt16BE(2)
        if (zh.tkl > 0) {
            zh.token = msgBuf.toString('utf8', 4, 4 + zh.tkl)
        }

        offset = 4 + zh.tkl
        for (let i = 0; i < zh.oc; i++) {
            zoh = ParseZestOptionsHeader(msgBuf, offset)
            zh.options.push(zoh)
            offset += 4 + zoh.len
        }
        if (msgBuf.length > offset) {
            zh.payload = msgBuf.toString('utf8', offset)
        }

        return zh
    }

    function MarshalZestOptionsHeader(zoh) {
        log(zoh)

        let buf = Buffer.alloc(4 + zoh.len)
        buf.writeUInt16BE(zoh.number, 0)
        buf.writeUInt16BE(zoh.len, 2)
        if (zoh.number == 12) {
            buf.writeUInt16BE(zoh.value, 4)
        } else if (zoh.number == 14) {
            buf.writeUInt32BE(zoh.value, 4)
        } else {
            buf.write(zoh.value.toString(), 4)
        }
        return buf
    }

    function ParseZestOptionsHeader(msgBuf, offset) {
        zoh = NewZestOptionHeader()
        zoh.number = msgBuf.readUInt16BE(offset)
        zoh.len = msgBuf.readUInt16BE(offset + 2)
        zoh.value = msgBuf.toString('hex', offset + 4, offset + 4 + zoh.len)
        return zoh
    }

    function handleResponse(msg) {
        log('Got response:')
        log('\n' + hex(msg))

        zr = ParseZestHeader(msg)

        switch (zr.code) {
            case 65:
                //created
                return zr
            case 69:
                //content
                return zr
            case 128:
                throw 'bad request'
            case 129:
                throw 'unauthorized'
            case 143:
                throw 'unsupported content format'
        }

        throw 'invalid code:' + zr.Code
    }

    return zestClient
}
