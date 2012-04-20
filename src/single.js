/**
 * Single Node Functionality
 *
 * Implements setting, retrieval, and removal of specific datastore
 * nodes one at a time.
 */
/*global flock */

flock.single = (function ($path, $utils) {
    //////////////////////////////
    // Class

    /**
     * @class Single node datastore behavior.
     * @param root {object} Source node.
     */
    var ctor = function (root) {
        var self = {
            /**
             * Getter for datastore root
             */
            root: function () {
                return root;
            },

            /**
             * Gets a single value from the given datastore path.
             * @param path {string|string[]} Datastore path.
             * @returns {object} Node on specified path.
             */
            get: function (path) {
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
                        result = undefined;
                        break;
                    }
                }

                return !this.wrap ?
                    result :
                    this.wrap(result);
            },

            /**
             * Sets a singe value on the given datastore path.
             * @param path {string|string[]} Datastore path.
             * @param [value] {object} Value to set on path
             */
            set: function (path, value) {
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

                return this;
            },

            /**
             * Increments value on the object's key.
             * @param path {string|string[]} Datastore path.
             * @param [value] {number} Optional value to add to key.
             */
            add: function (path, value) {
                var tpath = $path.normalize(path),
                    key = tpath.pop(),
                    parent = self.get(tpath);

                if (parent.hasOwnProperty(key) &&
                    typeof parent[key] === 'number'
                    ) {
                    // incrementing value on path assuming it exists and is number
                    parent[key] += value || 1;
                }

                return this;
            },

            /**
             * Removes a single node from the datastore.
             * @param path {string|string[]} Datastore path.
             */
            unset: function (path) {
                var tpath = $path.normalize(path),
                    key = tpath.pop(),
                    parent = self.get(tpath);

                // removing leaf node
                delete parent[key];

                return this;
            },

            /**
             * Removes a node from the datastore. Cleans up empty parent nodes
             * until the first non-empty ancestor node.
             * @param path {string|string[]} Datastore path.
             */
            cleanup: function (path) {
                var tpath = $path.normalize(path),
                    key, parent;

                do {
                    // removing leaf key from path
                    key = tpath.pop();

                    // taking parent and removing leaf node
                    parent = self.get(tpath);
                    delete parent[key];
                } while (
                    // continue when remaining leaf node is empty
                    tpath.length && $utils.isEmpty(parent)
                    );

                return this;
            }
        };

        return self;
    };

    //////////////////////////////
    // Static methods

    /**
     * Transforms node structure by taking descendant values as keys in the output.
     * @param node {object} Source node. Object with uniform child objects.
     * TODO: check whether node argument is a flock object and return dest instead of dest.root()
     * Additional parameters specify the paths (in array or string notation) from whence
     * to take the transformed node's keys.
     * Empty array as last path will put the original child node as leaf node.
     * @returns {object} Transformed node.
     */
    ctor.map = function (node) {
        var
            // source and destination buffers
            source = ctor(node),
            dest = ctor({}),

            // path buffer
            paths = [],

            // loop variables
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
                    path.push(source.get([item].concat(paths[i])));
                }
                last = paths[paths.length - 1];

                // storing node on last input path on constructed output path
                dest.set(path, source.get([item].concat(last)));
            }
        }

        return dest.root();
    };

    return ctor;
}(
    flock.path,
    flock.utils
));
