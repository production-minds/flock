/**
 * Flock Datastore Utilities
 */
/*global flock */

flock.utils = (function () {
    var privates,
        self;

    privates = {
        /**
         * Delegates a single property from one object to another.
         * @param dest {object} Destination object, ie. that receives the properties.
         * @param source {object} Source object, ie. that offers the properties.
         * @param key {string} Name of property to delegate.
         * @param [silent] {boolean} Silent mode. When true, overwrites existing property.
         * @throws {string} When destination property exists.
         */
        addProperty: function (dest, source, key, silent) {
            if (silent || !dest.hasOwnProperty(key)) {
                dest[key] = source[key];
            } else {
                throw "flock.utils.delegateProperty: Property at destination already exists.";
            }
        }
    };

    self = {
        privates: privates,

        /**
         * Delegates properties from one object to another.
         * @param dest {object} Destination object, ie. that receives the properties.
         * @param source {object} Source object, ie. that offers the properties.
         * @param [keys] {Array} List of properties to delegate.
         * @param [silent] {boolean} Silent mode. When true, overwrites existing properties.
         * does not raise exception.
         */
        extend: function (dest, source, keys, silent) {
            var key, i;
            if (keys instanceof Array) {
                // delegating specified properties
                for (i = 0; i < keys.length; i++) {
                    privates.addProperty(dest, source, keys[i], silent);
                }
            } else {
                // delegating all properties
                for (key in source) {
                    if (source.hasOwnProperty(key)) {
                        privates.addProperty(dest, source, key, silent);
                    }
                }
            }
            return dest;
        }
    };

    return self;
}());
