/**
 * Query Pattern Management
 */
/* global dessert, troop, flock */
troop.promise(flock, 'Query', function () {
    /**
     * @class flock.Query
     * @extends troop.Base
     */
    flock.Query = troop.Base.extend()
        .addConstant(/** @lends flock.Query */{
            RE_PATH_VALIDATOR: /^(\.{3})*([^\.,]+(\.{1,3}|,))*[^\.,]+$/,
            RE_PATH_SKIPPER  : /\.{2,}/,
            ERROR_INVALID_PATH: "Invalid path."
        })
        .addMethod(/** @lends flock.Query */{
            /**
             * Validates and normalizes datastore path.
             * @param {string|string[]} path Datastore path.
             * @example
             * 'contacts.smith.*.ancestors...name'
             * will get the names of all ancestor names for contacts w/ last name 'smith'
             * @return {string|string[]} Valid datastore path in array notation.
             * @static
             */
            normalize: function (path) {
                if (typeof path === 'string') {
                    // validating path
                    dessert.assert(!path.length || this.RE_PATH_VALIDATOR.test(path), this.ERROR_INVALID_PATH);

                    var tPath,
                        i, key;

                    // splitting along dots
                    tPath = path.length ?
                        path.replace(
                            this.RE_PATH_SKIPPER,
                            function (match, offset) {
                                return offset ? '..' : '.';
                            }
                        ).split('.') :
                        [];

                    for (i = 0; i < tPath.length; i++) {
                        key = tPath[i];
                        if (key === '') {
                            // substituting nulls in place of empty strings
                            tPath[i] = null;
                        } else if (key.indexOf(',') > -1) {
                            // splitting along commas to form multiple choice keys
                            tPath[i] = key.split(',');
                        }
                    }

                    return tPath;
                } else if (path instanceof Array) {
                    return path.concat([]);
                } else {
                    dessert.assert(false, this.ERROR_INVALID_PATH);
                }
            },

            /**
             * Matches path to pattern.
             * @param {string|string[]} actual Actual path.
             * @param {string|string[]} expected Expected path. May be query pattern.
             * @returns {boolean} Whether the actual path matches the expected one.
             * @static
             */
            match: function (actual, expected) {
                actual = this.normalize(actual);
                expected = this.normalize(expected);

                var i = 0, j = 0,
                    key,
                    k, tmp;

                while (i < actual.length && j < expected.length) {
                    key = expected[j];
                    if (key === '*') {
                        // wildcard matches anything
                        i++;
                        j++;
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
                            i++;
                            j++;
                        }
                    } else {
                        // otherwise looking for exact match
                        if (actual[i] !== expected[j]) {
                            return false;
                        } else {
                            i++;
                            j++;
                        }
                    }
                }

                return i === actual.length &&
                       j === expected.length;
            }
        });
});
