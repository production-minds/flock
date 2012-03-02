/**
 * Datastore Event Management
 *
 * Requires live datastore.
 */
var flock = flock || {};

flock.event = (function (basic, live) {
    var self;

    self = {
        /**
         * Subscribes to datastore event.
         * @param root {object} Datastore root.
         * @param path {Array} Datastore path for subscription.
         * @param eventName {string} Name of event to subscribe to.
         * @param handler {function} Event handler.
         */
        subscribe: function (root, path, eventName, handler) {
            var node = basic.get(root, path),
                meta, handlers;

            if (typeof node === 'object' &&
                typeof handler === 'function'
            ) {
                // making sure handler containers exists
                meta = node[live.META];
                if (!meta.hasOwnProperty('handlers')) {
                    meta.handlers = {};
                }
                handlers = meta.handlers;
                if (!handlers.hasOwnProperty(eventName)) {
                    handlers[eventName] = [];
                }

                // adding handler to event
                handlers[eventName].push(handler);
            }

            return self;
        },

        /**
         * Unsubscribes from datastore event.
         * @param root {object} Datastore root.
         * @param path {Array} Datastore path for subscription.
         * @param eventName {string} Name of event to subscribe to.
         * @param handler {function} Event handler.
         */
        unsubscribe: function (root, path, eventName, handler) {
            var meta = basic.get(root, path.concat([live.META])),
                handlers = basic.get(root, path.concat([live.META, 'handlers'])),
                i;

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

                return self;
            }
        },

        /**
         * Triggers event on specified datastore path.
         * @param root {object} Datastore root.
         * @param path {Array} Datastore path for subscription.
         * @param eventName {string} Name of event to subscribe to.
         * @param data [object} Custom data to be passed to event handlers.
         */
        trigger: function (root, path, eventName, data) {
            var handlers = basic.get(root, path.concat([live.META, 'handlers', eventName])),
                i;

            if (typeof handlers === 'object') {
                // calling handlers for event
                for (i = 0; i < handlers.length; i++) {
                    handlers[i](root, path, data);
                }

                // bubbling event up the datastore tree
                if (path.length > 1) {
                    path.pop();
                    self.trigger(root, path, eventName, data);
                }
            }

            return self;
        }
    };

    return self;
}(flock.core,
    flock.live));
