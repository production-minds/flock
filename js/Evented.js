/**
 * Evented Trait
 */
/* global dessert, troop, flock */
troop.promise(flock, 'Evented', function (ns, className, Single, Path) {
    // adding constants to namespace
    troop.Base.addConstant.call(flock, /** @lends flock */{
        // regular event types
        ACCESS: 'standardEvent.access',
        CHANGE: 'standardEvent.change',
        ADD   : 'standardEvent.add',
        REMOVE: 'standardEvent.remove'
    });

    var base = flock.Multi,
        self;

    /**
     * @class flock.Evented
     * @extends troop.Base
     */
    self = flock.Evented = base.extend()
        .addPrivate(/** @lends flock.Evented */{
            /**
             * Preprocesses options object for use in event methods.
             * @param {object} options Arbitrary.
             * @return {object} Properly formatted options object.
             */
            _preprocessOptions: function (options) {
                switch (typeof options) {
                case 'undefined':
                    // empty object when no options object is specified
                    return {};
                case 'object':
                    // options argument when it is of object type
                    return options;
                default:
                    return {
                        data: options
                    };
                }
            }
        })
        .addMethod(/** @lends flock.Evented */{
            init: function () {
                base.init.apply(this, arguments);

                this.addConstant(/** @lends flock.Evented */{
                    /**
                     * @dict
                     */
                    lookup: {}
                });
            },

            //////////////////////////////
            // Privates

            /**
             * Triggers standard datastore event
             * depending on the before and after values.
             * @param {string|string[]} path Datastore path.
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
                        after : after,
                        data  : customData
                    }
                };

                // triggering change event
                this.trigger(path, flock.CHANGE, data);

                // also triggering add/remove event when necessary
                if (typeof before === 'undefined') {
                    this.trigger(path, flock.ADD, data);
                } else if (typeof after === 'undefined') {
                    this.trigger(path, flock.REMOVE, data);
                }
            },

            //////////////////////////////
            // Event functionality

            /**
             * Subscribes to datastore event.
             * @param {string|string[]} path Datastore path.
             * @param {string} eventName Name of event to subscribe to.
             * @param {function} handler Event handler.
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
             * @param {string|string[]} path Datastore path.
             * @param {string} eventName Name of event to subscribe to.
             * @param {function} handler Event handler.
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
             * @param {string|string[]} path Datastore path capturing event.
             * @param {string} eventName Name of event to subscribe to.
             * @param {string[]} pPath Datastore path processing event.
             * @param {function} handler Event handler.
             */
            delegate: function (path, eventName, pPath, handler) {
                var Path = flock.Query ? flock.Query : flock.Path;

                function fullHandler(event, data) {
                    if (Path.match(event.target, pPath)) {
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
             * @param {string|string[]} path Datastore path.
             * @param {string} [eventName] Name of event to subscribe to.
             * @param {function} [handler] Event handler.
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
             * @param {string|string[]} path Datastore path.
             * @param {string} eventName Name of event to subscribe to.
             * @param {object} [options] Options.
             * @param {object} [options.data] Custom data to be passed to event handlers.
             * @param {string} [options.target] Custom target path to be passed along event.
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
                options = self._preprocessOptions(options);
                options.target = options.target || spath;

                if (typeof events === 'object' &&
                    events[eventName] instanceof Array
                    ) {
                    // calling handlers for event
                    handlers = events[eventName];
                    for (i = 0; i < handlers.length; i++) {
                        event = {
                            name  : eventName,
                            path  : spath,
                            target: options.target
                        };
                        if (handlers[i](event, options.data) === false) {
                            // if handler returns false (not falsey), bubbling stops
                            return this;
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
             * @param {string|Array} path Datastore path.
             * @param {object} [options] Options.
             * @param {object} [options.data] Custom data to be passed to event handler.
             * @param {boolean} [options.trigger] Whether to trigger. Default: true.
             */
            get: function (path, options) {
                options = self._preprocessOptions(options);

                var result = base.get.call(this, path),
                    data,
                    caller, args;

                if (options.trigger !== false &&
                    typeof result === 'undefined'
                    ) {
                    /* jshint noarg:false */
                    caller = arguments.callee.caller;
                    args = arguments.callee.caller['arguments'];
                    /* jshint noarg:true */
                    data = {
                        data: {
                            caller: caller,
                            rerun : function () {
                                caller.apply(this, args);
                            },
                            data  : options.data
                        }
                    };

                    // triggering access event
                    this.trigger(path, flock.ACCESS, data);
                }

                return result;
            },

            /**
             * Sets a singe value on the given datastore path and triggers an event.
             * @param {string|Array} path Datastore path.
             * @param {object} value Value to set on path
             * @param {object} [options] Options.
             * @param {object} [options.data] Custom data to be passed to event handler.
             * @param {boolean} [options.trigger] Whether to trigger. Default: true.
             */
            set: function (path, value, options) {
                options = self._preprocessOptions(options);
                path = Path.normalize(path);

                // storing 'before' node
                var before = Single.get.call(this, path, true),
                    after;

                // setting value
                Single.set.call(this, path, value);

                // acquiring 'after' node
                after = Single.get.call(this, path, true);

                // triggering event
                if (options.trigger !== false) {
                    this.triggerChanges(path, before, after, options.data);
                }

                return this;
            },

            /**
             * Removes a single node from the datastore and triggers an event.
             * @param {string|Array} path Datastore path.
             * @param {object} [options] Options.
             * @param {object} [options.data] Custom data to be passed to event handler.
             * @param {boolean} [options.trigger] Whether to trigger. Default: true.
             */
            unset: function (path, options) {
                options = self._preprocessOptions(options);

                // storing 'before' node
                var before = Single.get.call(this, path, true);

                if (typeof before !== 'undefined') {
                    Single.unset.call(this, path);

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
             * @param {string|Array} path Datastore path.
             * @param {object} [options] Options.
             * @param {object} [options.data] Custom data to be passed to event handler.
             * @param {boolean} [options.trigger] Whether to trigger. Default: true.
             */
            cleanup: function (path, options) {
                options = self._preprocessOptions(options);

                // storing 'before' node
                var before = Single.get.call(this, path, true);

                if (typeof before !== 'undefined') {
                    Single.cleanup.call(this, path);

                    // triggering event
                    if (options.trigger !== false) {
                        this.triggerChanges(path, before, undefined, options.data);
                    }
                }

                return this;
            }
        });
}, flock.Single, flock.Path);
