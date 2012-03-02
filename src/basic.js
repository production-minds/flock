/**
 * Live Datastore Functionality
 *
 * The live datastore enables bidirectional 'blind' traversal between nodes.
 */
var flock = flock || {};

flock.basic = (function () {
    var self;

    self = {
        /**
         * Gets a single value from the given datastore path.
         * @param root {object} Datastore root.
         * @param path {Array} Datastore path.
         */
        get: function (root, path) {
            var i, key,
                node = root;
            for (i = 0; i < path.length; i++) {
                key = path[i];
                if (!node.hasOwnProperty(key)) {
                    return;
                } else {
                    node = node[key];
                }
            }
            return node;
        },

        /**
         * Sets a singe value on the given datastore path.
         * @param root {object} Datastore root.
         * @param path {Array} Datastore path.
         * @param value {object} Value to set on path
         */
        set: function (root, path, value) {
            var i, key,
                name = path.pop(),
                node = root;
            for (i = 0; i < path.length; i++) {
                key = path[i];
                if (!node.hasOwnProperty(key)) {
                    node[key] = {};
                }
                node = node[key];
            }
            node[name] = value;
            return self;
        }
    };

    return self;
}());
