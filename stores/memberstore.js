"using strict";

let BaseStore = require("../framework/core/db/store").Store;

let Store = class MemberStore extends BaseStore {

    constructor() {
        super();
        this._storeName = "member";
        this._supportedModel = "member";
    }

};

exports.Store = Store;