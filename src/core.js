/**
 * Core Datastore Functionality
 */
/*global flock*/

flock.core = (function (utils) {
    var RE_PATHVALIDATOR = /^([^\.]+\.)*[^\.]+$/,
        RE_PATHSEPARATOR = /\./,
        ERROR_INVALIDPATH = "Invalid path.",
        self;

    self = {
        /**
         * Validates simple datastore path.
         * @param path {string|Array} Datastore path to be validated.
         * @returns {object|boolean} Path in array notation when valid, or false.
         * @throws {string} On invalid path.
         */
        normalizePath: function (path) {
            var result;
            if (typeof path === 'string') {
                if (path.match(RE_PATHVALIDATOR)) {
                    result = path.split(RE_PATHSEPARATOR);
                } else {
                    throw "flock.core.normalizePath: " + ERROR_INVALIDPATH;
                }
            } else if (path instanceof Array) {
                result = path;
            } else {
                throw "flock.core.normalizePath: " + ERROR_INVALIDPATH;
            }
            return result;
        },

        /**
         * Gets a single value from the given datastore path.
         * @param node {object} Datastore root.
         * @param path {Array} Datastore path.
         */
        get: function (node, path) {
            var i, key,
                tpath = self.normalizePath(path);

            for (i = 0; i < tpath.length; i++) {
                key = tpath[i];
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
         * @param path {Array} Datastore path.
         * @param value {object} Value to set on path
         */
        set: function (node, path, value) {
            var i, key,
                tpath = self.normalizePath(path),
                name = tpath.pop();

            for (i = 0; i < tpath.length; i++) {
                key = tpath[i];
                if (!node.hasOwnProperty(key)) {
                    node[key] = {};
                }
                node = node[key];
            }

            // setting value as leaf node
            node[name] = value;
        },

        /**
         * Removes a single node from the datastore.
         * @param node {object} Datastore node.
         * @param path {Array} Datastore path.
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
        },

        /**
         * Removes a node from the datastore. Cleans up empty parent nodes
         * until the first non-empty ancestor node.
         * @param node {object} Datastore node.
         * @param path {Array} Datastore path.
         */
        cleanup: function (node, path) {
            var tpath = self.normalizePath(path),
                i, key,
                lastMulti = {
                    node: node,
                    name: utils.firstProperty(node)
                };

            for (i = 0; i < tpath.length; i++) {
                key = tpath[i];
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

    return self;
}(flock.utils));
