'use strict'

const http = require('http');
var randomWords = require('random-words');
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

var fileContent = fs.readFileSync(path.join('/Projects/Ajeesh/HTML/meshchat/test/', 'test.pdf')).toString("base64");

const server = http.createServer(handle)

server.listen(0, startBench)

function handle(req, res) {
    res.end('hello world')
}

function startBench() {

    var substr = fileContent.substr(0, fileContent.length / 4);
    const url = 'http://localhost:' + 5000

    var random = randomWords(10);

    autocannon({
        url: url,
        connections: 100,
        pipelining: 20,
        duration: 10,
        headers: {
            // by default we add an auth token to all requests
            auth: 'A Pregenerated auth token'
        },
        requests: [{
                method: 'POST', // this should be a post for logging in
                path: '/api/user/register',
                body: JSON.stringify({
                    name: random[0],
                    age: Math.round(Math.random() * 100),
                    content: substr
                }),
                // overwrite our default headers,
                // so we don't add an auth token
                // for this request
                headers: {}
            }
            /*,
                        {
                            path: '/mySecretDetails'
                            // this will automatically add the pregenerated auth token
                        },
                        {
                            method: 'PUT', // this should be a put for modifying secret details
                            path: '/mySecretDetails',
                            headers: { // let submit some json?
                                'Content-type': 'application/json; charset=utf-8'
                            },
                            // we need to stringify the json first
                            body: JSON.stringify({
                                name: 'my new name'
                            })
                        }*/
        ]
    }, finishedBench)

    function finishedBench(err, res) {
        console.log('finished bench', err, res)
        server.close();
    }
}

startBench();