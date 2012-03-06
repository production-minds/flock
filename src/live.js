/**
 * Live Datastore Functionality
 *
 * The live datastore enables bidirectional 'blind' traversal between nodes.
 */
/*global flock */

flock.live = (function (core, utils) {
    var META = '.meta',
        errors, privates, self;

    errors = {
        ERROR_NONTRAVERSABLE: "Non-traversable datastore node.",
        ERROR_FORBIDDENKEY: "Forbidden key."
    };

    privates = {
        /**
         * Adds meta node to a single datastore node. When no explicit node is provided,
         * node is identified by its parent and name.
         * @param parent {object} Reference to parent node.
         * @param name {string} Name of node in parent.
         * @param [node] {object} Datastore node.
         * @returns {boolean} Whether addition of meta node was successful.
         */
        addMeta: function (parent, name, node) {
            var meta;

            // taking node from parent when no node is explicitly provided
            node = node || parent[name];

            if (!node.hasOwnProperty(META)) {
                // adding meta node
                meta = node[META] = {};
                meta.self = node;
                if (typeof parent === 'object' &&
                    typeof name === 'string') {
                    meta.parent = parent;
                    meta.name = name;
                }
                return true;
            } else {
                return false;
            }
        },

        /**
         * Removes meta node from datastore node.
         * @param node {object} Datastore node.
         * @returns {boolean} Whether removal of meta node was successful.
         */
        removeMeta: function (node) {
            if (node.hasOwnProperty(META)) {
                delete node[META];
                return true;
            } else {
                return false;
            }
        }
    };

    self = {
        //////////////////////////////
        // Constants

        META: META,

        //////////////////////////////
        // Auxiliary

        privates: privates,

        //////////////////////////////
        // Control

        /**
         * Traverses datastore and adds meta-nodes, thus making
         * the datastore information 'live'.
         * Stops traversal when a node already has meta node.
         * (It is to prevent re-initialization of a sub-tree that is
         * referenced from other than its parent node.)
         * @param node {object} Datastore (root) node.
         * @param [parent] {object} Parent node.
         * @param [name] {string} Name of the
         */
        init: function (node, parent, name) {
            var key;
            if (privates.addMeta(parent, name, node)) {
                // when addition is successful
                // (ie. node didn't have a meta node already)

                // processing child nodes
                for (key in node) {
                    if (node.hasOwnProperty(key)) {
                        if (key !== META &&
                            typeof node[key] === 'object'
                            ) {
                            self.init(node[key], node, key);
                        }
                    }
                }
            }
        },

        /**
         * Removes meta nodes from the sub-tree specified by parameter 'node'
         * as a root node.
         * @param node {object} Datastore (root) node.
         */
        deinit: function (node) {
            var key;
            if (privates.removeMeta(node)) {
                // child nodes are ignored when node has no meta node
                // to avoid traversing already traversed branches

                // processing child nodes
                for (key in node) {
                    if (node.hasOwnProperty(key)) {
                        self.deinit(node[key]);
                    }
                }
            }
        },

        //////////////////////////////
        // Access

        /**
         * Sets value on node with meta nodes added.
         * @param node {object} Datastore node.
         * @param path {string|Array} Datastore path.
         * @param value {object} Value to set on path.
         * @returns {object} Parent of the changed node.
         */
        set: function (node, path, value) {
            var parent,
                i, key;

            // checking path for forbidden node
            for (i = 0; i < path.length; i++) {
                if (path[i] === META) {
                    throw "flock.live.set: " + errors.ERROR_FORBIDDENKEY;
                }
            }

            // setting value on path
            parent = core.set(node, path, value);

            // searching for first uninitialized node
            for (i = 0; i < path.length; i++) {
                key = path[i];
                if (!node[key].hasOwnProperty(META)) {
                    break;
                }
                node = node[key];
            }

            // initializing
            self.init(node[key], node, key);

            return parent;
        },

        //////////////////////////////
        // Traversal

        /**
         * Retrieves current path of a node.
         * @param node {object} Datastore node.
         */
        path: function (node) {
            var result = [];
            while (typeof node[META] === 'object' &&
                node[META].hasOwnProperty('name')
                ) {
                result.unshift(node[META].name);
                node = node[META].parent;
            }
            return result;
        },

        /**
         * Returns ancestor node (or self) with the specified name.
         * @param node {object} Datastore node.
         * @param name {string} Node name.
         */
        closest: function (node, name) {
            if (typeof node === 'object' &&
                node.hasOwnProperty(META)
                ) {
                while (typeof node === 'object' &&
                    node[META].name !== name
                    ) {
                    node = node[META].parent;
                }
                return node;
            } else {
                throw "flock.live.parent: " + errors.ERROR_NONTRAVERSABLE;
            }
        },

        /**
         * Returns immediate node parent.
         * @param node {object} Datastore node.
         */
        parent: function (node) {
            if (typeof node === 'object' &&
                node.hasOwnProperty(META)
                ) {
                return node[META].parent;
            } else {
                throw "flock.live.parent: " + errors.ERROR_NONTRAVERSABLE;
            }
        },

        /**
         * Returns node name.
         * @param node {object} Datastore node.
         */
        name: function (node) {
            if (typeof node === 'object' &&
                node.hasOwnProperty(META)
                ) {
                return node[META].name;
            } else {
                throw "flock.live.name: " + errors.ERROR_NONTRAVERSABLE;
            }
        }
    };

    // delegating errors
    utils.delegate(self, errors);

    return self;
}(flock.core,
    flock.utils));
