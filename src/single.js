/**
 * Single Node Functionality
 */
/*global flock */

flock.single = (function ($utils, $path) {
    var self = {
        //////////////////////////////
        // Control

        /**
         * Gets a single value from the given datastore path.
         * @this {object} Source node.
         * @param path {string|string[]} Datastore path.
         */
        get: function (path) {
            var root = this,
                key;

            path = $path.normalize(path);

            while (path.length) {
                key = path.shift();
                if (root.hasOwnProperty(key)) {
                    root = root[key];
                } else {
                    return;
                }
            }

            return root;
        },

        /**
         * Sets a singe value on the given datastore path.
         * @this {object} Source node.
         * @param path {string|string[]} Datastore path.
         * @param [value] {object} Value to set on path
         * @returns {object} Parent of the changed node.
         */
        set: function (path, value) {
            value = value || {};

            var root = this,
                tpath = $path.normalize(path),
                name = tpath.pop(),
                key;

            while (tpath.length) {
                key = tpath.shift();
                if (!root.hasOwnProperty(key)) {
                    root[key] = {};
                }
                root = root[key];
            }

            // setting value as leaf node
            root[name] = value;

            return this;
        },

        /**
         * Increments value on the object's key.
         * @this {object} Source node.
         * @param path {string|string[]} Datastore path.
         * @param [value] {number} Optional value to add to key.
         */
        add: function (path, value) {
            var tpath = $path.normalize(path),
                key = tpath.pop(),
                parent = self.get.call(this, tpath);

            if (parent.hasOwnProperty(key) &&
                typeof parent[key] === 'number'
                ) {
                parent[key] += value || 1;
            }

            return this;
        },

        /**
         * Removes a single node from the datastore.
         * @this {object} Source node.
         * @param path {string|string[]} Datastore path.
         * @returns {object} Object with name and parent of removed node.
         */
        unset: function (path) {
            var tpath = $path.normalize(path),
                name = tpath.pop(),
                parent = self.get.call(this, tpath);

            // removing leaf node
            delete parent[name];

            return this;
        },

        /**
         * Removes a node from the datastore. Cleans up empty parent nodes
         * until the first non-empty ancestor node.
         * @this {object} Source node.
         * @param path {string|string[]} Datastore path.
         * @returns {object|boolean} Object with name and parent of removed node.
         */
        cleanup: function (path) {
            var tpath = $path.normalize(path),
                key, parent;

            do {
                key = tpath.pop();
                parent = self.get.call(this, tpath);
                delete parent[key];
            } while (tpath.length && $utils.isEmpty(parent));

            return {
                parent: parent,
                key: key
            };
        },

        /**
         * Transforms node structure by taking descendant values as keys in the output.
         * @this {object} Source node. Object with uniform child objects.
         * Additional parameters specify the paths (in array or string notation) from whence
         * to take the transformed node's keys.
         * Empty array as last path will put the original child node as leaf node.
         * @returns {object} Transformed node.
         * @throws {string} When immediate child nodes are not objects.
         * @example See unit test.
         */
        map: function () {
            var node = this,
                result = {},
                paths = [],
                item, path, last,
                i;

            // normalizing paths
            for (i = 0; i < arguments.length; i++) {
                paths.push($path.normalize(arguments[i]));
            }

            for (item in node) {
                if (node.hasOwnProperty(item)) {
                    if (typeof node[item] === 'object') {
                        path = [];
                        for (i = 0; i < paths.length - 1; i++) {
                            path.push(self.get.call(node, [item].concat(paths[i])));
                        }
                        last = paths[paths.length - 1];
                        self.set.call(result, path, self.get.call(node, [item].concat(last)));
                    }
                }
            }

            return result;
        }
    };

    return self;
}(flock.utils,
    flock.path));
