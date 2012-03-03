/**
 * Core Datastore Functionality
 */
/*global flock*/

flock.core = (function (utils) {
    var self;

    self = {
        /**
         * Gets a single value from the given datastore path.
         * @param root {object} Datastore root.
         * @param path {Array} Datastore path.
         */
        get: function (root, path) {
            var i, key,
                node = root;

            for (i = 0; i < path.length; i++) {
                key = path[i];
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
         * @param root {object} Datastore root.
         * @param path {Array} Datastore path.
         * @param value {object} Value to set on path
         */
        set: function (root, path, value) {
            var i, key,
                name = path.pop(),
                node = root;

            for (i = 0; i < path.length; i++) {
                key = path[i];
                if (!node.hasOwnProperty(key)) {
                    node[key] = {};
                }
                node = node[key];
            }

            // setting value as leaf node
            node[name] = value;

            return flock;
        },

        /**
         * Removes a single node from the datastore.
         * @param root {object} Datastore root.
         * @param path {Array} Datastore path.
         */
        unset: function (root, path) {
            var name = path.pop(),
                parent = self.get(root, path);

            if (typeof parent === 'object' &&
                parent.hasOwnProperty(name)
                ) {
                // removing node node
                delete parent[name];
            }

            return flock;
        },

        /**
         * Removes a node from the datastore. Cleans up empty parent nodes
         * until the first non-empty ancestor node.
         * @param root {object} Datastore root.
         * @param path {Array} Datastore path.
         */
        cleanup: function (root, path) {
            var i, key,
                node = root,
                lastMulti = {
                    node: root,
                    name: utils.firstProperty(root)
                };

            for (i = 0; i < path.length; i++) {
                key = path[i];
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
                    return flock;
                }
            }

            // cutting back to last multi-property node
            if (lastMulti) {
                delete lastMulti.node[lastMulti.name];
            }

            return flock;
        }
    };

    return self;
}(flock.utils));
