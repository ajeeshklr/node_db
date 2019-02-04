/**
 * Controller file to handle all miscellanious requests.
 * This shall be used to handle requeststs like, contact us, about etc.
 */

const helpers = require('../lib/helpers');
const locale = require('../locale');

let container = {};

container.contact = function (data, callback) {
    // Request for index page. Let's serve index page.
    // Reject any request that isn't a GET or POST

    // Prepare data for interpolation
    let templateData = {
        'head.title': locale.strings.head_title_default,
        'head.description': locale.strings.head_description_default,
        'body.class': 'index',
        'head.keywords': locale.strings.head_keywords_default, // Add meta keyword here for SEO.
        'contact.title': locale.strings.contact_title,
        'contact.subtitle': locale.strings.contact_subtitle,
        'contact.display': data.method == 'post' ? 'block' : 'none',
        'contact.thanks': locale.strings.contact_thanks
    };
    if (data.method == 'get' || data.method == 'post') {

        // perform post related operation incase if it is post.
        helpers.retrieveView(data, 'contact', templateData, callback);
    } else {
        callback(405, undefined, 'html');
    }
};

module.exports = container;