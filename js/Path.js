/**
 * Basic Path Processing Functionality
 */
/*global troop, flock */
troop.promise(flock, 'Path', function () {
    var base = troop.Base,
        self;

    self = flock.Path = base.extend()
        .addConstant({
            RE_PATHVALIDATOR : /^([^\.]+\.)*[^\.]+$/,
            RE_PATHSEPARATOR : /\./,
            ERROR_INVALIDPATH: "Invalid path."
        })
        .addMethod({
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
                    } else if (path.match(self.RE_PATHVALIDATOR)) {
                        // generating array notation by splitting string
                        result = path.split(self.RE_PATHSEPARATOR);
                    } else {
                        throw "flock.Path.normalize: " + self.ERROR_INVALIDPATH;
                    }
                } else if (path instanceof Array) {
                    // creating shallow copy of path array
                    result = path.concat([]);
                } else {
                    throw "flock.Path.normalize: " + self.ERROR_INVALIDPATH;
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
        });

    return self;
});
