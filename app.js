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
    });
}

launch();

// ------------------------------------------- End  Framework code  -----------------------------------------