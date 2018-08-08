/**
 * Index file for the main module.
 * This shall load all modules under this main folder and shall call the init of each modules.
 */

 'use strict';
 
 //#region Module requires

 const helpers = require('./../lib/helpers');
 const server = require('./server');

 //#endregion

 // Container for main module.
 
 const main  = {};

main.init = function () {
    server.init();
};


module.exports = main;