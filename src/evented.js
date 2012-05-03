/**
 * Datastore Event Management
 */
var flock = flock || {};

flock.evented = (function ($single, $path, $utils) {
    var
        // regular event types
        constants = {
            ACCESS: 'standardEvent.access',
            CHANGE: 'standardEvent.change',
            ADD: 'standardEvent.add',
            REMOVE: 'standardEvent.remove'
        },

        self;

    //////////////////////////////
    // Static privates

    /**
     * Preprocesses options object for use in event methods.
     * @param options {object} Arbitrary.
     * @return {object} Properly formatted options object.
     */
    function preprocessOptions(options) {
        switch (typeof options) {
        case 'undefined':
            // empty object when no options object is specified
            return {};
        case 'boolean':
            // boolean option defaults to single.get's nochaining argument
            // for compatibility
            return {
                nochaining: true
            };
        case 'object':
            // options argument when it is of object type
            return options;
        default:
            return {
                data: options
            };
        }
    }

    self = {
        /**
         * @constructor
         * @param base {object} Base class instance.
         */
        create: function (base) {
            if (arguments.length > 1) {
                // root and options were passed instead of base
                // falling back to flock.single
                base = $single.create.apply(this, arguments);
            }

            var that = Object.create(base, {
                lookup: {value: {}, writable: false}
            });

            return $utils.extend(that, self, true);
        },

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
        triggerChanges: function (path, before, after, customData) {
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
            this.trigger(path, constants.CHANGE, data);

            // also triggering add/remove event when necessary
            if (typeof before === 'undefined') {
                this.trigger(path, constants.ADD, data);
            } else if (typeof after === 'undefined') {
                this.trigger(path, constants.REMOVE, data);
            }
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
            var events = this.lookup[path] = this.lookup[path] || {},
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
            var that = this;

            function fullHandler() {
                // calling actual handler
                handler.apply(this, arguments);

                // unsubscribing from event immediately
                that.off(path, eventName, fullHandler);
            }

            // subscribing modified handler instead of actual one
            that.on(path, eventName, fullHandler);

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
            this.on(path, eventName, fullHandler);

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
            var handlers = this.lookup[path],
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
                    delete this.lookup[path];
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
                events = this.lookup[spath],
                handlers,

                event, i;

            // default target is the trigger path
            options = preprocessOptions(options);
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
                this.trigger(spath, eventName, options);
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
         * @param [options.nochaining] {boolean} Whether method should return bare node.
         */
        get: function (path, options) {
            options = preprocessOptions(options);

            var result = $single.get.call(this, path, options.nochaining),
                root = flock.single.isPrototypeOf(result) ?
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
                this.trigger(path, constants.ACCESS, data);
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
            options = preprocessOptions(options);
            path = $path.normalize(path);

            // storing 'before' node
            var before = $single.get.call(this, path, true),
                after;

            // setting value
            $single.set.call(this, path, value);

            // acquiring 'after' node
            after = $single.get.call(this, path, true);

            // triggering event
            if (options.trigger !== false) {
                this.triggerChanges(path, before, after, options.data);
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
            options = preprocessOptions(options);

            // storing 'before' node
            var before = $single.get.call(this, path, true);

            if (typeof before !== 'undefined') {
                $single.unset.call(this, path);

                // triggering event
                if (options.trigger !== false) {
                    this.triggerChanges(path, before, undefined, options.data);
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
            options = preprocessOptions(options);

            // storing 'before' node
            var before = $single.get.call(this, path, true);

            if (typeof before !== 'undefined') {
                $single.cleanup.call(this, path);

                // triggering event
                if (options.trigger !== false) {
                    this.triggerChanges(path, before, undefined, options.data);
                }
            }

            return this;
        }
    };

    //////////////////////////////
    // Static members

    // delegating to flock
    $utils.mixin(flock, constants);

    return self;
}(
    flock.single,
    flock.path,
    flock.utils
));
