/**
 * Basic Path Processing Functionality
 */
/*global flock*/

flock.path = (function (u_utils) {
    var RE_PATHVALIDATOR = /^([^\.]+\.)*[^\.]+$/,
        RE_PATHSEPARATOR = /\./,
        ignoredKey,
        errors, self;

    errors = {
        ERROR_INVALIDPATH: "Invalid path.",
        ERROR_FORBIDDENKEY: "Forbidden key."
    };

    self = {
        //////////////////////////////
        // Getters, setters

        /**
         * Setter for excluded key. When set, traversal will
         * ignore nodes with the specified key.
         * @param [value] {string} Key to be ignored. When ommitted, clears ignored key.
         */
        ignoredKey: function (value) {
            if (typeof value === 'string') {
                ignoredKey = value;
            } else {
                return ignoredKey;
            }
        },

        /**
         * Clears ignored key.
         */
        clearIgnoredKey: function () {
            ignoredKey = undefined;
        },

        //////////////////////////////
        // Control

        /**
         * Validates simple datastore path.
         * @param path {string|Array} Datastore path to be validated.
         * @returns {object|boolean} Path in array notation when valid, or false.
         * @throws {string} On invalid path.
         */
        normalize: function (path) {
            var result,
                i;

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

            // checking path for ignored node
            if (typeof ignoredKey === 'string') {
                for (i = 0; i < result.length; i++) {
                    if (result[i] === ignoredKey) {
                        throw "flock.path.normalize: " + errors.ERROR_FORBIDDENKEY;
                    }
                }
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
        }
    };

    // delegating errors
    u_utils.delegate(self, errors);

    return self;
}(flock.utils));
