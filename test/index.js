'use strict';

// Use this class to execute specific tests.
// Tests can be of any nature. Add all specific tests to the test folder, the client will automatically pick up the test.
// At present, load testing is only possible with changes in the code.
// A configurable load testing can be provided later.

/**
 * This is the main class which validate all functionalities.
 */

const helpers = require('../lib/helpers');
let DBManager = require('../framework/managers/dbmanager').DbManager;
let co = require('co');
let config = require('../config').getConfig();
let helper = require('../lib/helpers');
var fileContent = helper.getFileContent('/Projects/Ajeesh/HTML/meshchat/test/', 'test.pdf');
let AbstractModel = require('../framework/core/db/abstractmodel').AbstractModel;



let container = {};
let modules = {};
helpers.loadModules("./test", modules, true, true); // Load all modules one by one.


let totalCount = 0;
let succeeded = 0;
let MAX_COUNT = 10000000; // Use this for load testing the DB apis.

// Queue class 
class Queue {
    // Array is used to implement a Queue 
    constructor() {
        this.items = [];
    }

    // enqueue function 
    enqueue(element) {
        // adding element to the queue 
        this.items.push(element);
    }

    // dequeue function 
    dequeue() {
        // removing element from the queue 
        // returns underflow when called 
        // on empty queue 
        if (this.isEmpty())
            return "Underflow";
        return this.items.shift();
    }
    // front function 
    front() {
        // returns the Front element of 
        // the queue without removing it. 
        if (this.isEmpty())
            return "No elements in Queue";
        return this.items[0];
    }
    // isEmpty function 
    isEmpty() {
        // return true if the queue is empty. 
        return this.items.length == 0;
    }
    // printQueue function 
    printQueue() {
        var str = "";
        for (var i = 0; i < this.items.length; i++)
            str += this.items[i] + " ";
        return str;
    }
}



function _executeTest(modules, index, callback) {

    let mod = modules[index];

    (() => {
        // console.error("Executing test - " + key);
        mod.value((err) => {
            totalCount++;
            if (!err) {
                succeeded++;
                // console.log('\x1b[32m%s\x1b[0m%s', 'Test Pass - ', key);
            } else {
                // console.log('\x1b[31m%s\x1b[0m%s%s%s', 'Test FAILED - ', key, ' with error - ', err);
            }

            if (totalCount == MAX_COUNT * modules.length) {
                console.log('\x1b[32m%s\x1b[0m%s\x1b[32m%s\x1b[0m%s\x1b[31m%s\x1b[0m%s', 'Total tests executed - ', totalCount, ' PASS - ', succeeded, ' FAIL -', totalCount - succeeded);
                callback("Test completed for one set.")
                return; // No more execution
            }
            if (index < modules.length - 1) {
                _executeTest(modules, index + 1, callback);
            } else {
                _executeTest(modules, 0, callback);
            }
        });
    })();

};

function _testRequireLogic() {
    console.log("Memory usage before require!!");
    var UserModel = require('../model/usermodel');
    helpers.printMemoryUsage();
    for (var i = 0; i < MAX_COUNT; i++) {
        // var StoreManager = require('../data/storemanager').StoreManager;
        var help = require('../lib/helpers');
    }
    console.log("Memory usage after requires.");
    helpers.printMemoryUsage();

}

function executeParallel() {

    const cluster = require('cluster');
    const numCPUs = require('os').cpus().length;

    if (cluster.isMaster) {

        let workers = [];

        cluster.on('message', (worker, message, handle) => {
            console.log(`Received ${message} from worker - ${worker.process.pid}`)
            worker.send(`Acknowledged from server - ${process.pid}`, handle);
        });

        // Fork workers.
        for (let i = 0; i < numCPUs; i++) {
            workers.push(cluster.fork());
        }

    } else {

        let count = 0;
        process.on('message', function (message) {
            console.log(`Received message from server - ${message} `);
            setTimeout(() => {
                count++;
                process.send(`Sending message no - ${count}`);
            }, 10000)
        });

        process.send("Started worker process.");

    }
}

function runCameraParallelServer() {

    const cluster = require('cluster');
    const numCPUs = require('os').cpus().length;
    const http = require('http');

    const timeOut = 100;

    if (cluster.isMaster) {

        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        });

    } else {

        console.log("Child process started!");
        // Workers can share any TCP connection
        // In this case it is an HTTP server
        var server = http.createServer((req, res) => {}).listen(1337, '127.0.0.1');

        server.on('request', function handleRequest(req, resp) {

            setTimeout(() => {
                resp.end("It is time to send some response. Holla!!!");

            }, timeOut);


        });
        server.setMaxListeners(0);

    }

}

function runCameraParallel() {

    const cluster = require('cluster');
    const numCPUs = require('os').cpus().length;
    const http = require('http');

    const timeOut = 50;

    if (cluster.isMaster) {

        var requests = new Queue();
        var requestMap = {};
        var busyWorkers = [];
        var freeWorkers = [];
        var count = 0;
        var responded = 0;

        for (let i = 0; i < numCPUs; i++) {
            freeWorkers.push(cluster.fork());
        }

        var server = http.createServer((req, res) => {
            // res.end('Hello World\n');
        }).listen(1337, '127.0.0.1');

        function performJob() {
            if (freeWorkers.length > 0 && requests.isEmpty() == false) {
                var worker = freeWorkers.pop();
                var data = requests.dequeue();

                busyWorkers.push(worker);
                worker.send(data);
            }
        }


        server.on('request', function handleRequest(req, res) {

            if (numCPUs == 1) {
                setTimeout(() => {
                    res.end('Ending!');
                }, timeOut);
            } else {
                // Find a free worker if available, add to queue otherwise.
                count++;
                requestMap[count] = {
                    'req': req,
                    'resp': res
                };

                requests.enqueue(count);
                process.nextTick(performJob);
            }

        });

        server.setMaxListeners(0);

        // When a notification received from worker.
        cluster.on('message', (worker, message, handle) => {

            var req = requestMap[message];
            requestMap[message] = null;

            req['resp'].end("Request processed successfully!!!");

            busyWorkers.splice(busyWorkers.indexOf(worker), 1);
            freeWorkers.push(worker);
            process.nextTick(performJob);

            req = null;

            responded++;

        });

    } else {

        process.on('message', function (message) {

            setTimeout(() => {
                //console.log(`${message} processed from ${process.pid}`);
                process.send(message);
            }, timeOut);

        });

    }

}

function runSingleServer() {

    const http = require('http');

    // Workers can share any TCP connection
    // In this case it is an HTTP server
    var server = http.createServer((req, res) => {
        // res.end('Hello World\n');
    }).listen(1337, '127.0.0.1');

    server.on('request', function handleRequest(req, resp) {

        insertToDb(() => {
            resp.end("It is time to send some response. Holla!!!");
        });


    });
    server.setMaxListeners(0);

    console.log('Server running at http://127.0.0.1:1337/. Process PID: ', process.pid);
}

function runServer() {

    const http = require('http');
    const cluster = require('cluster');
    const numCPUs = require('os').cpus().length;

    var count = 0;
    var timeMap = {};

    if (cluster.isMaster) {
        console.log(`Master ${process.pid} is running`);

        // Fork workers.
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        });
    } else {

        // Workers can share any TCP connection
        // In this case it is an HTTP server
        var server = http.createServer((req, res) => {
            // res.end('Hello World\n');
        }).listen(1337, '127.0.0.1');

        server.on('request', function handleRequest(req, resp) {

            insertToDb(() => {
                resp.end(fileContent);
            });


        });
        server.setMaxListeners(0);

        console.log('Server running at http://127.0.0.1:1337/. Process PID: ', process.pid);
    }
}


function insertToDb(callback) {
    let UserModel = require("../model/usermodel");
    let StoreManager = require('../framework/managers/storemanager').StoreManager;


    let userconfig = {
        "name": "Ajeesh B Nair",
        "age": 35,
        "place": "Kalanjoor",
        "content": fileContent
    };

    var instance = new UserModel(userconfig);
    var store = StoreManager.getInstance().get(instance.modelName());
    instance.store = store;

    instance.on('add', (obj) => {
        instance.cleanup();
        callback(null, obj);
    });
    instance.on('error', (message) => {
        instance.cleanup();
        callback(message);
    });
    instance.save();
    // UserModel = null;
}

function sampeNodeClustor() {
    const cluster = require('cluster');
    const http = require('http');
    const numCPUs = 1; // require('os').cpus().length;

    if (cluster.isMaster) {
        console.log(`Master ${process.pid} is running`);

        // Fork workers.
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        });
    } else {
        // Workers can share any TCP connection
        // In this case it is an HTTP server
        http.createServer((req, res) => {
            res.writeHead(200);
            res.end('hello world\n');
        }).listen(8000);

        console.log(`Worker ${process.pid} started`);
    }
}

function init() {

    // console.log('BEGIN test execution.')
    //  _testRequireLogic();


    // runSingleServer();
    runServer(); // Run some server and simulate memory leak.

    // executeParallel();

    // sampeNodeClustor();

    // runCameraParallel();
    // runCameraParallelServer();


    // Get the Object's methods (functions):
    // function getMethods(obj) {
    //     return Object.keys(obj)
    //         .filter((key) => typeof obj[key] === 'function')
    //         .map((key) => obj[key]);
    // }

    // let methods = getMethods(modules);

    // co(function* () {
    //     var manager = DBManager.getInstance();
    //     let db = yield manager.configure(config);
    //     if (!db) {
    //         callback(new Error('Internal server error. Could not connect to DB driver.'));
    //         return;
    //     }

    //     let dbinstance = yield manager.openDatabase();
    //     console.log(dbinstance);

    //     if (methods.length > 0) {
    //         let startTime = Date.now();
    //         // NodeJS.global.gc(); // Perform garbage collection prior doing this.
    //         helpers.printMemoryUsage();

    //         _executeTest(methods, 0, () => {
    //             console.log("test completed.");
    //             let endTime = Date.now();
    //             let difference = endTime - startTime;
    //             console.error("Total time took to execute test - " + difference + " msec.");

    //             manager = null;
    //             db = null;
    //             dbinstance = null;
    //             methods = null;
    //             startTime = null;
    //             endTime = null;

    //             //  NodeJS.global.gc(); // Perform garbage collection prior doing this.
    //             helpers.printMemoryUsage();



    //         });
    //     }

    // }).catch(err => {
    //     console.log(err);
    // });
};

container.init = init;
module.exports = container;