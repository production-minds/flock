/**
 * Flock - JavaScript Key-Value Cache
 *
 * In-memory key-value store. Stores entire tree structure in memory.
 * Use for complex lookups, as memcache on top of a persistence layer,
 * or as an in-memory DHT node.
 *
 * https://github.com/wwidd/flock
 */
var	flock;

(function () {
    var RE_PATH_VALIDATOR = /^(\.{3})*([^\.,]+(\.{1,3}|,))*[^\.,]+$/,
        RE_PATH_SKIPPER = /\.{2,}/;

    /**
     * Flock constructor
     * @constructor
     * @param [root] {object} Root object for datastore. When omitted, empty object is assumed.
     */
    flock = function (root) {
        // creating default root object
        if (typeof root === 'undefined') {
            root = {};
        }

        var self = {
            //////////////////////////////
            // Getters, setters

            root: function () {
                return root;
            },

            //////////////////////////////
            // Control

            /**
             * Retrieves single node at the given path.
             * @param path {string|Array} Datastore path expression.
             * @return {object} Node on path.
             * @throws TypeError on invalid path
             */
            get: function (path) {
                var tpath = typeof path === 'object' ? path : flock.resolve(path),
                    tmp = root,
                    i;

                // walking nodes along path
                for (i = 0; i < tpath.length; i++) {
                    tmp = tmp[tpath[i]];
                }

                // returning value on end node
                return tmp;
            },

            /**
             * Sets single node on the given path.
             * @param path {string|Array} Datastore path expression.
             * @param value {object} Value to set on path.
             * @return {object} Node on the input path.
             */
            set: function (path, value) {
                // when value is omitted, default value is empty object
                value = typeof value === 'undefined' ? {} : value;

                var tpath = typeof path === 'object' ? path : flock.resolve(path),
                    last = tpath.length - 1,
                    key,
                    node,
                    child,
                    i;

                if (!tpath.length) {
                    throw "flock.set: empty path '" + path + "'";
                }

                // walking nodes along path
                for (i = 0, node = root; i < last; i++) {
                    key = tpath[i];
                    child = node[key];
                    if (typeof child === 'undefined') {
                        // creating node
                        child = node[key] = {};
                    }
                    node = child;
                }

                // setting value on end node
                node[tpath[i]] = value;

                return node;
            },

            /**
             * removes a datastore element from the given path
             * @param path {string|Array} Datastore path expression.
             * @return {boolean} Success. True when node was present and deleted, false when node was not present.
             */
            unset: function (path) {
                var tpath = typeof path === 'object' ? path.concat([]) : flock.resolve(path),
                    key = tpath.pop(),
                    parent = self.get(tpath);

                // deleting node when exists
                if (parent && parent.hasOwnProperty(key)) {
                    delete parent[key];
                    return true;
                } else {
                    return false;
                }
            },

            /**
             * Retrieves multiple nodes.
             * @param path {string|Array} Datastore path expression.
             * @param options {object} Options.
             * @return {object / Array} Collected nodes.
             * @see self.many()
             */
            mget: function (path, options) {
                return self.many(path, options);
            },

            /**
             * Sets multiple nodes.
             * @param path {string|Array} Datastore path expression.
             * @param value {object} Value to set on path.
             * @param options {object} Options.
             * @return {object} Reference to self.
             * @see self.many()
             */
            mset: function (path, value, options) {
                options = options || {};
                options.value = typeof value === 'undefined' ? {} : value;
                delete options.mode;
                self.many(path, options);
                return self;
            },

            /**
             * Removes multiple nodes.
             * @param path {string|Array} Datastore path expression.
             * @param options {object} Options.
             * @return {object} Reference to self.
             */
            munset: function (path, options) {
                options = options || {};
                options.mode = flock.del;
                self.many(path, options);
                return self;
            },

            /**
             * Collects or modifies end nodes.
             * @param path {string|Array} Datastore path expression.
             * @param options {object} Options.
             *	 - limit: max number of entries to retrieve, default: unlimited
             *	 - mode: type of return value is Object or Array (flock.key/flock.values/flock.both/flock.del), default: flock.array
             *	 - loopback: whether to traverse loopbacks, default: false
             *	 - undef: whether to collect undefined entries, default: false
             *	 - value: value to set, or callback function to execute on nodes
             *		 when undefined, function returns collected values
             * @return {object} Collected nodes.
             */
            many: function (path, options) {
                options = options || {};

                // setting defaults
                if (
                    typeof options.value === 'undefined' &&
                        typeof options.mode === 'undefined'
                ) {
                    options.mode = flock.values;
                }

                var tpath = typeof path === 'object' ? path.concat([]) : flock.resolve(path),
                    last = tpath.length - 1,
                    limit = options.limit || 0,
                    loopback = options.loopback || false,
                    result = {2: {}, 4: 0}[options.mode] || [],
                    stack = options.loopback ? null : [];

                // default case
                if (!tpath.length) {
                    return root;
                }

                /**
                 * Collects end nodes.
                 * @param obj {object} Node to walk.
                 * @param i {number} Current position in path,
                 * @param depth {number} Current depth in tree.
                 * TODO: must be class level, creating a function on each call
                 * to .many() may impact performance significantly
                 */
                (function walk(obj, i, depth) {
                    var key, j;

                    // detecting loopback
                    if (!loopback) {
                        for (j = 0; j < depth; j++) {
                            if (obj === stack[j]) {
                                return;
                            }
                        }
                        // putting current object on the stack
                        stack[depth] = obj;
                    }

                    /**
                     * Processes key node.
                     * @param key {string} Key in object to proceed to.
                     * @return {boolean} Whether to terminate traversal.
                     */
                    function node(key) {
                        var value;
                        if (i < last) {
                            // current node has children, burrowing one level deeper
                            if (obj.hasOwnProperty(key)) {
                                walk(obj[key], i + 1, depth + 1);
                            }
                        } else {
                            // leaf node reached
                            if (typeof options.mode !== 'undefined') {
                                // when querying or deleting
                                value = obj[key];
                                if (options.undef || typeof value !== 'undefined') {
                                    switch (options.mode) {
                                    case flock.values:
                                        // collecting value from nodes
                                        result.push(value);
                                        break;
                                    case flock.keys:
                                        // collecting key from node
                                        result.push(key);
                                        break;
                                    case flock.both:
                                        // collecting key AND value from node
                                        // WARNING: new values with same key overwrite old
                                        result[key] = value;
                                        break;
                                    case flock.del:
                                        // deleting node
                                        delete obj[key];
                                        break;
                                    case flock.count:
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
                                    value = options.value(obj[key]);
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

                    // processing next key in path
                    key = tpath[i];
                    if (key === '*') {
                        // processing wildcard node
                        for (key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                if (node(key)) {
                                    return;
                                }
                            }
                        }
                    } else if (key === null && typeof obj === 'object') {
                        // processing skipper node
                        // must be object type as strings have indexes, too
                        for (key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                if (key === tpath[i + 1]) {
                                    // current key matches next key in path
                                    // re-walking current object but leving skipper key
                                    walk(obj, i + 1, depth);
                                } else {
                                    // current key doesn't match next key in path
                                    // walking next level, but staying on skipper key
                                    walk(obj[key], i, depth + 1);
                                }
                            }
                        }
                    } else if (key instanceof Array) {
                        // processing list of nodes
                        for (j = 0; j < key.length; j++) {
                            if (node(key[j])) {
                                return;
                            }
                        }
                    } else {
                        // processing single node
                        key = tpath[i];
                        if (node(key)) {
                            return;
                        }
                    }
                }(root, 0, 0));

                return result;
            }
        };

        return self;
    };

    //////////////////////////////
    // Static methods

    /**
     * Validates and resolves datastore path.
     * @param path {string|Array} Datastore path.
     * @example
     * 'contacts.smith.*.ancestors...name'
     * will get the names of all ancestor names for contacts w/ last name 'smith'
     * @return {Array} Valid datastore path in array notation.
     * @throws {string} On invalid input path.
     */
    flock.resolve = function (path) {
        // processing path
        if (typeof path === 'string') {
            // validating path
            if (path.length && !RE_PATH_VALIDATOR.test(path)) {
                throw "flock.resolve: invalid path";
            }

            var keys,
                i,
                key;

            // splitting along dots
            keys = path.length ? path.replace(RE_PATH_SKIPPER, function (match, offset) {
                return offset ? '..' : '.';
            }).split('.') : [];

            for (i = 0; i < keys.length; i++) {
                key = keys[i];
                if (key === '') {
                    // substituting nulls in place of empty strings
                    keys[i] = null;
                } else if (key.indexOf(',') > -1) {
                    // splitting along commas to form multiple choice keys
                    keys[i] = key.split(',');
                }
            }

            return keys;
        } else {
            throw "flock.resolve: invalid argument";
        }
    };
}());
