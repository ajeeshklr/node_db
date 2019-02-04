# User Manual

The framework code run server in a cluster. This support basic crud operations for few sql and no-sql databases.

This is released under MIT license. 

## Dependencies
* path
* autocannon ( for load testing )
* bson
* co
* http
* mongodb
* mongodb-core ( If not getting installed automatically )
* mysql
* random-words - For load testing

## Modlues and files

### app.json
    Contain configuration for the application. 
    Define stores, models and application specific configurations here. Also, define the module path which shall be inited once app is launched.

    There shall be a corresponding entry in config.js for each entries under config in app.json. If no config is provided as commandline argument, then the default config will be selected and be used for the environment configs.

### app.js
    Contain launch code and server initialization logic. Modify here if you want to control the total number of processor for the clustor.

    Warning - Don't modify the launch code. Modify only the total number of CPUs.

### config.js
    Contains environment configuration and logic for parsing configurations.

## How to use

---
*Following guideline are common for all configurations in app.json*
*   Use the correct config from app.json. Update the default env with the correct config. For ex - the below config uses "staging" configuration. Also, this will use "staging" environment from config.js

```
defaults": 
{
    "env": "staging"
}
```
* If your executable is in a different folder, provide the relative path of the launch module in the js config as shown below.
```
"js": {
        "path": "./app.js"
    }

```
* Under databse configuration, db, type and path should not be changed. This fields will be used by framework to identify the underlying db driver.

* Make sure to provide a valid basepath and runnable for your configuration. The js file should have init() function defined. If basepath and js file is not mentioned, then it will default to 'app.js'. 

#### With mongo db.
* Provide the correct hostname:port number for the mongod server.
* start mongod with appropriate dbpath.
* run app.js by using *node app.js*
* Execute autocannon - Make sure to pass the correct url, port in autocannon configuration. Match it with the configuration in config.js.

#### With sqlite_cipher
* db_path - Provide where you want the sqlite db to be created.
* module - provide path to sqlite3 npm package if it is installed in a different location.
* Start app.js using 'node app.js' command.
* Execute autocannon or load_runner to test code.

To use the framework, define models and stores and provide the implementation accordingly. 

#### With mysql.
* Start mysql server in the machine.
* Start app.js and execute required tests.

## Using autocannon for automation.

*./test folder contain test code. As of now, use only load_runner.*


