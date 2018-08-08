/**
 * API library for user registration, authentication and login.
 * This might need to make use of other API libraries as well.
 * Caution should be taken not to throw exceptions while executing any of the API functions.
 */

 let mogodb  = require('mongodb').MongoClient;

 let container = {};    // Container to hold all the user APIs
 let supportedMethods = ['put','get','delete','update'];

 // Default handler for fetching all users.
 // This API shall be used by portal admin only.
 // Prior fetching user details, user privilages shall be valdated.
 container[''] = function(data,callback){

    // Check for authentication ( using tokens ) and privilages ( from the admin portal.)

    // This is an admin request.
    // data.isAdmin shall be replaced with proper queries.
    if(data && data.isAdmin){

        // Fetch all users. An ajax request might be used at this moment. For sake of simplicity, let us fetch all data at once and send back to client.

    }


 }

 container.register = function(data,callback){

    // Perform sanity checks once.

 };

 module.exports = container;