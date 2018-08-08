"using strict";

let BaseStore = require("../data/store").Store;

let Store = class UserStore extends BaseStore{

    constructor(){
        super();
        this._storeName = "user";
        this._supportedModel = "user";
    }

};

exports.Store = Store;