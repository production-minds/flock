/**
 * Datastore Event Management
 *
 * Requires live datastore.
 */
/*global flock */

flock.event = (function (core, utils, live) {
    var errors, events, self;

    errors = {
        ERROR_HANDLERNOTFUNCTION: "Handler is not a function."
    };

    events = {
        EVENT_CHANGE: 'change',
        EVENT_ADD: 'add',
        EVENT_REMOVE: 'remove'
    };

    self = {
        //////////////////////////////
        // Control

        /**
         * Subscribes to datastore event.
         * @param node {object} Datastore node.
         * @param eventName {string} Name of event to subscribe to.
         * @param handler {function} Event handler.
         * @throws {string}
         */
        subscribe: function (node, eventName, handler) {
            var meta = node[live.META],
                handlers;

            if (typeof meta === 'object') {
                if (typeof handler === 'function') {
                    // making sure handler containers exists
                    if (!meta.hasOwnProperty('handlers')) {
                        meta.handlers = {};
                    }
                    handlers = meta.handlers;
                    if (!handlers.hasOwnProperty(eventName)) {
                        handlers[eventName] = [];
                    }

                    // adding handler to event
                    handlers[eventName].push(handler);
                } else {
                    throw "flock.event.subscribe: " + errors.ERROR_HANDLERNOTFUNCTION;
                }
            } else {
                throw "flock.event.subscribe: " + live.ERROR_NONTRAVERSABLE;
            }
        },

        /**
         * Unsubscribes from datastore event.
         * @param node {object} Datastore node.
         * @param [eventName] {string} Name of event to subscribe to.
         * @param [handler] {function} Event handler.
         * @throws {string} On untraversable node.
         */
        unsubscribe: function (node, eventName, handler) {
            var meta = node[live.META],
                handlers,
                i;

            if (typeof meta === 'object') {
                handlers = meta.handlers;
                if (typeof handlers === 'object') {
                    if (typeof handler === 'function') {
                        // removing specified handler from among handlers
                        if (typeof handlers === 'object' &&
                            typeof eventName === 'string'
                            ) {
                            handlers = handlers[eventName];
                            for (i = 0; i < handlers.length; i++) {
                                if (handlers[i] === handler) {
                                    handlers.splice(i, 1);
                                    break;
                                }
                            }
                        }
                    } else if (typeof eventName === 'string') {
                        // removing all handlers for a specific event
                        if (typeof handlers === 'object' &&
                            handlers.hasOwnProperty(eventName)
                            ) {
                            delete handlers[eventName];
                        }
                    } else {
                        // removing all handlers altogether
                        delete meta.handlers;
                    }
                }
            } else {
                throw "flock.event.unsubscribe: " + live.ERROR_NONTRAVERSABLE;
            }
        },

        /**
         * Triggers event on specified datastore path.
         * @param node {object} Datastore node.
         * @param eventName {string} Name of event to subscribe to.
         * @param [data] {object} Custom data to be passed to event handlers.
         * @param [target] {object} Custom target node.
         * @throws {string} On untraversable node.
         */
        trigger: function (node, eventName, data, target) {
            target = target || node;

            var meta = node[live.META],
                event,
                handlers,
                i;

            if (typeof meta === 'object') {
                handlers = (meta.handlers || {})[eventName];
                if (typeof handlers === 'object') {
                    // calling handlers for event
                    for (i = 0; i < handlers.length; i++) {
                        event = {
                            name: eventName,
                            target: target
                        };
                        if (handlers[i](event, data) === false) {
                            // if handler returns false (not falsey), bubbling stops
                            return;
                        }
                    }
                }

                // bubbling event up the datastore tree
                if (typeof meta.parent === 'object') {
                    self.trigger(meta.parent, eventName, data, target);
                }
            } else {
                throw "flock.event.trigger: " + live.ERROR_NONTRAVERSABLE;
            }
        },

        /**
         * Sets a singe value on the given datastore path and triggers an event.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         * @param value {object} Value to set on path
         * @param [data] {object} Custom data to be passed to event handler.
         * @param [trigger] {boolean} Whether to trigger. Default: true.
         */
        set: function (node, path, value, data, trigger) {
            // storing 'before' node
            var before = core.get(node, path),
                after,
                parent;

            // setting value
            parent = live.set(node, path, value);

            // acquiring 'after' node
            after = core.get(node, path);

            // triggering event
            if (trigger !== false) {
                self.trigger(
                    parent,
                    typeof before === 'undefined' ?
                        events.EVENT_ADD :
                        events.EVENT_CHANGE,
                    {
                        before: before,
                        after: after,
                        name: path[path.length - 1],
                        data: data
                    }
                );
            }

            return parent;
        },

        /**
         * Removes a single node from the datastore and triggers an event.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         * @param [trigger] {boolean} Whether to trigger. Default: true.
         */
        unset: function (node, path, trigger) {
            // storing 'before' node
            var before = core.get(node, path),
                parent;

            if (typeof before !== 'undefined') {
                parent = core.unset(node, path);

                // triggering event
                if (trigger !== false) {
                    self.trigger(
                        parent,
                        events.EVENT_REMOVE,
                        {
                            before: before
                        }
                    );
                }
            }

            return parent;
        }
    };

    // delegating errors
    utils.delegate(self, events);
    utils.delegate(self, errors);

    return self;
}(flock.core,
    flock.utils,
    flock.live));
