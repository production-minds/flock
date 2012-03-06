/**
 * Complex Queries
 */
/*global flock */

flock.query = (function (constants) {
    var RE_PATH_VALIDATOR = /^(\.{3})*([^\.,]+(\.{1,3}|,))*[^\.,]+$/,
        RE_PATH_SKIPPER = /\.{2,}/,

        ignoredKey,
        errors, self;

    errors = {
        ERROR_INVALIDPATH: "Invalid path."
    };

    self = {
        /**
         * Setter for excluded key. When set, traversal will
         * ignore nodes with the specified key.
         * @param [value] {string} Key to be ignored. When ommitted, clears ignored key.
         */
        ignoredKey: function (value) {
            if (typeof value === 'string' ||
                typeof value === 'undefined'
                ) {
                ignoredKey = value;
            }
        },

        /**
         * Validates and normalizes datastore path.
         * @param path {string|Array} Datastore path.
         * @example
         * 'contacts.smith.*.ancestors...name'
         * will get the names of all ancestor names for contacts w/ last name 'smith'
         * @return {Array} Valid datastore path in array notation.
         * @throws {string} On invalid input path.
         */
        normalizePath: function (path) {
            if (typeof path === 'string') {
                // validating path
                if (path.length && !RE_PATH_VALIDATOR.test(path)) {
                    throw "flock.resolve: " + errors.ERROR_INVALIDPATH;
                }

                var tpath,
                    i, key;

                // splitting along dots
                tpath = path.length ?
                    path.replace(
                        RE_PATH_SKIPPER,
                        function (match, offset) {
                            return offset ? '..' : '.';
                        }
                    ).split('.') :
                    [];

                for (i = 0; i < tpath.length; i++) {
                    key = tpath[i];
                    if (key === '') {
                        // substituting nulls in place of empty strings
                        tpath[i] = null;
                    } else if (key.indexOf(',') > -1) {
                        // splitting along commas to form multiple choice keys
                        tpath[i] = key.split(',');
                    }
                }

                return tpath;
            } else if (path instanceof Array) {
                return path.concat([]);
            } else {
                throw "flock.resolve: " + errors.ERROR_INVALIDPATH;
            }
        },

        /**
         * Collects or modifies end nodes.
         * @param root {object} Datastore root.
         * @param path {string|Array} Datastore path expression.
         * @param [options] {object} Options.
         *     - limit: max number of entries to retrieve, default: unlimited
         *     - mode: type of return value is Object or Array (flock.key/flock.values/flock.both/flock.del), default: flock.array
         *     - loopback: whether to traverse loopbacks, default: false
         *     - undef: whether to collect undefined entries, default: false
         *     - value: value to set, or callback function to execute on nodes
         *       when undefined, function returns collected values
         * @return {object} Collected nodes.
         */
        query: function (root, path, options) {
            options = options || {};

            // setting defaults
            if (typeof options.value === 'undefined' &&
                typeof options.mode === 'undefined'
                ) {
                options.mode = constants.values;
            }

            var tpath = typeof path === 'object' ? path.concat([]) : self.normalizePath(path),
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
                    if (key === ignoredKey) {
                        return false;
                    }

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
                                case constants.values:
                                    // collecting value from nodes
                                    result.push(value);
                                    break;
                                case constants.keys:
                                    // collecting key from node
                                    result.push(key);
                                    break;
                                case constants.both:
                                    // collecting key AND value from node
                                    // WARNING: new values with same key overwrite old
                                    result[key] = value;
                                    break;
                                case constants.del:
                                    // deleting node
                                    delete obj[key];
                                    break;
                                case constants.count:
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
}(flock.constants));
