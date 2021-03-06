/**
 * Single Node Functionality
 *
 * Implements setting, retrieval, and removal of specific datastore
 * nodes one at a time.
 */
/*global troop, flock */
troop.promise(flock, 'Single', function (ns, className, Node, Path) {
    var base = flock.Node,
        self;

    self = flock.Single = base.extend()
        .addMethod({
            /**
             * @constructor
             * @param root {object} Source node.
             * @param [options] {object}
             * @param [options.nochaining] {boolean} Whether query methods are chainable.
             * @param [options.origin] {flock.Single} Origin datastore.
             * @param [options.offset] {string[]} Path of root relative to root of origin datastore.
             */
            init: function (root, options) {
                options = options || {};

                /**
                 * Defaulting root to empty object when nor root
                 * neither origin is specified.
                 */
                if (typeof options.origin === 'undefined' &&
                    typeof root === 'undefined'
                    ) {
                    root = {};
                }

                this
                    .addConstant({
                        root      : root,
                        options   : options, // for internal use
                        nochaining: options.nochaining,
                        origin    : options.origin,
                        offset    : options.offset ? options.offset : []
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
                path = Path.normalize(path);

                var result = this.root,
                    tpath = Path.normalize(path),
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

                return nochaining || this.nochaining ?
                    result :
                    this.wrap(result,
                        troop.Base.addPublic.call(
                            troop.Base.addPublic.call({}, this.options),
                            {
                                origin: this.origin || this,
                                offset: this.offset.concat(path)
                            }
                        )
                    );
            },

            /**
             * Sets a singe value on the given datastore path.
             * @param path {string|string[]} Datastore path.
             * @param [value] {object} Value to set on path
             */
            set: function (path, value) {
                var parent = this.root,
                    tpath = Path.normalize(path),
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
             * @param [inc] {number} Optional increment.
             */
            add: function (path, inc) {
                var tpath = Path.normalize(path),
                    value = self.get.call(this, tpath, true) || 0;

                if (typeof value === 'number') {
                    this.set(tpath, value + (inc || 1));
                }

                return this;
            },

            /**
             * Removes a single node from the datastore.
             * @param path {string|string[]} Datastore path.
             */
            unset: function (path) {
                var tpath = Path.normalize(path),
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
                var tpath = Path.normalize(path),
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
                    tpath.length && Node.create(parent).isEmpty()
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
                    source = flock.Single.create(this.root),
                    dest = this.wrap({}),

                // path buffer
                    paths = [],

                // loop variables
                    item, path, last,
                    i;

                // normalizing paths
                for (i = 0; i < arguments.length; i++) {
                    paths.push(Path.normalize(arguments[i]));
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

                return this.nochaining ?
                    dest.root :
                    dest;
            }
        });

    return self;
}, flock.Node, flock.Path);
