/**
 * Single Node Functionality
 *
 * Implements setting, retrieval, and removal of specific datastore
 * nodes one at a time.
 */
var flock = flock || {};

flock.single = (function ($node, $path, $utils) {
    var self = $utils.extend($node, {
        /**
         * @constructor
         * @param root {object} Source node.
         * @param [options] {object}
         * @param [options.nochaining] {boolean} Whether query methods are chainable.
         * @param [origin] {object}
         * @param [origin.ds] {flock.single} Origin datastore.
         * @param [origin.path] {string[]} Path of root relative to root of origin datastore.
         */
        create: function (root, options, origin) {
            options = options || {};
            origin = origin || {
                ds: undefined,
                offset: []
            };

            /**
             * Defaulting root to empty object when nor root
             * neither origin is specified.
             */
            if (typeof origin.ds === 'undefined' &&
                typeof root === 'undefined'
                ) {
                root = {};
            }

            return Object.create(self, {
                root: {value: root, writable: false},
                options: {value: options, writable: false},
                origin: {value: origin, writable: false}
            });
        },

        //////////////////////////////
        // Utilities

        /**
         * Wraps node in datastore object.
         * @param node {object} Datastore node.
         */
        wrap: function (node) {
            return this.create.apply(this, arguments);
        },

        //////////////////////////////
        // Control

        /**
         * Gets a single value from the given datastore path.
         * @param path {string|string[]} Datastore path.
         * @param [nochaining] {boolean} Whether method should return bare node.
         * @returns {object} Node on specified path.
         */
        get: function (path, nochaining) {
            path = $path.normalize(path);

            var result = this.root,
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

            return nochaining || this.options.nochaining ?
                result :
                this.wrap(result, this.options, {
                    ds: this.origin.ds || this,
                    offset: this.origin.offset.concat(path)
                });
        },

        /**
         * Sets a singe value on the given datastore path.
         * @param path {string|string[]} Datastore path.
         * @param [value] {object} Value to set on path
         */
        set: function (path, value) {
            var parent = this.root,
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
                parent = this.get(tpath, true);

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
                parent = this.get(tpath, true);

            // removing leaf node
            if (typeof parent === 'object') {
                delete parent[key];
            }

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
                parent = this.get(tpath, true);
                if (typeof parent === 'object') {
                    delete parent[key];
                } else {
                    break;
                }
            } while (
                // continue when remaining leaf node is empty
                tpath.length && $node.create(parent).isEmpty()
                );

            return this;
        },

        /**
         * Transforms node structure by taking descendant values as keys in the output.
         * Additional parameters specify the paths (in array or string notation) from whence
         * to take the transformed node's keys.
         * Empty array as last path will put the original child node as leaf node.
         * @returns {object} Transformed node.
         */
        map: function () {
            var
                // source and destination buffers
                source = flock.single.create(this.root),
                dest = this.wrap({}),

                // path buffer
                paths = [],

                // loop variables
                item, path, last,
                i;

            // normalizing paths
            for (i = 0; i < arguments.length; i++) {
                paths.push($path.normalize(arguments[i]));
            }

            // walking through all immediate child nodes
            for (item in this.root) {
                if (this.root.hasOwnProperty(item)) {
                    // constructing output path from data on input paths
                    path = [];
                    for (i = 0; i < paths.length - 1; i++) {
                        path.push(source.get([item].concat(paths[i]), true));
                    }
                    last = paths[paths.length - 1];

                    // storing node on last input path on constructed output path
                    dest.set(path, source.get([item].concat(last), true));
                }
            }

            return this.options.nochaining ?
                dest.root :
                dest;
        }
    });

    return self;
}(
    flock.node,
    flock.path,
    flock.utils
));
