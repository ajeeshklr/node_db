/**
 * Main application file. Once application is getting started, it shall execute this file.
 * In some application, it might be index.js
 */

// --------------------------------------  Framework code . Do not remove. ----------------------------------
let config = require('./config');

console.log(config); // Let's see what does come out of it.

launch = function () {
    let framework = require('./framework/main');
    framework.init(config).then((res) => {

        console.log(config.getConfig());
        let runnable = require(config.getConfig().basePath + config.getConfig().js);
        runnable.init();
    }).catch(err => {
        console.error(err);
    });
}

function runParallel() {

    const cluster = require('cluster');
    const numCPUs = require('os').cpus().length;

    if (cluster.isMaster) {

        if (numCPUs == 1) {
            launch();

        } else {
            for (let i = 0; i < numCPUs; i++) {
                cluster.fork();
            }

            cluster.on('exit', (worker, code, signal) => {
                console.error(`worker ${worker.process.pid} died`);
            });
        }


    } else {
        console.error("Child process started!");
        launch();
    }

}

runParallel();

// ------------------------------------------- End  Framework code  -----------------------------------------