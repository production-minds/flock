/**
 * Live Datastore Functionality
 *
 * The live datastore enables bidirectional 'blind' traversal between nodes.
 */
/*global flock */

flock.live = (function (core) {
    var META = '.meta',
        errors, utils, self;

    errors = {
        ERROR_NONTRAVERSABLE: "Non-traversable datastore node.",
        ERROR_FORBIDDENNODENAME: "Forbidden node name"
    };

    utils = {
        /**
         * Adds meta node to a single datastore node. When no explicit node is provided,
         * node is identified by its parent and name.
         * @param parent {object} Reference to parent node.
         * @param name {string} Name of node in parent.
         * @param [node] {object} Datastore node.
         */
        addMeta: function (parent, name, node) {
            var meta;

            // taking node from parent when no node is explicitly provided
            node = node || parent[name];

            // adding meta node
            meta = node[META] = {};
            meta.self = node;
            if (typeof parent === 'object' &&
                typeof name === 'string') {
                meta.parent = parent;
                meta.name = name;
            }
        },

        /**
         * Removes meta node from datastore node.
         * @param node {object} Datastore node.
         */
        removeMeta: function (node) {
            if (node.hasOwnProperty(META)) {
                delete node[META];
            }
        }
    };

    self = {
        //////////////////////////////
        // Constants

        META: META,

        //////////////////////////////
        // Utilities

        errors: errors,
        utils: utils,

        //////////////////////////////
        // Control

        /**
         * Traverses datastore and adds meta-nodes, thus making
         * the datastore information 'live'.
         * @param node {object} Non-live data.
         * @param [parent] {object} Parent node.
         * @param [name] {string} Name of the
         */
        init: function (node, parent, name) {
            var prop;

            // adding meta node
            utils.addMeta(parent, name, node);

            // processing child nodes
            for (prop in node) {
                if (node.hasOwnProperty(prop)) {
                    if (prop !== META &&
                        typeof node[prop] === 'object'
                        ) {
                        // continuing traversal
                        self.init(node[prop], node, prop);
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
                    throw "flock.live.set: " + errors.ERROR_FORBIDDENNODENAME;
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

    return self;
}(flock.core));
