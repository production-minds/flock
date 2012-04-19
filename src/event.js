/**
 * Datastore Event Management
 *
 * Requires live datastore.
 */
/*global flock */

flock.event = (function ($single, $path, $utils) {
    var
        // regular event types
        events = {
            EVENT_ACCESS: 'access',
            EVENT_CHANGE: 'change',
            EVENT_ADD: 'add',
            EVENT_REMOVE: 'remove'
        },

        privates,
        self,
        ctor;

    //////////////////////////////
    // Static

    privates = {
        /**
         * Preprocesses options object for use in event methods.
         * @param options {object} Arbitrary.
         * @return {object} Properly formatted options object.
         */
        preprocessOptions: function (options) {
            switch (typeof options) {
            case 'undefined':
                // empty object when no options object is specified
                return {};
            case 'object':
                // options argument when it is of object type
                return options;
            default:
                //
                return {
                    data: options
                };
            }
        }
    };

    self = {
        // private methods
        privates: privates,

        /**
         * Subscribes to datastore event.
         * @param lookup {object} Event lookup.
         * @param path {string|string[]} Datastore path.
         * @param eventName {string} Name of event to subscribe to.
         * @param handler {function} Event handler.
         */
        subscribe: function (lookup, path, eventName, handler) {
            // serializing path when necessary
            path = path instanceof Array ?
                path.join('.') :
                path;

            // obtaining reference to handler collection
            var events = lookup[path] = lookup[path] || {},
                handlers = events[eventName] = events[eventName] || [];

            // adding handler to collection
            handlers.push(handler);
        },

        /**
         * Subscribes to datastore event, unsubscribes after first time
         * being triggered.
         * @param lookup {object} Event lookup.
         * @param path {string|string[]} Datastore path.
         * @param eventName {string} Name of event to subscribe to.
         * @param handler {function} Event handler.
         */
        once: function (lookup, path, eventName, handler) {
            function fullHandler() {
                // calling actual handler
                handler.apply(this, arguments);

                // unsubscribing from event immediately
                self.unsubscribe(lookup, path, eventName, fullHandler);
            }

            // subscribing modified handler instead of actual one
            self.subscribe(lookup, path, eventName, fullHandler);
        },

        /**
         * Delegates event to a specified path. Event is captured on the node,
         * but handler is not called unless argument 'path' matches the path
         * of the event target.
         * @param lookup {object} Event lookup.
         * @param path {string|string[]} Datastore path capturing event.
         * @param eventName {string} Name of event to subscribe to.
         * @param pPath {string[]} Datastore path processing event.
         * @param handler {function} Event handler.
         */
        delegate: function (lookup, path, eventName, pPath, handler) {
            var match = flock.query ? flock.query.match : flock.path.match;

            function fullHandler(event, data) {
                if (match(event.target, pPath)) {
                    // when target path matches passed path
                    return handler.apply(this, arguments);
                }
                return undefined;
            }

            // subscribing modified handler instead of actual one
            self.subscribe(lookup, path, eventName, fullHandler);
        },

        /**
         * Unsubscribes from datastore event.
         * @param lookup {object} Event lookup.
         * @param path {string|string[]} Datastore path.
         * @param [eventName] {string} Name of event to subscribe to.
         * @param [handler] {function} Event handler.
         */
        unsubscribe: function (lookup, path, eventName, handler) {
            // serializing path when necessary
            path = path instanceof Array ?
                path.join('.') :
                path;

            // obtaining handlers for all event on current path
            var handlers = lookup[path],
                i;

            if (typeof handlers === 'object') {
                if (typeof handler === 'function') {
                    // removing specified handler from among handlers
                    handlers = handlers[eventName];
                    if (typeof handlers === 'object') {
                        for (i = 0; i < handlers.length; i++) {
                            if (handlers[i] === handler) {
                                handlers.splice(i, 1);
                                break;
                            }
                        }
                    }
                } else if (typeof eventName === 'string') {
                    // removing all handlers for a specific event
                    delete handlers[eventName];
                } else {
                    // removing all handlers altogether
                    delete lookup[path];
                }
            }
        },

        /**
         * Triggers event on specified datastore path.
         * @param lookup {object} Event lookup.
         * @param path {string|string[]} Datastore path.
         * @param eventName {string} Name of event to subscribe to.
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handlers.
         * @param [options.target] {string} Custom target path to be passed along event.
         */
        trigger: function (lookup, path, eventName, options) {
            var
                // string representation of path
                spath = path instanceof Array ?
                    path.join('.') :
                    path,

                // array representation of path
                apath = typeof path === 'string' ?
                    path.split('.') :
                    path instanceof Array ?
                        path.concat([]) :
                        path,

                // handler lookups
                events = lookup[spath],
                handlers,

                event, i;

            // default target is the trigger path
            options = privates.preprocessOptions(options);
            options.target = options.target || spath;

            if (typeof events === 'object' &&
                events[eventName] instanceof Array
                ) {
                // calling handlers for event
                handlers = events[eventName];
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
            if (apath.length > 0 && spath !== '') {
                apath.pop();
                spath = apath.join('.');
                self.trigger(lookup, spath, eventName, options);
            }
        },

        /**
         * Retrieves a single value from the given datastore path and triggers an event.
         * @param lookup {object} Event lookup.
         * @param root {object} Source node.
         * @param path {string|Array} Datastore path.
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handler.
         * @param [options.trigger] {boolean} Whether to trigger. Default: true.
         */
        get: function (lookup, root, path, options) {
            options = privates.preprocessOptions(options);

            var result = $single.get(root, path);

            if (options.trigger !== false) {
                self.trigger(
                    lookup,
                    path,
                    events.EVENT_ACCESS,
                    {
                        data: {
                            value: result,
                            data: options.data
                        }
                    }
                );
            }

            return result;
        },

        /**
         * Sets a singe value on the given datastore path and triggers an event.
         * @param lookup {object} Event lookup.
         * @param root {object} Source node.
         * @param path {string|Array} Datastore path.
         * @param value {object} Value to set on path
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handler.
         * @param [options.trigger] {boolean} Whether to trigger. Default: true.
         */
        set: function (lookup, root, path, value, options) {
            options = privates.preprocessOptions(options);
            path = $path.normalize(path);

            // storing 'before' node
            var before = $single.get(root, path),
                after;

            // setting value
            $single.set(root, path, value);

            // acquiring 'after' node
            after = $single.get(root, path);

            // triggering event
            if (options.trigger !== false) {
                self.trigger(
                    lookup,
                    path,
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
        },

        /**
         * Removes a single node from the datastore and triggers an event.
         * @param lookup {object} Event lookup.
         * @param root {object} Source node.
         * @param path {string|Array} Datastore path.
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handler.
         * @param [options.trigger] {boolean} Whether to trigger. Default: true.
         */
        unset: function (lookup, root, path, options) {
            options = privates.preprocessOptions(options);

            // storing 'before' node
            var before = $single.get(root, path);

            if (typeof before !== 'undefined') {
                $single.unset(root, path);

                // triggering event
                if (options.trigger !== false) {
                    self.trigger(
                        lookup,
                        path,
                        events.EVENT_REMOVE,
                        {
                            before: before,
                            data: options.data
                        }
                    );
                }
            }
        },

        /**
         * Removes a node from the datastore. Cleans up empty parent nodes
         * until the first non-empty ancestor node. Then triggers an event.
         * @param lookup {object} Event lookup.
         * @param root {object} Source node.
         * @param path {string|Array} Datastore path.
         * @param [options] {object} Options.
         * @param [options.data] {object} Custom data to be passed to event handler.
         * @param [options.trigger] {boolean} Whether to trigger. Default: true.
         */
        cleanup: function (lookup, root, path, options) {
            options = privates.preprocessOptions(options);

            // storing 'before' node
            var before = $single.get(root, path);

            if (typeof before !== 'undefined') {
                $single.cleanup(root, path);

                // triggering event
                if (options.trigger !== false) {
                    self.trigger(
                        lookup,
                        path,
                        events.EVENT_REMOVE,
                        {
                            before: before,
                            data: options.data
                        }
                    );
                }
            }
        }
    };

    //////////////////////////////
    // Instance

    ctor = function (root) {
        var lookup = {},
            lookupArgs = [lookup],
            rootArgs = [lookup, root];

        return {
            // getters
            root: function () {
                return root;
            },
            lookup: function () {
                return lookup;
            },

            // event methods
            subscribe: $utils.genMethod(self.subscribe, lookupArgs),
            once: $utils.genMethod(self.once, lookupArgs),
            delegate: $utils.genMethod(self.delegate, lookupArgs),
            unsubscribe: $utils.genMethod(self.unsubscribe, lookupArgs),
            trigger: $utils.genMethod(self.trigger, lookupArgs),

            // datastore methods
            get: $utils.genMethod(self.get, rootArgs),
            set: $utils.genMethod(self.set, rootArgs),
            unset: $utils.genMethod(self.unset, rootArgs),
            cleanup: $utils.genMethod(self.cleanup, rootArgs)
        };
    };

    // adding static methods
    $utils.delegate(ctor, self);

    return ctor;
}(
    flock.single,
    flock.path,
    flock.utils
));
