/**
 * Single Node Functionality
 */
/*global flock */

flock.single = (function ($utils, $path) {
    var self,
        ctor;

    //////////////////////////////
    // Static

    self = {
        /**
         * Gets a single value from the given datastore path.
         * @param root {object} Source node.
         * @param path {string|string[]} Datastore path.
         * @returns {object} Node on specified path.
         */
        get: function (root, path) {
            var result = root,
                tpath = $path.normalize(path),
                key;

            while (tpath.length) {
                // taking next key on path
                key = tpath.shift();

                if (result.hasOwnProperty(key)) {
                    // taking next node on path when there is such
                    result = result[key];
                } else {
                    // returning undefined when path doesn't exist
                    return undefined;
                }
            }

            return result;
        },

        /**
         * Sets a singe value on the given datastore path.
         * @param root {object} Source node.
         * @param path {string|string[]} Datastore path.
         * @param [value] {object} Value to set on path
         */
        set: function (root, path, value) {
            value = value || {};

            var parent = root,
                tpath = $path.normalize(path),
                key;

            while (true) {
                // taking next key on path
                key = tpath.shift();

                if (tpath.length === 0) {
                    // leaf node reached
                    break;
                } else {
                    // taking (and optionally creating) next node on path
                    if (!parent.hasOwnProperty(key)) {
                        parent[key] = {};
                    }
                    parent = parent[key];
                }
            }

            // setting value as leaf node
            parent[key] = value;
        },

        /**
         * Increments value on the object's key.
         * @param root {object} Source node.
         * @param path {string|string[]} Datastore path.
         * @param [value] {number} Optional value to add to key.
         */
        add: function (root, path, value) {
            var tpath = $path.normalize(path),
                key = tpath.pop(),
                parent = self.get(root, tpath);

            if (parent.hasOwnProperty(key) &&
                typeof parent[key] === 'number'
                ) {
                // incrementing value on path assuming it exists and is number
                parent[key] += value || 1;
            }
        },

        /**
         * Removes a single node from the datastore.
         * @param root {object} Source node.
         * @param path {string|string[]} Datastore path.
         */
        unset: function (root, path) {
            var tpath = $path.normalize(path),
                key = tpath.pop(),
                parent = self.get(root, tpath);

            // removing leaf node
            delete parent[key];
        },

        /**
         * Removes a node from the datastore. Cleans up empty parent nodes
         * until the first non-empty ancestor node.
         * @param root {object} Source node.
         * @param path {string|string[]} Datastore path.
         */
        cleanup: function (root, path) {
            var tpath = $path.normalize(path),
                key, parent;

            do {
                // removing leaf key from path
                key = tpath.pop();

                // taking parent and removing leaf node
                parent = self.get(root, tpath);
                delete parent[key];
            } while (
                // continue when remaining leaf node is empty
                tpath.length && $utils.isEmpty(parent)
                );
        },

        /**
         * Transforms node structure by taking descendant values as keys in the output.
         * @param node {object} Source node. Object with uniform child objects.
         * Additional parameters specify the paths (in array or string notation) from whence
         * to take the transformed node's keys.
         * Empty array as last path will put the original child node as leaf node.
         * @returns {object} Transformed node.
         * @throws {string} When immediate child nodes are not objects.
         * @example See unit test.
         */
        map: function (node) {
            var result = {},
                paths = [],
                item, path, last,
                i;

            // normalizing paths
            for (i = 1; i < arguments.length; i++) {
                paths.push($path.normalize(arguments[i]));
            }

            // walking through all immediate child nodes
            for (item in node) {
                if (node.hasOwnProperty(item)) {
                    // constructing output path from data on input paths
                    path = [];
                    for (i = 0; i < paths.length - 1; i++) {
                        path.push(self.get(node, [item].concat(paths[i])));
                    }
                    last = paths[paths.length - 1];

                    // storing node on last input path on constructed output path
                    self.set(result, path, self.get(node, [item].concat(last)));
                }
            }

            return result;
        }
    };

    //////////////////////////////
    // Instance

    ctor = function (root) {
        var args = [root];
        return {
            // getters
            root: function () { return root; },

            get: $utils.genMethod(self.get, args),
            set: $utils.genMethod(self.set, args),
            add: $utils.genMethod(self.add, args),
            unset: $utils.genMethod(self.unset, args),
            cleanup: $utils.genMethod(self.cleanup, args),
            map: $utils.genMethod(self.map, args)
        };
    };

    // adding static methods
    $utils.delegate(ctor, self);

    return ctor;
}(
    flock.utils,
    flock.path
));
