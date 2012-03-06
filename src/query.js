/**
 * Complex Queries
 */
/*global flock */

flock.query = (function (constants, utils) {
    var RE_PATH_VALIDATOR = /^(\.{3})*([^\.,]+(\.{1,3}|,))*[^\.,]+$/,
        RE_PATH_SKIPPER = /\.{2,}/,

        ignoredKey,
        errors, privates, self;

    errors = {
        ERROR_INVALIDPATH: "Invalid path."
    };

    privates = {
        /**
         * Processes key node.
         * TODO: getting rid of i, obj, and depth params
         * @param key {string} Key in object to proceed to.
         * @param obj {object} Node to walk.
         * @param i {number} Current position in path,
         * @param depth {number} Current depth in tree.
         * @return {boolean} Whether to terminate traversal.
         * @this {object} Traversal state object.
         */
         node: function (key, i, obj, depth) {
            if (key === ignoredKey) {
                return false;
            }

            var value,
                that = this;

            if (i < that.last) {
                // current node has children, burrowing one level deeper
                if (obj.hasOwnProperty(key)) {
                    privates.walk.call(that, obj[key], i + 1, depth + 1);
                }
            } else {
                // leaf node reached
                if (typeof that.options.mode !== 'undefined') {
                    // when querying or deleting
                    value = obj[key];
                    if (that.options.undef || typeof value !== 'undefined') {
                        switch (that.options.mode) {
                        case constants.VALUES:
                            // collecting value from nodes
                            that.result.push(value);
                            break;
                        case constants.KEYS:
                            // collecting key from node
                            that.result.push(key);
                            break;
                        case constants.BOTH:
                            // collecting key AND value from node
                            // WARNING: new values with same key overwrite old
                            that.result[key] = value;
                            break;
                        case constants.DEL:
                            // deleting node
                            delete obj[key];
                            break;
                        case constants.COUNT:
                            // counting node
                            that.result++;
                            break;
                        }
                        if (--that.limit === 0) {
                            return true;
                        }
                    }
                } else {
                    // when updating
                    if (typeof that.options.value === 'function') {
                        // calling custom handler on node
                        value = that.options.value(obj[key]);
                        if (typeof value !== 'undefined') {
                            obj[key] = value;
                        }
                    } else {
                        // assigning custom value to key
                        obj[key] = that.options.value;
                    }
                    if (--that.limit === 0) {
                        return true;
                    }
                }
            }
            return false;
        },

        /**
         * Collects end nodes. Used internally.
         * @param obj {object} Node to walk.
         * @param i {number} Current position in path,
         * @param depth {number} Current depth in tree.
         * @this {object} Traversal state object.
         */
        walk: function walk(obj, i, depth) {
            var key, j,
                that = this;

            // detecting loopback
            if (!that.loopback) {
                for (j = 0; j < depth; j++) {
                    if (obj === that.stack[j]) {
                        return;
                    }
                }
                // putting current object on the stack
                that.stack[depth] = obj;
            }


            // processing next key in path
            key = that.path[i];
            if (key === '*') {
                // processing wildcard node
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (privates.node.call(that, key, i, obj, depth)) {
                            return;
                        }
                    }
                }
            } else if (key === null && typeof obj === 'object') {
                // processing skipper node
                // must be object type as strings have indexes, too
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (key === that.path[i + 1]) {
                            // current key matches next key in path
                            // re-walking current object but leving skipper key
                            privates.walk.call(that, obj, i + 1, depth);
                        } else {
                            // current key doesn't match next key in path
                            // walking next level, but staying on skipper key
                            privates.walk.call(that, obj[key], i, depth + 1);
                        }
                    }
                }
            } else if (key instanceof Array) {
                // processing list of nodes
                for (j = 0; j < key.length; j++) {
                    if (privates.node.call(that, key[j], i, obj, depth)) {
                        return;
                    }
                }
            } else {
                // processing single node
                key = that.path[i];
                if (privates.node.call(that, key, i, obj, depth)) {
                    return;
                }
            }
        }
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
                    throw "flock.query.normalizePath: " + errors.ERROR_INVALIDPATH;
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
                throw "flock.query.normalizePath: " + errors.ERROR_INVALIDPATH;
            }
        },

        /**
         * Collects or modifies end nodes.
         * @param node {object} Datastore root.
         * @param path {string|Array} Datastore path expression.
         * @param [options] {object} Options.
         *  - limit: max number of entries to retrieve, default: unlimited
         *  - mode: type of return value is Object or Array (flock.key/flock.values/flock.both/flock.del), default: flock.array
         *  - loopback: whether to traverse loopbacks, default: false
         *  - undef: whether to collect undefined entries, default: false
         *  - value: value to set, or callback function to execute on nodes
         *    when undefined, function returns collected values
         * @return {object} Collected nodes.
         */
        query: function (node, path, options) {
            options = options || {};

            // setting defaults
            if (typeof options.value === 'undefined' &&
                typeof options.mode === 'undefined'
                ) {
                options.mode = constants.VALUES;
            }

            var tpath = typeof path === 'object' ? path.concat([]) : self.normalizePath(path),
                state;

            // default case
            if (!tpath.length) {
                return node;
            }

            state = {
                options: options,
                path: tpath,
                last: tpath.length - 1,
                limit: options.limit || 0,
                loopback: options.loopback || false,
                result : {2: {}, 4: 0}[options.mode] || [],
                stack: options.loopback ? null : []
            };

            // walking sub-tree and collecting matching nodes
            privates.walk.call(state, node, 0, 0);

            return state.result;
        }
    };

    // delegating errors
    utils.delegate(self, errors);

    return self;
}(flock.constants,
    flock.utils));
