/**
 * Live Datastore Functionality
 *
 * The live datastore enables bidirectional 'blind' traversal between nodes.
 */
var flock = flock || {};

flock.live = (function () {
    var META = '.meta',
        self;

    self = {
        /**
         * Meta node identifier
         */
        META: META,

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
         * Traverses datastore and adds meta-nodes, thus making
         * the datastore information 'live'.
         * @param node {object} Non-live data.
         */
        init: function (node) {
            var prop;

            for (prop in node) {
                if (node.hasOwnProperty(prop)) {
                    if (prop !== META &&
                        typeof node[prop] === 'object'
                    ) {
                        // adding meta node to node being traversed
                        self.addMeta(node, prop);

                        // continuing traversal
                        self.init(node[prop]);
                    }
                }
            }

            return self;
        },

        /**
         * Retrieves current path of a node.
         * @param node {object} Datastore node.
         */
        path: function (node) {
            var result = [];
            while (typeof node[META] === 'object') {
                result.unshift(node[META].name);
                node = node[META].parent;
            }
            return result;
        }
    };

    return self;
}());
