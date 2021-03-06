/**
 * Basic Datastore Node
 */
/*global troop, flock */
troop.promise(flock, 'Node', function () {
    var base = troop.Base,
        self;

    self = flock.Node = base.extend()
        .addMethod({
            /**
             * @constructor
             * @param root {object} Datastore node.
             */
            init: function (root) {
                this.addConstant({
                    root: root
                });
            },

            /**
             * Tests node for having no keys.
             * @returns {boolean}
             */
            isEmpty: function () {
                var root = this.root,
                    result = true,
                    key;

                if (Object.prototype.isPrototypeOf(root)) {
                    for (key in root) {
                        if (root.hasOwnProperty(key)) {
                            result = false;
                            break;
                        }
                    }
                } else if (typeof root === 'string') {
                    return root.length === 0;
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
});
