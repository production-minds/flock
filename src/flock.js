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
     * Maps a datastore node to a flock object.
     * @param node {object} Datastore node.
     */
    function nodeMapper(node) {
        return typeof node !== 'undefined' ?
            flock(node) :
            flock.empty;
    }

    /**
     * Flock constructor
     * @constructor
     * @param [node] {object} Root object for datastore. When omitted, empty object is assumed.
     * @param [options] {object} Options: nolive, noevent, noquery.
     */
    flock = function (node, options) {
        // creating default arguments
        node = node || {};
        options = options || {
            nolive: false,
            noevent: false
        };

        // shortcuts
        var genMethod = flock.utils.genMethod,
            core = flock.core,
            live = flock.live,
            event = flock.event,
            args = [node],
            self = {};

        //////////////////////////////
        // Getters, setters

        self.node = function () {
            return node;
        };

        //////////////////////////////
        // Delegates

        // core
        self.get = genMethod(core.get, args, nodeMapper);
        self.set = genMethod(core.set, args, self);
        self.unset = genMethod(core.unset, args, self);
        self.cleanup = genMethod(core.cleanup, args, self);

        // live
        if (!options.nolive && live) {
            self.init = genMethod(live.init, args, self);
            self.path = genMethod(live.path, args);
            self.parent = genMethod(live.parent, args, nodeMapper);
            self.name = genMethod(live.name, args);

            // live overwrites set with its own version
            self.set = genMethod(live.set, args, self);

            // event - must have live for events
            if (!options.noevent && event) {
                self.on = genMethod(event.subscribe, args, self);
                self.off = genMethod(event.unsubscribe, args, self);
                self.trigger = genMethod(event.trigger, args, self);
            }
        }

        return self;
    };

    /**
     * Empty flock object.
     * Root returns undefined.
     */
    flock.empty = {
        node: function () {}
    };
}());
