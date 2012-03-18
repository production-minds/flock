/**
 * Datastore Event Management
 *
 * Requires live datastore.
 */
/*global flock */

flock.event = (function (u_single, u_path, u_utils, u_live) {
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
            var meta = node[u_live.metaKey()],
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
                throw "flock.event.subscribe: " + u_live.ERROR_NONTRAVERSABLE;
            }
        },

        /**
         * Subscribes to datastore event, unsubscribes after first time
         * being triggered.
         * @param node {object} Datastore node.
         * @param eventName {string} Name of event to subscribe to.
         * @param handler {function} Event handler.
         */
        once: function (node, eventName, handler) {
            function fullHandler() {
                // calling actual handler
                handler.apply(this, arguments);

                // unsubscribing from event immediately
                self.unsubscribe(node, eventName, fullHandler);
            }

            // subscribing modified handler instead of actual one
            self.subscribe(node, eventName, fullHandler);
        },

        /**
         * Delegates event to a specified path. Event is captured on the node,
         * but handler is not called unless argument 'path' matches the path
         * of the event target.
         * @param node {object} Datastore node.
         * @param eventName {string} Name of event to subscribe to.
         * @param path {Array} Relative path to receiving node,
         * @param handler {function} Event handler.
         */
        delegate: function (node, eventName, path, handler) {
            var match = flock.query ? flock.query.match : flock.path.match;

            function fullHandler(event, data) {
                if (match(u_live.path(event.target), path)) {
                    // when target path matches passed path
                    handler.apply(this, arguments);
                }
            }

            // subscribing modified handler instead of actual one
            self.subscribe(node, eventName, fullHandler);
        },

        /**
         * Unsubscribes from datastore event.
         * @param node {object} Datastore node.
         * @param [eventName] {string} Name of event to subscribe to.
         * @param [handler] {function} Event handler.
         * @throws {string} On untraversable node.
         */
        unsubscribe: function (node, eventName, handler) {
            var meta = node[u_live.metaKey()],
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
                throw "flock.event.unsubscribe: " + u_live.ERROR_NONTRAVERSABLE;
            }
        },

        /**
         * Triggers event on specified datastore path.
         * @param node {object} Datastore node.
         * @param eventName {string} Name of event to subscribe to.
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handlers.
         * @param [options.target] {object} Custom target node.
         * @throws {string} On untraversable node.
         */
        trigger: function (node, eventName, options) {
            // default options
            options = options || {};
            options.target = options.target || node;

            var meta = node[u_live.metaKey()],
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
                            target: options.target
                        };
                        if (handlers[i](event, options.data) === false) {
                            // if handler returns false (not falsey), bubbling stops
                            return;
                        }
                    }
                }

                // bubbling event up the datastore tree
                if (typeof meta.parent === 'object') {
                    self.trigger(meta.parent, eventName, options);
                }
            } else {
                throw "flock.event.trigger: " + u_live.ERROR_NONTRAVERSABLE;
            }
        },

        /**
         * Sets a singe value on the given datastore path and triggers an event.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         * @param value {object} Value to set on path
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handler.
         * @param [options.trigger] {boolean} Whether to trigger. Default: true.
         */
        set: function (node, path, value, options) {
            options = options || {};
            path = u_path.normalize(path);

            // storing 'before' node
            var before = u_single.get(node, path),
                after,
                parent;

            // setting value
            parent = u_live.set(node, path, value);

            // acquiring 'after' node
            after = u_single.get(node, path);

            // triggering event
            if (options.trigger !== false) {
                self.trigger(
                    parent,
                    typeof before === 'undefined' ?
                        events.EVENT_ADD :
                        events.EVENT_CHANGE,
                    {
                        data: {
                            before: before,
                            after: after,
                            name: path[path.length - 1],
                            data: options.data
                        }
                    }
                );
            }

            return parent;
        },

        /**
         * Removes a single node from the datastore and triggers an event.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handler.
         * @param [options.trigger] {boolean} Whether to trigger. Default: true.
         */
        unset: function (node, path, options) {
            options = options || {};

            // storing 'before' node
            var before = u_single.get(node, path),
                removed;

            if (typeof before !== 'undefined') {
                removed = u_single.unset(node, path);

                // triggering event
                if (options.trigger !== false) {
                    self.trigger(
                        removed.parent,
                        events.EVENT_REMOVE,
                        {
                            name: removed.name,
                            before: before,
                            data: options.data
                        }
                    );
                }
            }

            return removed;
        },

        /**
         * Removes a node from the datastore. Cleans up empty parent nodes
         * until the first non-empty ancestor node. Then triggers an event.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handler.
         * @param [options.trigger] {boolean} Whether to trigger. Default: true.
         * @returns {object|boolean} Parent of removed node.
         */
        cleanup: function (node, path, options) {
            options = options || {};

            // storing 'before' node
            var before = u_single.get(node, path),
                removed;

            if (typeof before !== 'undefined') {
                removed = u_single.cleanup(node, path);

                // triggering event
                if (options.trigger !== false) {
                    self.trigger(
                        removed.parent,
                        events.EVENT_REMOVE,
                        {
                            name: removed.name,
                            before: before,
                            data: options.data
                        }
                    );
                }
            }

            return removed;
        },

        /**
         * Increments value on the object's key.
         * Triggers 'change' event.
         * @param node {object} Owner object.
         * @param key {string} Key representing numeric value.
         * @param [value] {number} Value to add. Default: 1.
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handler.
         * @param [options.trigger] {boolean} Whether to trigger. Default: true.
         */
        add: function (node, key, value, options) {
            options = options || {};

            var before = node[key],
                parent = u_single.add(node, key, value),
                after = node[key];

            if (typeof parent === 'object' &&
                options.trigger !== false
                ) {
                self.trigger(
                    parent,
                    events.EVENT_CHANGE,
                    {
                        data: {
                            before: before,
                            after: after,
                            name: key,
                            data: options.data
                        }
                    }
                );
            }
        }
    };

    // delegating errors
    u_utils.delegate(self, events);
    u_utils.delegate(self, errors);

    return self;
}(flock.single,
    flock.path,
    flock.utils,
    flock.live));
