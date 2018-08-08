/**
 * API handlers for application.
 * All generic API handling request shall be added to this file.
 */

 // NOTE - There shall not be any folders within this folder, otherwise, the import might cause issues.

 // Requires for the module.
const helpers = require('../lib/helpers');

// Load all handlers in this folder.
(() => {
    helpers.loadModules("./api", exports,true);
}
)();

// If a particular API is not found, an error shall be sent back to the client
// Error shall be in JSON format and client shall use this error to optimize their API usage.
exports['NotFound'] = function(data,callback){
    

};

