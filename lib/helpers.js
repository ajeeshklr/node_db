'use strict';

/*
* Helper functions for the application. Use this file to define any helpers which are used throughout the application.
* Helpers shall not reference any modules within the application, it can refer modules provided by Node.
* @Author - Ajeesh B Nair
* @Date - 28 March 2018
*/

// Container for Helpers
const fs = require('fs');
const path = require('path');
const queryString = require('querystring');
const config = require('./../config');
const helpers = {};

/**
*  @function getAllSourceFiles Synchronous API to read all source files
*  @param {string} dir base directory to find files from.
*  @param {boolean} includePrivatePath to include private folders (folders prefixed with ".")
*  @author - Ajeesh B Nair
*  @return {string[] } - An array of file names.
*/
const getAllSourceFiles = (dir, includePrivatePath) =>
    fs.readdirSync(dir).reduce((files, file) => {
        const name = path.join(dir, file);
        const isDirectory = fs.statSync(name).isDirectory();
        if (isDirectory) {
            if (name.startsWith('.') && !includePrivatePath) {
                return files;
            }
        } else if ('.js' != path.extname(name)) {
            return files;
        }
        return isDirectory ? [...files, ...getAllSourceFiles(name, includePrivatePath)] : [...files, name];
    }, []);


helpers.loadModules = function (baseDirectory, modExports, bIncludeDirTree = false, bIncludeKeyValPair = false) {

    let files = getAllSourceFiles(baseDirectory, false);

    files.forEach(function (fileName) {
        let modules = require(path.resolve(fileName));
        let relativeDirectory = path.relative(baseDirectory, path.dirname(fileName));
        // console.log('File Name :', fileName);

        // Check if one need to include the drectoryTree
        if (bIncludeDirTree) {
            if (relativeDirectory.length == 0) {
                relativeDirectory = path.join(path.dirname(fileName), path.basename(fileName, '.js'));
            }
        }

        // console.log('Relative Path - ' + relativeDirectory);
        for (var i in modules) {
            //  console.log('Key ' + JSON.stringify( i ) + ' Value : '  + modules[i]);
            let constructedPath = relativeDirectory.length > 0 ? (i.length > 0 ? relativeDirectory + '/' + i : relativeDirectory) : i;
            modExports[constructedPath] = modules[i];

            if (bIncludeKeyValPair) {
                // For testing modules.
                // This will add key, value parameters to the methods in each file.
                modExports[constructedPath].key = constructedPath;
                modExports[constructedPath].value = modules[i];  // Can be used as key/value pair also.
            }

        }

    });

};


helpers.getAllSourceFiles = getAllSourceFiles;

//#region Helper routines for reading templates and string interpolation

/**
 * 
 * @param {string} templateName Name of the template, which needs to be loaded.
 * @param {object} data Data object, which has key-value pairs, which needs to be replaced ( has configs. )
 * @param {function} callback The callback function, which will receive the loaded template file. 
 */
helpers.getTemplate = function (templateName, data, callback) {

    templateName = typeof (templateName) == 'string' && templateName.trim().length > 0 ? templateName : false;
    data = typeof (data) == 'object' && data != null ? data : {};

    // Read the template first. 
    // If the template starts with '_', then it shall be read from .templates folder, otherwise, it shall be read from 
    // view folder.

    if (templateName) {
        // Construct the template path.
        let templateFolderName = templateName.startsWith('_') ? '.templates' : 'view';
        let templateDir = path.join(__dirname, "../" + templateFolderName + '/');
        let templatePath = templateDir + templateName + '.html';

        // Read the content of the file
        fs.readFile(templatePath, 'utf8', function (err, str) {
            if (!err && str && str.length > 0) {

                let finalString = helpers.interpolate(str, data);
                callback(false, finalString);

            } else {
                callback("Error - Could not load the template file - " + templateName);
            }

        });
    } else {
        callback('Error: No such valid template name - ' + templateName);
    }
};

/**
 * 
 * @param {string} str Template string to which header and footer templates needs to be added.
 * @param {object} data Configuration data object, which shall be used to replace the configs in templates.
 * @param {function} callback Callback function, which shall be called once template is being added.
 */
helpers.addUniversalTemplates = function (str, data, callback) {
    str = typeof (str) == 'string' && str.length > 0 ? str : false;
    data = typeof (data) == 'object' && data != null ? data : {};

    helpers.getTemplate('_header', data, function (err, headerString) {

        if (!err && typeof (headerString) == 'string' && headerString.length > 0) {
            helpers.getTemplate('_footer', data, function (err, footerString) {

                if (!err && typeof (footerString) == 'string' && footerString.length > 0) {
                    callback(false, headerString + str + footerString);
                } else {
                    callback('Error : The footer template which we tried to load was not valid - _footer');
                }

            });
        } else {
            callback("Error: The header template which we tried to load was not valid - _header");
        }

    });
};

helpers.retrieveView = function (data, templateName, templateData, callback) {
    // Read in a template as a string
    helpers.getTemplate(templateName, templateData, function (err, str) {
        if (!err && str) {
            // Add the universal header and footer
            helpers.addUniversalTemplates(str, templateData, function (err, str) {
                if (!err && str) {
                    // Return that page as HTML
                    callback(200, str, 'html');
                } else {
                    callback(500, undefined, 'html');
                }
            });
        } else {
            callback(500, undefined, 'html');
        }
    });
};

helpers.interpolate = function (str, data) {
    str = typeof (str) == "string" && str.length > 0 ? str : false;
    data = typeof (data) == 'object' && data != null ? data : {};
    // Add the templateGlobals to the data object, prepending their key name with "global."
    for (var keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.' + keyName] = config.templateGlobals[keyName]
        }
    }
    // For each key in the data object, insert its value into the string at the corresponding placeholder
    for (var key in data) {
        if (data.hasOwnProperty(key) && typeof (data[key] == 'string')) {
            var replace = data[key];
            var find = '{' + key + '}';
            str = str.replace(find, replace);
        }
    }
    return str;

};

// Get the contents of a static (public) asset
helpers.getStaticAsset = function (fileName, callback) {
    fileName = typeof (fileName) == 'string' && fileName.length > 0 ? fileName : false;
    if (fileName) {
        var publicDir = path.join(__dirname, '/../public/');
        fs.readFile(publicDir + fileName, function (err, data) {
            if (!err && data) {
                callback(false, data);
            } else {
                callback('No file could be found');
            }
        });
    } else {
        callback('A valid file name was not specified');
    }
};

//#endregion

//#region Helper routines for json parsing

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {

    if (typeof (str) == 'string' && str.length == 0) {
        return {};
    }
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (e) {

        // If failed, see if it is a query string
        try {
            return queryString.parse(str, null, null, null);
        } catch (ex) {

        }
        return {};
    }
};

//#endregion

module.exports = helpers;
