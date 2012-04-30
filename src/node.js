/**
 * Basic Datastore Node
 */
var flock = flock || {};

flock.node = (function () {
    var self = {
        /**
         * @constructor
         * @param node {object} Datastore node.
         */
        create: function (node) {
            return Object.create(self, {
                node: {value: node, writable: false}
            });
        },

        /**
         * Tests node for having no keys.
         * @returns {boolean}
         */
        isEmpty: function () {
            var result = true,
                key;
            for (key in this.node) {
                if (this.node.hasOwnProperty(key)) {
                    result = false;
                    break;
                }
            }
            return result;
        },

        /**
         * Tests node for having exactly 1 key
         * @returns {boolean}
         */
        isSingle: function () {
            var result = false,
                key,
                count = 0;
            for (key in this.node) {
                if (this.node.hasOwnProperty(key)) {
                    result = ++count === 1;
                    if (count > 1) {
                        break;
                    }
                }
            }
            return result;
        },

        /**
         * Tests node for being null.
         */
        isNull: function () {
            return this.node === null;
        },

        /**
         * Tests node for being undefined.
         */
        isUndefined: function () {
            return typeof this.node === 'undefined';
        },

        /**
         * Tests node for being ordinal.
         */
        isOrdinal: function () {
            return typeof this.node === 'string' ||
                typeof this.node === 'number' ||
                typeof this.node === 'boolean';
        },

        /**
         * Tests node for being non-null object.
         */
        isNode: function () {
            return typeof this.node === 'object' && this.node !== null;
        },

        /**
         * Retrieves the first available key from node.
         */
        firstKey: function () {
            var key;
            for (key in this.node) {
                if (this.node.hasOwnProperty(key)) {
                    return key;
                }
            }
        },

        /**
         * Extracts keys from node.
         */
        keys: function () {
            var key,
                result = [];
            for (key in this.node) {
                if (this.node.hasOwnProperty(key)) {
                    result.push(key);
                }
            }
            return result;
        },

        /**
         * Extracts values from node.
         */
        values: function () {
            var key,
                result = [];
            for (key in this.node) {
                if (this.node.hasOwnProperty(key)) {
                    result.push(this.node[key]);
                }
            }
            return result;
        }
    };

    return self;
}());
