/**
 * Basic Datastore Node
 */
/*global flock */

flock.node = (function () {
    return function (node) {
        return {
            /**
             * Tests node for having no keys.
             * @returns {boolean}
             */
            isEmpty: function () {
                var result = true,
                    key;
                for (key in node) {
                    if (node.hasOwnProperty(key)) {
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
                for (key in node) {
                    if (node.hasOwnProperty(key)) {
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
                return node === null;
            },

            /**
             * Tests node for being undefined.
             */
            isUndefined: function () {
                return typeof node === 'undefined';
            },

            /**
             * Tests node for being ordinal.
             */
            isOrdinal: function () {
                return typeof node === 'string' ||
                    typeof node === 'number' ||
                    typeof node === 'boolean';
            },

            /**
             * Tests node for being non-null object.
             */
            isNode: function () {
                return typeof node === 'object' && node !== null;
            },

            /**
             * Retrieves the first available key from node.
             */
            firstKey: function () {
                var key;
                for (key in node) {
                    if (node.hasOwnProperty(key)) {
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
                for (key in node) {
                    if (node.hasOwnProperty(key)) {
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
                for (key in node) {
                    if (node.hasOwnProperty(key)) {
                        result.push(node[key]);
                    }
                }
                return result;
            }
        };
    };
}());