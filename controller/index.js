/**
 * Controllers for application. All generic UI controllers shall be added to this file.
 */

//#region Includes for controllers.
const helpers = require('../lib/helpers');
const locale = require('../locale');

//#endregion

// Load all handlers
(() => {
    helpers.loadModules("./controller", exports);
}
)();


// Initialize default UI handler. 
// This shall be invoked if someone type www.yoursite.com
exports[''] = function(data,callback){
    // Request for index page. Let's serve index page.
    // Reject any request that isn't a GET
    if (data.method == 'get') {
        // Prepare data for interpolation
        let templateData = {
            'head.title': locale.strings.head_title_default,
            'head.description': locale.strings.head_description_default,
            'body.class': 'index',
            'head.keywords' :locale.strings.head_keywords_default // Add meta keyword here for SEO.
        };
        helpers.retrieveView(data, 'index', templateData, callback);
    } else {
        callback(405, undefined, 'html');
    }

};

// 404 UI handler
exports['NotFound'] = function(data,callback){
    // Request for index page. Let's serve index page.
    // Reject any request that isn't a GET
    if (data.method == 'get') {
        // Prepare data for interpolation
        let templateData = {
            'head.title': locale.strings.head_title_default,
            'head.description': locale.strings.head_description_default,
            'body.class': 'index',
            'head.keywords': locale.strings.head_keywords_default // Add meta keyword here for SEO.
        };
        // Read in a template as a string
        helpers.getTemplate('_404', templateData, function (err, str) {
            if (!err && str) {
                // Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function (err, str) {
                    if (!err && str) {
                        // Return that page as HTML
                        callback(404, str, 'html');
                    } else {
                        callback(500, undefined, 'html');
                    }
                });
            } else {
                callback(500, undefined, 'html');
            }
        });
    } else {
        callback(500, undefined, 'html');
    }
};

// UI request handler to read all public resources.
exports['public'] = function(data,callback){
    // Reject any request that isn't a GET
    if (data.method == 'get') {
        // Get the filename being requested
        var trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
        if (trimmedAssetName.length > 0) {
            // Read in the asset's data
            helpers.getStaticAsset(trimmedAssetName, function (err, data) {
                if (!err && data) {

                    // Determine the content type (default to plain text)
                    var contentType = 'plain';

                    if (trimmedAssetName.indexOf('.css') > -1) {
                        contentType = 'css';
                    }else if (trimmedAssetName.indexOf('.png') > -1) {
                        contentType = 'png';
                    } else if (trimmedAssetName.indexOf('.jpg') > -1) {
                        contentType = 'jpg';
                    } else if (trimmedAssetName.indexOf('.ico') > -1) {
                        contentType = 'favicon';
                    } else if(trimmedAssetName.indexOf('.js') > -1){
                        contentType = "javascript";
                    }

                    // Callback the data
                    callback(200, data, contentType);
                } else {
                    callback(404);
                }
            });
        } else {
            callback(404);
        }

    } else {
        callback(405);
    }
};
