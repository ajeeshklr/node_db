"using strict";

let BaseStore = require("../framework/core/db/store").Store;

let Store = class UserStore extends BaseStore {

    constructor() {
        super();
        this._storeName = "user";
        this._supportedModel = "user";
    }

};

exports.Store = Store;