/**
 * Datastore Event Management
 */
var flock = flock || {};

flock.evented = (function ($path, $utils) {
    var
        // regular event types
        constants = {
            ACCESS: 'standardEvent.access',
            CHANGE: 'standardEvent.change',
            ADD: 'standardEvent.add',
            REMOVE: 'standardEvent.remove'
        },

        privates,
        ctor;

    //////////////////////////////
    // Static privates

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

    //////////////////////////////
    // Class

    /**
     * @class Evented datastore behavior.
     * @param base {object} Base class instance.
     */
    ctor = function (base) {
        var lookup = {},
            self;

        //////////////////////////////
        // Privates

        /**
         * Triggers standard datastore event
         * depending on the before and after values.
         * @param path {string|string[]} Datastore path.
         * @param before Value before the change.
         * @param after Value after the change.
         * @param customData Data submitted by the user.
         */
        function triggerChanges(path, before, after, customData) {
            // checking whether anything changed
            if (before === after) {
                return;
            }

            var data = {
                data: {
                    before: before,
                    after: after,
                    data: customData
                }
            };

            // triggering change event
            self.trigger(path, constants.CHANGE, data);

            // also triggering add/remove event when necessary
            if (typeof before === 'undefined') {
                self.trigger(path, constants.ADD, data);
            } else if (typeof after === 'undefined') {
                self.trigger(path, constants.REMOVE, data);
            }
        }


        self = $utils.extend(base, {
            //////////////////////////////
            // Getters, setters

            lookup: function () {
                return lookup;
            },

            //////////////////////////////
            // Event functionality

            /**
             * Subscribes to datastore event.
             * @param path {string|string[]} Datastore path.
             * @param eventName {string} Name of event to subscribe to.
             * @param handler {function} Event handler.
             */
            on: function (path, eventName, handler) {
                // serializing path when necessary
                path = path instanceof Array ?
                    path.join('.') :
                    path;

                // obtaining reference to handler collection
                var events = lookup[path] = lookup[path] || {},
                    handlers = events[eventName] = events[eventName] || [];

                // adding handler to collection
                handlers.push(handler);

                return this;
            },

            /**
             * Subscribes to datastore event, unsubscribes after first time
             * being triggered.
             * @param path {string|string[]} Datastore path.
             * @param eventName {string} Name of event to subscribe to.
             * @param handler {function} Event handler.
             */
            one: function (path, eventName, handler) {
                function fullHandler() {
                    // calling actual handler
                    handler.apply(this, arguments);

                    // unsubscribing from event immediately
                    self.off(path, eventName, fullHandler);
                }

                // subscribing modified handler instead of actual one
                self.on(path, eventName, fullHandler);

                return this;
            },

            /**
             * Delegates event to a specified path. Event is captured on the node,
             * but handler is not called unless argument 'path' matches the path
             * of the event target.
             * @param path {string|string[]} Datastore path capturing event.
             * @param eventName {string} Name of event to subscribe to.
             * @param pPath {string[]} Datastore path processing event.
             * @param handler {function} Event handler.
             */
            delegate: function (path, eventName, pPath, handler) {
                var match = flock.query ? flock.query.match : flock.path.match;

                function fullHandler(event, data) {
                    if (match(event.target, pPath)) {
                        // when target path matches passed path
                        return handler.apply(this, arguments);
                    }
                    return undefined;
                }

                // subscribing modified handler instead of actual one
                self.on(path, eventName, fullHandler);

                return this;
            },

            /**
             * Unsubscribes from datastore event.
             * @param path {string|string[]} Datastore path.
             * @param [eventName] {string} Name of event to subscribe to.
             * @param [handler] {function} Event handler.
             */
            off: function (path, eventName, handler) {
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

                return this;
            },

            /**
             * Triggers event on specified datastore path.
             * @param path {string|string[]} Datastore path.
             * @param eventName {string} Name of event to subscribe to.
             * @param [options] {object} Options.
             * @param [options.data] {object} Custom data to be passed to event handlers.
             * @param [options.target] {string} Custom target path to be passed along event.
             */
            trigger: function (path, eventName, options) {
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
                    self.trigger(spath, eventName, options);
                }

                return this;
            },

            //////////////////////////////
            // Overrides

            /**
             * Retrieves a single value from the given datastore path and triggers an event.
             * @param path {string|Array} Datastore path.
             * @param [options] {object} Options.
             * @param [options.data] {object} Custom data to be passed to event handler.
             * @param [options.trigger] {boolean} Whether to trigger. Default: true.
             */
            get: function (path, options, nochaining) {
                options = privates.preprocessOptions(options);

                var result = base.get.call(this, path, nochaining),
                    root = flock.node.isPrototypeOf(result) ?
                        result.root :
                        result,
                    data;

                if (options.trigger !== false &&
                    typeof root === 'undefined'
                    ) {
                    data = {
                        data: {
                            data: options.data
                        }
                    };

                    // triggering access event
                    self.trigger(path, constants.ACCESS, data);
                }

                return result;
            },

            /**
             * Sets a singe value on the given datastore path and triggers an event.
             * @param path {string|Array} Datastore path.
             * @param value {object} Value to set on path
             * @param [options] {object} Options.
             * @param [options.data] {object} Custom data to be passed to event handler.
             * @param [options.trigger] {boolean} Whether to trigger. Default: true.
             */
            set: function (path, value, options) {
                options = privates.preprocessOptions(options);
                path = $path.normalize(path);

                // storing 'before' node
                var before = base.get(path, true),
                    after;

                // setting value
                base.set(path, value);

                // acquiring 'after' node
                after = base.get(path, true);

                // triggering event
                if (options.trigger !== false) {
                    triggerChanges(path, before, after, options.data);
                }

                return this;
            },

            /**
             * Removes a single node from the datastore and triggers an event.
             * @param path {string|Array} Datastore path.
             * @param [options] {object} Options.
             * @param [options.data] {object} Custom data to be passed to event handler.
             * @param [options.trigger] {boolean} Whether to trigger. Default: true.
             */
            unset: function (path, options) {
                options = privates.preprocessOptions(options);

                // storing 'before' node
                var before = base.get(path, true);

                if (typeof before !== 'undefined') {
                    base.unset(path);

                    // triggering event
                    if (options.trigger !== false) {
                        triggerChanges(path, before, undefined, options.data);
                    }
                }

                return this;
            },

            /**
             * Removes a node from the datastore. Cleans up empty parent nodes
             * until the first non-empty ancestor node. Then triggers an event.
             * @param path {string|Array} Datastore path.
             * @param [options] {object} Options.
             * @param [options.data] {object} Custom data to be passed to event handler.
             * @param [options.trigger] {boolean} Whether to trigger. Default: true.
             */
            cleanup: function (path, options) {
                options = privates.preprocessOptions(options);

                // storing 'before' node
                var before = base.get(path, true);

                if (typeof before !== 'undefined') {
                    base.cleanup(path);

                    // triggering event
                    if (options.trigger !== false) {
                        triggerChanges(path, before, undefined, options.data);
                    }
                }

                return this;
            }
        });

        return self;
    };

    //////////////////////////////
    // Static members

    // delegating to class
    $utils.mixin(ctor, privates);

    // delegating to flock
    $utils.mixin(flock, constants);

    return ctor;
}(
    flock.path,
    flock.utils
));
