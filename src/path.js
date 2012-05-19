/**
 * Basic Path Processing Functionality
 */
var flock = flock || {};

flock.path = (function ($utils) {
    var RE_PATHVALIDATOR = /^([^\.]+\.)*[^\.]+$/,
        RE_PATHSEPARATOR = /\./,
        errors, self;

    errors = {
        ERROR_INVALIDPATH: "Invalid path."
    };

    self = $utils.extend(Object.prototype, {
        //////////////////////////////
        // Control

        /**
         * Validates simple datastore path.
         * @param path {string|Array} Datastore path to be validated.
         * @returns {object|boolean} Path in array notation when valid, or false.
         * @throws {string} On invalid path.
         */
        normalize: function (path) {
            var result;

            if (typeof path === 'string') {
                // validating string path
                if (path.length === 0) {
                    // trivial path
                    result = [];
                } else if (path.match(RE_PATHVALIDATOR)) {
                    // generating array notation by splitting string
                    result = path.split(RE_PATHSEPARATOR);
                } else {
                    throw "flock.path.normalize: " + errors.ERROR_INVALIDPATH;
                }
            } else if (path instanceof Array) {
                // creating shallow copy of path array
                result = path.concat([]);
            } else {
                throw "flock.path.normalize: " + errors.ERROR_INVALIDPATH;
            }

            return result;
        },

        /**
         * Compares two paths.
         * @param actual {Array} Actial path.
         * @param expected {Array} Expected path. May be pattern.
         * @returns {boolean} Whether actual path matches expected path.
         */
        match: function (actual, expected) {
            actual = self.normalize(actual);
            expected = self.normalize(expected);
            return actual.join('.') === expected.join('.');
        },

        /**
         * Determines common root of two paths.
         * @param path1 {string|string[]}
         * @param path2 {string|string[]}
         * @returns {string[]} Normalized path.
         */
        common: function (path1, path2) {
            path1 = self.normalize(path1);
            path2 = self.normalize(path2);

            var result = [],
                length = Math.min(path1.length, path2.length),
                i;
            for (i = 0; i < length; i++) {
                if (path1[i] === path2[i]) {
                    result.push(path1[i]);
                } else {
                    return result;
                }
            }

            return result;
        }
    });

    // delegating errors
    $utils.mixin(self, errors);

    return self;
}(flock.utils));
