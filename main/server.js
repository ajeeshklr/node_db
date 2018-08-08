/**
 * Server file, which shall support both HTTP and HTTPS protcol.
 */

//#region Includes for server 

const http = require('http');  // For using with HTTP module
const https = require('https');    // For using with HTTPS module
const fs = require('fs');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

const uicontrollers = require('./../controller');
const apicontrollers = require('./../api');
const config = require('../config');
const helpers = require('../lib/helpers');
let decoder = new StringDecoder('utf8');

//#endregion

// Container for server.
const server = {};

/**
 * Unified server for handling HTTP and HTTPS requests.
 * @param {httprequest} req 
 * @param {httpresponse} resp 
 */
let unifiedServerResponseHandler = function (req, res) {

    // Buffer to store data received 
    let buffer = '';

    // Validated URL, including querystring if any.
    let parsedUrl = url.parse(req.url, true);

    // Get the parameters in the URL
    let trimmedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');

    // The actual query string received.
    let queryStringObject = parsedUrl.query;

    // The method in the request.
    let method = req.method.toLowerCase();

    // Headers inside the request.
    let headers = req.headers;

    req.on('data', data => {
        buffer += decoder.write(data);
    });

    if (trimmedPath == '') {
        trimmedPath = '';
    }

    let handler = undefined;

    if (trimmedPath.startsWith('api')) {
        handler = apicontrollers[trimmedPath];
    } else {
        handler = trimmedPath.indexOf('public/') > -1 ? uicontrollers.public : uicontrollers[trimmedPath];
    }

    // let handlers = trimmedPath.startsWith('api') ? apicontrollers : uicontrollers;
    // let handler = trimmedPath.indexOf('public/') > -1 ? uicontrollers.public : handlers[trimmedPath];


    if (typeof (handler) == 'undefined') {
        handler = uicontrollers.NotFound;
    } else if (typeof (handler[method]) != 'undefined') {
        handler = handler[method];
    }


    req.on('end', () => {

        // Write any pending data on the request stream to buffer.
        buffer += decoder.end();

        let data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        try {
            handler(data, function (statusCode, payload, contentType) {
                processResponseHandler(res, method, trimmedPath, statusCode, payload, contentType);
            });
        } catch (error) {
            debug(error);
            processResponseHandler(res, method, trimmedPath, 500, { 'Error': 'An unknown error has occured.' }, 'json');
        }
    });
};

let processResponseHandler = function (res, method, trimmedPath, statusCode, payload, contentType) {

    let payloadString = '';
    contentType = typeof (contentType) == 'string' ? contentType : 'json';
    statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

    switch (contentType) {
        case 'html':
            payloadString = typeof (payload) == 'string' ? payload : '';
            res.setHeader('Content-Type', 'text/html');
            break;

        case 'favicon':
            payloadString = typeof (payload) != undefined ? payload : '';
            res.setHeader('Content-Type', 'image/x-icon');
            break;

        case 'plain':
            payloadString = typeof (payload) != 'undefined' ? payload : '';
            res.setHeader('ContentType', 'text/plain');
            break;

        case 'png':
            payloadString = typeof (payload) != 'undefined' ? payload : '';
            res.setHeader('Content-Type', 'image/png');
            break;
        case 'jpg':
            payloadString = typeof (payload) != 'undefined' ? payload : '';
            res.setHeader('Content-Type', 'image/jpeg');
            break;
        case 'css':
            payloadString = typeof (payload) != 'undefined' ? payload : '';
            res.setHeader('Content-Type', 'text/css');
            break;

        case 'javascript':
            payloadString = typeof (payload) != 'string' ? payload : '';
            res.setHeader('Content-Type', 'application/javascript');
            break;

        default:    // Default to json.
            payload = typeof (payload) == 'object' ? payload : {};
            payloadString = JSON.stringify(payload);
            res.setHeader('Content-Type', 'application/json');
            break;

    }

    res.writeHead(statusCode);
    res.end(payloadString);

    // If the response is 200, print green, otherwise print red
    if (statusCode == 200) {
        console.log('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
    } else {
        console.log('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
    }
};

//Create HTTP server
let httpServer = http.createServer(function (req, res) {
    unifiedServerResponseHandler(req, res);
});

// HTTPS optios for creating HTTPS server.
let httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

// Create HTTPS server.
let httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServerResponseHandler(req, res);
});

// Initialize HTTPS server.

server.init = function () {

    // Listen HTTPS server.
    httpsServer.listen(config.httpsPort, () => {
        console.log('HTTPS server initialized.');
    });

    httpServer.listen(config.httpPort, () => {
        console.log('HTTP server initialized.');
    });

};


// Finally export the module once it is defined.
module.exports = server;