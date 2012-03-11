/**
 * Flock Datastore Utilities
 */
/*global flock */

flock.utils = (function () {
    var self;

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
        }
    };

    // delegating utils to flock object
    self.delegate(flock, self, [
        'delegate',
        'isEmpty'
    ]);

    return self;
}());
