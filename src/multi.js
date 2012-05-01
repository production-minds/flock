/**
 * Complex Query Functionality
 *
 * Implements querying, modification, and removal of multiple datastore
 * nodes at a time.
 */
var flock = flock || {};

flock.multi = (function ($query, $utils) {
    var
        errors = {
            ERROR_INVALIDPATH: "Invalid path."
        },

        // traversal modes
        constants = {
            KEYS: 'traversalModes.keys', // collect leaf keys
            VALUES: 'traversalModes.values', // collect leaf values
            BOTH: 'traversalModes.keysAndValues', // collect key:value pairs of leaf nodes
            DEL: 'traversalModes.delete', // delete leaf nodes
            COUNT: 'traversalModes.count' // count leaf nodes
        },

        self;

    //////////////////////////////
    // Static privates

    /**
     * Preprocesses options object for use in query-related methods.
     * @param options {object} Arbitrary.
     * @return {object} Properly formatted options object.
     */
    function preprocessOptions(options) {
        switch (typeof options) {
        case 'undefined':
            // empty object when no options object is specified
            return {};
        case 'object':
            // options argument when it is of object type
            return options;
        case 'number':
            /**
             * One of the flock constants is assumed here.
             * @see flock.constants
             */
            return {
                mode: options
            };
        default:
        case 'function':
            // functions are treated as callbacks
            return {
                value: options
            };
        }
    }

    /**
     * Initializes traversal result according to traversal mode
     * @param mode {string} Traversal mode.
     */
    function initResult(mode) {
        switch (mode) {
        case constants.KEYS:
        case constants.VALUES:
            return [];
        default:
        case constants.BOTH:
            return {};
        case constants.COUNT:
            return 0;
        }
    }

    self = {
        /**
         * @constructor
         * @param base {object} Base class instance.
         */
        create: function (base) {
            return $utils.extend(base, self);
        },

        //////////////////////////////
        // Control

        /**
         * Collects or modifies end nodes.
         * @param query {string|string[]} Datastore query expression.
         * @param [options] {object} Options.
         * @param [options.limit] max number of entries to retrieve, default: unlimited
         * @param [options.mode] type of return value is Object or Array (flock.key/flock.values/flock.both/flock.del), default: flock.array
         * @param [options.loopback] whether to traverse loopbacks, default: false
         * @param [options.undef] whether to collect undefined entries, default: false
         * @param [options.value] value to set, or callback function to execute on nodes
         * when undefined, function returns collected values
         * @param [nochaining] {boolean} Whether method should return bare node.
         * @return {object} Collected nodes.
         */
        traverse: function (query, options, nochaining) {
            options = preprocessOptions(options);
            query = $query.normalize(query);

            // setting defaults
            if (typeof options.value === 'undefined' &&
                typeof options.mode === 'undefined'
                ) {
                options.mode = constants.VALUES;
            }

            // default case
            if (!query.length) {
                return this.root;
            }

            // traversal state variables
            var
                limit = options.limit || 0,
                loopback = options.loopback || false,
                result = initResult(options.mode),
                stack = options.loopback ? null : [];

            /**
             * Collects end nodes matching the path passed in the
             * traversal state object.
             * @param obj {object} Node to walk.
             * @param i {number} Current position in path,
             * @param depth {number} Current depth in tree.
             */
            (function walk(obj, i, path) {
                var key, j;

                /**
                 * Processes a single node in accordance with the current
                 * state of traversal.
                 * @param key {string} Key in object to proceed to.
                 * @return {boolean} Whether to terminate traversal.
                 */
                function node(key) {
                    var value;

                    if (i < query.length - 1) {
                        // current node has children, burrowing one level deeper
                        if (obj.hasOwnProperty(key)) {
                            walk(obj[key], i + 1, path.concat(key));
                        }
                    } else {
                        // leaf node reached
                        if (typeof options.mode !== 'undefined') {
                            // when querying or deleting
                            value = obj[key];
                            if (options.undef || typeof value !== 'undefined') {
                                switch (options.mode) {
                                case constants.VALUES:
                                    // collecting value from nodes
                                    result.push(value);
                                    break;
                                case constants.KEYS:
                                    // collecting key from node
                                    result.push(key);
                                    break;
                                case constants.BOTH:
                                    // collecting key AND value from node
                                    // WARNING: new values with same key overwrite old
                                    result[key] = value;
                                    break;
                                case constants.DEL:
                                    // deleting node
                                    delete obj[key];
                                    break;
                                case constants.COUNT:
                                    // counting node
                                    result++;
                                    break;
                                }
                                if (--limit === 0) {
                                    return true;
                                }
                            }
                        } else {
                            // when updating
                            if (typeof options.value === 'function') {
                                // calling custom handler on node
                                value = options.value(obj[key], path);
                                if (typeof value !== 'undefined') {
                                    obj[key] = value;
                                }
                            } else {
                                // assigning custom value to key
                                obj[key] = options.value;
                            }
                            if (--limit === 0) {
                                return true;
                            }
                        }
                    }
                    return false;
                }

                // detecting loopback
                if (!loopback) {
                    for (j = 0; j < path.length; j++) {
                        if (obj === stack[j]) {
                            return undefined;
                        }
                    }
                    // putting current object on the stack
                    stack[path.length] = obj;
                }

                // processing next key in path
                key = query[i];
                if (key === '*') {
                    // processing wildcard node
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            if (node(key)) {
                                return undefined;
                            }
                        }
                    }
                } else if (key === null && typeof obj === 'object') {
                    // processing skipper node
                    // must be object type as strings have indexes, too
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            if (key === query[i + 1]) {
                                // current key matches next key in path
                                // re-walking current object but leving skipper key
                                walk(obj, i + 1, path.concat());
                            } else {
                                // current key doesn't match next key in path
                                // walking next level, but staying on skipper key
                                walk(obj[key], i, path.concat(key));
                            }
                        }
                    }
                } else if (key instanceof Array) {
                    // processing list of nodes
                    for (j = 0; j < key.length; j++) {
                        if (node(key[j])) {
                            return undefined;
                        }
                    }
                } else {
                    // processing single node
                    key = query[i];
                    if (node(key)) {
                        return undefined;
                    }
                }
            }(this.root || {}, 0, []));

            // optionally wrapping result into datastore object
            return nochaining || this.nochaining ?
                result :
                this.wrap(result, this.options);
        },

        //////////////////////////////
        // Wrapper methods

        /**
         * Retrieves multiple nodes from datastore.
         * @param path {string|string[]} Datastore path.
         * @param [options] {object}
         * @see flock.multi.query for options
         */
        mget: function (path, options) {
            return self.traverse.apply(this, arguments);
        },

        /**
         * Modifies multiple nodes in datastore. Sets the same value on each node defined by
         * the path argument, or calls a handler function for each.
         * @param path {string|string[]} Datastore path.
         * @param value {object|function} Value to set or function to call on each affected node.
         * @param [options] {object}
         * @see flock.multi.query for options
         */
        mset: function (path, value, options) {
            self.traverse.call(this, path, $utils.blend(options || {}, {
                value: value
            }));
            return this;
        },

        /**
         * Removes multiple nodes from datastore.
         * @param path {string|string[]} Datastore path.
         * @param [options] {object}
         * @see flock.multi.query for options
         */
        munset: function (path, options) {
            self.traverse.call(this, path, $utils.blend(options || {}, {
                mode: constants.DEL
            }));
            return this;
        }
    };

    // delegating constants to flock
    $utils.mixin(flock, errors);
    $utils.mixin(flock, constants);

    return self;
}(
    flock.query,
    flock.utils
));
