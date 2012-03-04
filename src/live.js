/**
 * Live Datastore Functionality
 *
 * The live datastore enables bidirectional 'blind' traversal between nodes.
 */
/*global flock */

flock.live = (function () {
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
         * Adds meta node to datastore node. Node is identified by its parent and name.
         * Consequently, the root node cannot be given a meta node.
         * @param parent {object} Parent node.
         * @param name {string} Name of node in parent.
         */
        addMeta: function (parent, name) {
            var node = parent[name];
            node[META] = {
                self: node,
                name: name,
                parent: parent
            };
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
         */
        init: function (node) {
            var prop;

            // adding empty meta node
            node[META] = node[META] || {};

            // processing child nodes
            for (prop in node) {
                if (node.hasOwnProperty(prop)) {
                    if (prop !== META &&
                        typeof node[prop] === 'object'
                        ) {
                        // adding meta node to node being traversed
                        utils.addMeta(node, prop);

                        // continuing traversal
                        self.init(node[prop]);
                    }
                }
            }
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
}());
