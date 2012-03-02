/**
 * Flock Datastore Utilities
 */
/*global flock */
flock.utils = {
    /**
     * Delegates properties from one object to another.
     * @param dest {object} Destination object, ie. that receives the properties.
     * @param source {object} Source object, ie. that offers the properties.
     * @param [keys] {Array} List of properties to delegate.
     */
    delegate: function (dest, source, keys) {
        var key, i;
        if (keys instanceof Array) {
            // delegating specified properties
            for (i = 0; i < keys.length; i++) {
                key = keys[i];
                dest[key] = source[key];
            }
        } else {
            // delegating all properties
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    dest[key] = source[key];
                }
            }
        }
        return flock;
    }
};
