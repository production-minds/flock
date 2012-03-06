/**
 * Core Datastore Functionality
 */
/*global flock*/

flock.core = (function (utils) {
    var RE_PATHVALIDATOR = /^([^\.]+\.)*[^\.]+$/,
        RE_PATHSEPARATOR = /\./,
        errors, self;

    errors = {
        ERROR_INVALIDPATH: "Invalid path."
    };

    self = {
        //////////////////////////////
        // Control

        /**
         * Validates simple datastore path.
         * @param path {string|Array} Datastore path to be validated.
         * @returns {object|boolean} Path in array notation when valid, or false.
         * @throws {string} On invalid path.
         */
        normalizePath: function (path) {
            var result;
            if (typeof path === 'string') {
                // validating string path
                if (path.match(RE_PATHVALIDATOR)) {
                    // generating array notation by splitting string
                    result = path.split(RE_PATHSEPARATOR);
                } else {
                    throw "flock.core.normalizePath: " + errors.ERROR_INVALIDPATH;
                }
            } else if (path instanceof Array) {
                // creating shallow copy of path array
                result = path.concat([]);
            } else {
                throw "flock.core.normalizePath: " + errors.ERROR_INVALIDPATH;
            }
            return result;
        },

        /**
         * Gets a single value from the given datastore path.
         * @param node {object} Datastore root.
         * @param path {string|Array} Datastore path.
         */
        get: function (node, path) {
            var key,
                tpath = self.normalizePath(path);

            while (tpath.length) {
                key = tpath.shift();
                if (node.hasOwnProperty(key)) {
                    node = node[key];
                } else {
                    return;
                }
            }

            return node;
        },

        /**
         * Sets a singe value on the given datastore path.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         * @param value {object} Value to set on path
         * @returns {object} Parent of the changed node.
         */
        set: function (node, path, value) {
            var key,
                tpath = self.normalizePath(path),
                name = tpath.pop();

            while (tpath.length) {
                key = tpath.shift();
                if (!node.hasOwnProperty(key)) {
                    node[key] = {};
                }
                node = node[key];
            }

            // setting value as leaf node
            node[name] = value;

            return node;
        },

        /**
         * Removes a single node from the datastore.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         * @returns {object} Parent of the removed node.
         */
        unset: function (node, path) {
            var tpath = self.normalizePath(path),
                name = tpath.pop(),
                parent = self.get(node, tpath);

            if (typeof parent === 'object' &&
                parent.hasOwnProperty(name)
                ) {
                // removing node node
                delete parent[name];
            }

            return parent;
        },

        /**
         * Removes a node from the datastore. Cleans up empty parent nodes
         * until the first non-empty ancestor node.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         */
        cleanup: function (node, path) {
            var tpath = self.normalizePath(path),
                key,
                lastMulti = {
                    node: node,
                    name: utils.firstProperty(node)
                };

            while (tpath.length) {
                key = tpath.shift();
                if (node.hasOwnProperty(key)) {
                    if (!utils.isSingle(node)) {
                        lastMulti = {
                            node: node,
                            name: key
                        };
                    }
                    node = node[key];
                } else {
                    // invalid path, nothing to unset
                    return;
                }
            }

            // cutting back to last multi-property node
            if (lastMulti) {
                delete lastMulti.node[lastMulti.name];
            }
        }
    };

    // delegating errors
    utils.delegate(self, errors);

    return self;
}(flock.utils));
