/**
 * Live Datastore Functionality
 *
 * The live datastore enables bidirectional 'blind' traversal between nodes.
 */
/*global flock */

flock.live = (function (core) {
    var META = '.meta',
        utils,
        self;

    utils = {
        /**
         * Generates getter for a meta property.
         * @param metaName {string} Meta property name.
         */
        genMetaGetter: function (metaName) {
            /**
             * Retrieves a meta property from datastore node.
             * @param node {object} Datastore node.
             */
            return function (node) {
                if (typeof node === 'object') {
                    if (node.hasOwnProperty(META)) {
                        return node[META][metaName];
                    } else {
                        throw "flock.live." + metaName + ": Non-traversable node.";
                    }
                } else {
                    throw "flock.live." + metaName + ": Ordinal node.";
                }
            };
        },

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
         * @param path {Array} Datastore path.
         * @param value {object} Value to set on path.
         */
        set: function (node, path, value) {
            var tpath = core.normalizePath(path),
                name,
                branch, tmp;

            // seeking to the first absent key
            while (tpath.length) {
                if (!node.hasOwnProperty(tpath[0])) {
                    name = tpath.shift();
                    break;
                }
                node = node[tpath.shift()];
            }

            // assembling new branch
            branch = value;
            while (tpath.length) {
                tmp = {};
                tmp[tpath.pop()] = branch;
                branch = tmp;
            }

            // initializing new branch
            self.init(value, node, name);

            // setting branch as leaf node
            node[name] = value;
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

        //////////////////////////////
        // Meta Getters

        parent: utils.genMetaGetter('parent'),
        name: utils.genMetaGetter('name')
    };

    return self;
}(flock.core));
