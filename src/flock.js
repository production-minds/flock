/**
 * Flock - JavaScript Key-Value Cache
 *
 * In-memory key-value store. Stores entire tree structure in memory.
 * Use for complex lookups, as memcache on top of a persistence layer,
 * or as an in-memory DHT node.
 *
 * https://github.com/wwidd/flock
 */
var	flock;

(function () {
    /**
     * Flock constructor
     * @constructor
     * @param [root] {object} Root object for datastore. When omitted, empty object is assumed.
     * @param [options] {object} Options: nolive, noquery.
     */
    flock = function (root, options) {
        // creating default root object
        root = root || {};

        var genMethod = flock.utils.genMethod,
            core = flock.core,
            args = [root],
            self;

        self = {
            //////////////////////////////
            // Getters, setters

            root: function () {
                return root;
            },

            //////////////////////////////
            // Delegates

            // core
            get: genMethod(core.get, args),
            set: genMethod(core.set, args),
            unset: genMethod(core.unset, args),
            cleanup: genMethod(core.cleanup, args)
        };

        return self;
    };
}());
