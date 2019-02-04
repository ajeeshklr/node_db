/**
 * API library for user registration, authentication and login.
 * This might need to make use of other API libraries as well.
 * Caution should be taken not to throw exceptions while executing any of the API functions.
 */


let container = {}; // Container to hold all the user APIs
let supportedMethods = ['put', 'get', 'delete', 'update'];
const StoreManager = require('../framework/managers/storemanager').StoreManager;

// Default handler for fetching all users.
// This API shall be used by portal admin only.
// Prior fetching user details, user privilages shall be valdated.
container[''] = function (data, callback) {

   // Check for authentication ( using tokens ) and privilages ( from the admin portal.)

   // This is an admin request.
   // data.isAdmin shall be replaced with proper queries.
   if (data && data.isAdmin) {

      // Fetch all users. An ajax request might be used at this moment. For sake of simplicity, let us fetch all data at once and send back to client.

   }


}

container.register = function (data, callback) {

   let manager = require('../framework/core/db/modelmanager').getInstance();
   let m = manager.get('user');
   let user = new m(data.payload, StoreManager.getInstance().get('user'));

   user.save().then(res => {
      if (callback) {
         callback(200);
      }
   }).catch((err) => {
      console.error(err);
      callback(500)
   });
   // Perform sanity checks once.


};

module.exports = container;