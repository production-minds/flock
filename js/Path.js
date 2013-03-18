/**
 * Basic Path Processing Functionality
 */
/*global dessert, troop, flock */
troop.promise(flock, 'Path', function () {
    /**
     * @class flock.Path
     * @extends troop.Base
     */
    flock.Path = troop.Base.extend()
        .addConstant(/** @lends flock.Path */{
            RE_PATH_VALIDATOR : /^([^\.]+\.)*[^\.]+$/,
            RE_PATH_SEPARATOR : /\./,
            ERROR_INVALID_PATH: "Invalid path."
        })
        .addMethod(/** @lends flock.Path */{
            /**
             * Validates simple datastore path.
             * @param {string|string[]} path Datastore path to be validated.
             * @returns {string[]|boolean} Path in array notation when valid, or false.
             * @static
             */
            normalize: function (path) {
                var result;

                if (typeof path === 'string') {
                    // validating string path
                    if (path.length === 0) {
                        // trivial path
                        result = [];
                    } else if (path.match(this.RE_PATH_VALIDATOR)) {
                        // generating array notation by splitting string
                        result = path.split(this.RE_PATH_SEPARATOR);
                    } else {
                        dessert.assert(false, this.ERROR_INVALID_PATH);
                    }
                } else if (path instanceof Array) {
                    // creating shallow copy of path array
                    result = path.concat([]);
                } else {
                    dessert.assert(false, this.ERROR_INVALID_PATH);
                }

                return result;
            },

            /**
             * Compares two paths.
             * @param {string|string[]} actual Actual path.
             * @param {string|string[]} expected Expected path. May be pattern.
             * @returns {boolean} Whether actual path matches expected path.
             * @static
             */
            match: function (actual, expected) {
                actual = this.normalize(actual);
                expected = this.normalize(expected);
                return actual.join('.') === expected.join('.');
            }
        });
});
