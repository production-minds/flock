/**
 * Flock Datastore Utilities
 */
var flock = flock || {};

flock.utils = (function () {
    var self = {
        /**
         * Mixes objects to an existing one, changing the original.
         * @param dest {object} Destination object.
         * Rest of parameters are objects to be mixed in.
         */
        mixin: function (dest) {
            var i, source,
                key;

            for (i = 1; i < arguments.length; i++) {
                // taking next source object
                source = arguments[i];

                // mixing source to result
                for (key in source) {
                    if (source.hasOwnProperty(key)) {
                        dest[key] = source[key];
                    }
                }
            }

            return dest;
        },

        /**
         * Mixes objects in parameter order. Does not change input.
         * Parameters are objects to be mixed together.
         */
        blend: function () {
            var args = Array.prototype.slice.call(arguments);
            args.unshift({});
            return self.mixin.apply(this, args);
        },

        /**
         * Extends an object by creating a new instance of the old one and
         * mixing the extension object to it.
         * @param base {object} Object to extend.
         * @param extension {object} Object holding the properties to add to the extended instance.
         * @param nocreate {boolean} Whether to bypass creation of new object. Default: false.
         */
        extend: function (base, extension, nocreate) {
            var properties = {},
                key;
            for (key in extension) {
                if (extension.hasOwnProperty(key)) {
                    properties[key] = {
                        value: extension[key]
                    };
                }
            }
            return nocreate === true ?
                Object.defineProperties(base, properties) :
                Object.create(base, properties);
        }
    };

    // delegating utilities to flock
    self.mixin(flock, self);

    return self;
}());
