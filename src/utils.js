/**
 * Flock Datastore Utilities
 */
/*global flock */

flock.utils = (function () {
    var OPTIONS_MINIMAL = {
            nolive: true,
            noevent: true,
            noquery: true
        },
        errors, self;

    errors = {
        ERROR_INVALIDNODE: "Invalid node."
    };

    self = {
        /**
         * Generates a method that is based on a function,
         * but bolts its first N arguments.
         * @param handler {function} Model function,
         * @param args {Array} Fix arguments (first N of handler's args).
         * @param [mapper] {function} Function that maps the return value.
         * @param [custom] {object} Custom data to be passed to mapper.
         * Treated as return value when non-function.
         */
        genMethod: function (handler, args, mapper, custom) {
            if (typeof mapper === 'function') {
                return function () {
                    return mapper(handler.apply(this, args.concat(Array.prototype.slice.call(arguments))), custom);
                };
            } else {
                return function () {
                    var result = handler.apply(this, args.concat(Array.prototype.slice.call(arguments)));
                    return typeof mapper !== 'undefined' ?
                        mapper :
                        result;
                };
            }
        },

        /**
         * Tests an object for having no (own) properties.
         * @param object {object} Test object.
         */
        isEmpty: function (object) {
            var result = true,
                key;
            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    result = false;
                    break;
                }
            }
            return result;
        },

        /**
         * Tests object for having exactly 1 (own) property
         * @param object {object} Test object.
         */
        isSingle: function (object) {
            var result = false,
                key,
                count = 0;
            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    result = ++count === 1;
                    if (count > 1) {
                        break;
                    }
                }
            }
            return result;
        },

        /**
         * Retrieves the first available property of an object.
         * @param object {object} Test object.
         */
        firstProperty: function (object) {
            var key;
            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    return key;
                }
            }
        },

        /**
         * Delegates a single property from one object to another.
         * @param dest {object} Destination object, ie. that receives the properties.
         * @param source {object} Source object, ie. that offers the properties.
         * @param key {string} Name of property to delegate.
         * @param [silent] {boolean} Silent mode. When true, overwrites existing property.
         * @throws {string} When destination property exists.
         */
        delegateProperty: function (dest, source, key, silent) {
            if (silent || !dest.hasOwnProperty(key)) {
                dest[key] = source[key];
            } else {
                throw "flock.utils.delegateProperty: Property at destination already exists.";
            }
        },

        /**
         * Delegates properties from one object to another.
         * @param dest {object} Destination object, ie. that receives the properties.
         * @param source {object} Source object, ie. that offers the properties.
         * @param [keys] {Array} List of properties to delegate.
         * @param [silent] {boolean} Silent mode. When true, overwrites existing properties.
         * does not raise exception.
         */
        delegate: function (dest, source, keys, silent) {
            var key, i;
            if (keys instanceof Array) {
                // delegating specified properties
                for (i = 0; i < keys.length; i++) {
                    self.delegateProperty(dest, source, keys[i], silent);
                }
            } else {
                // delegating all properties
                for (key in source) {
                    if (source.hasOwnProperty(key)) {
                        self.delegateProperty(dest, source, key, silent);
                    }
                }
            }
            return flock;
        },

        /**
         * Transforms node structure by taking descendant values as keys in the output.
         * @param node {object} Source node. Object with uniform child objects.
         * Additional parameters specify the paths (in array notation) from whence
         * to take the transformed node's keys.
         * Empty array as last path will put the original child node as leaf node.
         * @returns {object} Transformed node.
         * @throws {string} When immediate child nodes are not objects.
         * @example See unit test.
         * TODO: either use flock as input and output, or use core methods and bare nodes
         */
        transform: function (node) { /*, path1, path2 */
            var source = flock(node, OPTIONS_MINIMAL),
                dest = flock({}, OPTIONS_MINIMAL),
                item, path, last,
                i;

            for (item in node) {
                if (node.hasOwnProperty(item)) {
                    if (typeof node[item] === 'object') {
                        path = [];
                        for (i = 1; i < arguments.length - 1; i++) {
                            path.push(source.get([item].concat(arguments[i])).node());
                        }
                        last = arguments[arguments.length - 1];
                        dest.set(path, source.get([item].concat(last)).node());
                    } else {
                        throw "flock.utils.transform: " + errors.ERROR_INVALIDNODE;
                    }
                }
            }

            return dest.node();
        }
    };

    // delegating utils to flock object
    self.delegate(flock, self, [
        'delegate',
        'isEmpty'
    ]);

    return self;
}());
