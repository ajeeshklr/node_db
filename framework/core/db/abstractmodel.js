"use strict";
/**
 * Default base model class, which shall contain details regarding data models used in the application.
 */

// const eventMixin = require('../mixins/mixins').event;

let AbstractModel = class AbstractModel {

    constructor(store) {
        this.config = {
            model: '',
            fields: {}
        };
        this._isDirty = false;
        this._modified = {};
        this._modifiedFields = [];
        this.store = store;

        if (null == store) {
            throw ('store instance received is invalid or null. Please pass a valid store instance.');
        }
    };


    modelName() {
        return this.config.model;
    };
    get(key) {
        if (this._modifiedFields.includes(key) || Object.keys(this.config.fields).includes(key)) {
            return this._modifiedFields.includes(key) ?
                this._modified[key] :
                this.config.fields[key];
        }
    };
    set(key, value) {
        if (this._init) {
            if (Object.keys(this.config.fields).includes(key)) {
                this.config.fields[key] = value;
            } else {
                throw new Error('Invalid field name specified. Field name - ' + key);
            }
        } else {
            this._isDirty = this._isDirty || true;
            if (false == this._modifiedFields.includes(key)) {
                this._modifiedFields.push(key);
            }

            this._modified[key] = value;
        }
    };


    getModified() {
        return this._isDirty ? this._modified : {};
    };

    /**
     * Use this API to set initial values for the field configurations.
     * @param {Object} values Configuration values or field values received for the first time. Dirty flag won't be set when this is called.
     */
    init(values) {

        if (!values) {
            return;
        }

        var _dirty = this._isDirty;
        this.beginInit();
        Object.keys(values).forEach(key => {
            if (Object.keys(this.config.fields).includes(key)) { // If a valid field then set the new value.
                this.set(key, values[key]);
            } else {
                console.log('Invalid field received ' + key);
            }
        });

        this.endInit();
        this._isDirty = _dirty;

    };

    /**
     * Commit all changes as the save/update operation is successful.
     */
    __commit() {

        if (this._modifiedFields.length > 0) {
            this._modifiedFields.forEach(element => {
                this.config.fields[element] = this._modified[element];
            });
        }
    };

    /**
     * Save all changes to store.
     */
    save(callback) {
        // See if the model is dirty, if so, save to file system.
        if (this._isDirty || !this.getId()) {
            if (!this.getId()) {
                this.store.add(this, callback);
            } else {

                let updateConfig = {
                    "collection": this.modelName(),
                    "set": this.getUpdatorConfig(),
                    "filter": {}
                };
                updateConfig.filter[this.getIdField()] = this.getId();
                this.store.update(this, updateConfig, callback);
            }
        }
    };

    discard() {
        this._modifiedFields = [];
        this._modified = {};
        this._isDirty = false;
    };

    getIdField() {
        return "_id";
    };
    getId() {
        return this[this.getIdField()];
    };
    setId(id) {
        if (typeof (id) == "string") {
            this[this.getIdField()] = id.length > 0 ? id : null;
        } else {
            this[this.getIdField()] = id;
        }
    };

    getFields() {
        if (this.config.fields) {
            return Object.keys(this.config.fields);
        }

        return [];
    };

    toJSON() {
        return this.config.fields;
    }

    getUpdatorConfig() {
        let updatedConfig = [];
        if (this._modifiedFields.length > 0) {
            this._modifiedFields.forEach(element => {
                let updated = {};
                updated['config.fields.' + element] = this._modified[element];
                updatedConfig.push(updated);
            });
        }
        return updatedConfig;
    };
    beginInit() {
        this._init = true;

    };
    endInit() {
        this._init = false;
    }

};

// Object.assign(AbstractModel.prototype, eventMixin);
Object.freeze(AbstractModel);

exports.AbstractModel = AbstractModel;