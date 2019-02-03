/**
 * A regular mixin file, which could be used in other classes or files.
 * Doesn't really need to for ECMA6 standards.
 */

let MixinContainer = {};

let eventMixin = {

    /**
     * Subscribe to event, usage:
     *  object.on('select', function(item) { ... }
     */
    on(eventName, handler) {
        if (!this._eventHandlers) this._eventHandlers = {};
        if (!this._eventHandlers[eventName]) {
            this._eventHandlers[eventName] = [];
        }
        this._eventHandlers[eventName].push(handler);
    },

    /**
     * Cancel the subscription, usage:
     * object.off('select', handler)
     */
    off(eventName, handler) {
        let handlers = this._eventHandlers && this._eventHandlers[eventName];
        if (!handlers) return;
        for (let i = 0; i < handlers.length; i++) {
            if (handlers[i] === handler) {
                handlers.splice(i--, 1);
            }
        }
    },

    /**
     * Generate the event and attach the data to it
     * object.fire('select', data1, data2);
     */
    fire(eventName, ...args) {
        if (!this._eventHandlers || !this._eventHandlers[eventName]) {
            return; // no handlers for that event name
        }

        let handlers = this._eventHandlers;
        // call the handlers
        handlers[eventName].forEach(handler => handler.apply(this, args));
    },
    cleanup() {
        if (this._eventHandlers) {
            delete this._eventHandlers;
        }
    }
};

MixinContainer.event = eventMixin;

module.exports = MixinContainer;