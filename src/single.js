/**
 * Single Node Functionality
 */
/*global flock*/

flock.single = (function (u_utils, u_path) {
    var errors, self;

    errors = {
        ERROR_INVALIDNODE: "Invalid node."
    };

    self = {
        //////////////////////////////
        // Control

        /**
         * Gets a single value from the given datastore path.
         * @param node {object} Datastore root.
         * @param path {string|Array} Datastore path.
         */
        get: function (node, path) {
            var key,
                tpath = u_path.normalize(path);

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
         * @param [value] {object} Value to set on path
         * @returns {object} Parent of the changed node.
         */
        set: function (node, path, value) {
            value = value || {};

            var key,
                tpath = u_path.normalize(path),
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
         * Clears node. Deletes all child nodes.
         * @param node {object} Datastore node.
         */
        clear: function (node) {
            var key;
            for (key in node) {
                if (node.hasOwnProperty(key)) {
                    delete node[key];
                }
            }
        },

        /**
         * Removes a single node from the datastore.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         * @returns {object} Parent of the removed node.
         */
        unset: function (node, path) {
            var tpath = u_path.normalize(path),
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
            var tpath = u_path.normalize(path),
                key,
                lastMulti = {
                    node: node,
                    name: u_utils.firstProperty(node)
                };

            while (tpath.length) {
                key = tpath.shift();
                if (node.hasOwnProperty(key)) {
                    if (!u_utils.isSingle(node)) {
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
        },

        /**
         * Transforms node structure by taking descendant values as keys in the output.
         * @param node {object} Source node. Object with uniform child objects.
         * Additional parameters specify the paths (in array notation) from whence
         * to take the transformed node's keys.
         * Empty array as last path will put the original child node as leaf node.
         * @returns {object} Transformed node.
         * @throws {string} When immediate child nodes are not objects.
         * @example See unit test.
         */
        transform: function (node) { /*, path1, path2 */
            var result = {},
                item, path, last,
                i;

            for (item in node) {
                if (node.hasOwnProperty(item)) {
                    if (typeof node[item] === 'object') {
                        path = [];
                        for (i = 1; i < arguments.length - 1; i++) {
                            path.push(self.get(node, [item].concat(arguments[i])));
                        }
                        last = arguments[arguments.length - 1];
                        self.set(result, path, self.get(node, [item].concat(last)));
                    } else {
                        throw "flock.single.transform: " + errors.ERROR_INVALIDNODE;
                    }
                }
            }

            return result;
        }
    };

    // delegating errors
    u_utils.delegate(self, errors);

    return self;
}(flock.utils,
    flock.path));
