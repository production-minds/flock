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

        // shortcuts
        var genMethod = flock.utils.genMethod,
            core = flock.core,
            args = [root],
            self;

        /**
         * Maps anything to the current object.
         */
        function defaultMapper() {
            return self;
        }

        /**
         * Maps a datastore node to a flock object.
         * @param node {object} Datastore node.
         */
        function nodeMapper(node) {
            return typeof node !== 'undefined' ?
                flock(node) :
                flock.empty;
        }

        self = {
            //////////////////////////////
            // Getters, setters

            root: function () {
                return root;
            },

            //////////////////////////////
            // Delegates

            // core
            get: genMethod(core.get, args, nodeMapper),
            set: genMethod(core.set, args, defaultMapper),
            unset: genMethod(core.unset, args, defaultMapper),
            cleanup: genMethod(core.cleanup, args, defaultMapper)
        };

        return self;
    };

    /**
     * Empty flock object.
     * Root returns undefined.
     */
    flock.empty = {
        root: function () {}
    };
}());
