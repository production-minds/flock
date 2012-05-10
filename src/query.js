/**
 * Query Pattern Management
 */
var flock = flock || {};

flock.query = (function ($utils) {
    /*jshint regexp:false */
    var RE_PATH_VALIDATOR = /^(\.{3})*([^\.,]+(\.{1,3}|,))*[^\.,]+$/,
        RE_PATH_SKIPPER = /\.{2,}/,
        errors, self;
    /*jshint regexp:true */

    errors = {
        ERROR_INVALIDPATH: "Invalid path."
    };

    self = {
        //////////////////////////////
        // Control

        /**
         * Validates and normalizes datastore path.
         * @param path {string|Array} Datastore path.
         * @example
         * 'contacts.smith.*.ancestors...name'
         * will get the names of all ancestor names for contacts w/ last name 'smith'
         * @return {Array} Valid datastore path in array notation.
         * @throws {string} On invalid input path.
         */
        normalize: function (path) {
            if (typeof path === 'string') {
                // validating path
                if (path.length && !RE_PATH_VALIDATOR.test(path)) {
                    throw "flock.query.normalize: " + errors.ERROR_INVALIDPATH;
                }

                var tpath,
                    i, key;

                // splitting along dots
                tpath = path.length ?
                    path.replace(
                        RE_PATH_SKIPPER,
                        function (match, offset) {
                            return offset ? '..' : '.';
                        }
                    ).split('.') :
                    [];

                for (i = 0; i < tpath.length; i++) {
                    key = tpath[i];
                    if (key === '') {
                        // substituting nulls in place of empty strings
                        tpath[i] = null;
                    } else if (key.indexOf(',') > -1) {
                        // splitting along commas to form multiple choice keys
                        tpath[i] = key.split(',');
                    }
                }

                return tpath;
            } else if (path instanceof Array) {
                return path.concat([]);
            } else {
                throw "flock.query.normalize: " + errors.ERROR_INVALIDPATH;
            }
        },

        /**
         * Matches path to pattern.
         * @param actual {string|Array} Actual path.
         * @param expected {string|Array} Expected path. May be query pattern.
         * @returns {boolean} Whether the actual path matches the expected one.
         */
        match: function (actual, expected) {
            actual = self.normalize(actual);
            expected = self.normalize(expected);

            var i = 0, j = 0,
                key,
                k, tmp;

            while (i < actual.length && j < expected.length) {
                key = expected[j];
                if (key === '*') {
                    // wildcard matches anything
                    i++; j++;
                } else if (key === null) {
                    // null matches anything until
                    // exact match or end of path reached
                    if (j === expected.length - 1 ||
                        actual[i] === expected[j + 1]
                        ) {
                        j++;
                    } else {
                        i++;
                    }
                } else if (key instanceof Array) {
                    // multiple choices
                    tmp = {};
                    for (k = 0; k < key.length; k++) {
                        tmp[key[k]] = true;
                    }
                    if (!tmp.hasOwnProperty(actual[i])) {
                        return false;
                    } else {
                        i++; j++;
                    }
                } else {
                    // otherwise looking for exact match
                    if (actual[i] !== expected[j]) {
                        return false;
                    } else {
                        i++; j++;
                    }
                }
            }

            return i === actual.length &&
                j === expected.length;
        }
    };

    // delegating errors
    $utils.mixin(self, errors);

    return self;
}(
    flock.utils
));
