/**
 * Single Node Functionality
 *
 * Implements setting, retrieval, and removal of specific datastore
 * nodes one at a time.
 */
/*global dessert, troop, flock */
troop.promise(flock, 'Single', function () {
    var base = flock.Node,
        self = base.extend();

    /**
     * @class flock.Single
     * @extends flock.Node
     */
    flock.Single = self
        .addMethod(/** @lends flock.Single */{
            /**
             * @param {object} root Source node.
             */
            init: function (root) {
                this.addConstant(/** @lends flock.Single */{
                    root: typeof root === 'undefined' ? {} : root
                });
            },

            /**
             * Gets a single value from the given datastore path.
             * @param {string|string[]} path Datastore path.
             * @returns {object} Node on specified path.
             */
            get: function (path) {
                path = flock.Path.normalize(path);

                var result = this.root,
                    tpath = flock.Path.normalize(path),
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

                return result;
            },

            /**
             * Sets a singe value on the given datastore path.
             * @param {string|string[]} path Datastore path.
             * @param {object} [value] Value to set on path
             */
            set: function (path, value) {
                var parent = this.root,
                    tpath = flock.Path.normalize(path),
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
             * @param {string|string[]} path Datastore path.
             * @param {number} [inc] Optional increment.
             */
            add: function (path, inc) {
                var tpath = flock.Path.normalize(path),
                    value = self.get.call(this, tpath, true) || 0;

                if (typeof value === 'number') {
                    this.set(tpath, value + (inc || 1));
                }

                return this;
            },

            /**
             * Removes a single node from the datastore.
             * @param {string|string[]} path Datastore path.
             */
            unset: function (path) {
                var tpath = flock.Path.normalize(path),
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
             * @param {string|string[]} path Datastore path.
             */
            cleanup: function (path) {
                var tpath = flock.Path.normalize(path),
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
                    tpath.length && flock.Node.create(parent).isEmpty()
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
                var currentClass = this.getBase(),
                    sourceDs = currentClass.create(this.root), // source datastore
                    destinationDs = currentClass.create(), // destination datastore
                    paths = [], // path buffer
                    item, path, last,
                    i;

                // normalizing paths
                for (i = 0; i < arguments.length; i++) {
                    paths.push(flock.Path.normalize(arguments[i]));
                }

                // walking through all immediate child nodes
                for (item in this.root) {
                    if (this.root.hasOwnProperty(item)) {
                        // constructing output path from data on input paths
                        path = [];
                        for (i = 0; i < paths.length - 1; i++) {
                            path.push(sourceDs.get([item].concat(paths[i]), true));
                        }
                        last = paths[paths.length - 1];

                        // storing node on last input path on constructed output path
                        destinationDs.set(path, sourceDs.get([item].concat(last), true));
                    }
                }

                return destinationDs.root;
            }
        });
});
