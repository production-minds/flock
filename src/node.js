/**
 * Basic Datastore Node
 */
var flock = flock || {};

flock.node = (function ($utils) {
    var self = $utils.extend(Object.prototype, {
        /**
         * @constructor
         * @param root {object} Datastore node.
         */
        create: function (root) {
            return Object.create(self, {
                root: {value: root, writable: false}
            });
        },

        /**
         * Tests node for having no keys.
         * @returns {boolean}
         */
        isEmpty: function () {
            var result = true,
                key;
            for (key in this.root) {
                if (this.root.hasOwnProperty(key)) {
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
            for (key in this.root) {
                if (this.root.hasOwnProperty(key)) {
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
            return this.root === null;
        },

        /**
         * Tests node for being undefined.
         */
        isUndefined: function () {
            return typeof this.root === 'undefined';
        },

        /**
         * Tests node for being ordinal.
         */
        isOrdinal: function () {
            return typeof this.root === 'string' ||
                typeof this.root === 'number' ||
                typeof this.root === 'boolean';
        },

        /**
         * Tests node for being non-null object.
         */
        isNode: function () {
            return typeof this.root === 'object' && this.root !== null;
        },

        /**
         * Retrieves the first available key from node.
         */
        firstKey: function () {
            var key;
            for (key in this.root) {
                if (this.root.hasOwnProperty(key)) {
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
            for (key in this.root) {
                if (this.root.hasOwnProperty(key)) {
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
            for (key in this.root) {
                if (this.root.hasOwnProperty(key)) {
                    result.push(this.root[key]);
                }
            }
            return result;
        }
    });

    return self;
}(
    flock.utils
));
