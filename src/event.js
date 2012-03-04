/**
 * Datastore Event Management
 *
 * Requires live datastore.
 */
/*global flock */

flock.event = (function (core, live) {
    var ERROR_NONTRAVERSABLE = "Non-traversable datastore node.",
        ERROR_HANDLERNOTFUNCTION = "Handler is not a function.",
        self;

    self = {
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
                    throw "flock.event.subscribe: " + ERROR_HANDLERNOTFUNCTION;
                }
            } else {
                throw "flock.event.subscribe: " + ERROR_NONTRAVERSABLE;
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
                throw "flock.event.unsubscribe: " + ERROR_NONTRAVERSABLE;
            }
        },

        /**
         * Triggers event on specified datastore path.
         * @param node {object} Datastore node.
         * @param eventName {string} Name of event to subscribe to.
         * @param data {object} Custom data to be passed to event handlers.
         * @throws {string} On untraversable node.
         */
        trigger: function (node, eventName, data) {
            var meta = node[live.META],
                handlers,
                i;

            if (typeof meta === 'object') {
                handlers = (meta.handlers || {})[eventName];
                if (typeof handlers === 'object') {
                    // calling handlers for event
                    for (i = 0; i < handlers.length; i++) {
                        handlers[i](node, data);
                    }
                }

                // bubbling event up the datastore tree
                if (typeof meta.parent === 'object') {
                    self.trigger(meta.parent, eventName, data);
                }
            } else {
                throw "flock.event.trigger: " + ERROR_NONTRAVERSABLE;
            }
        }
    };

    return self;
}(flock.core,
    flock.live));
