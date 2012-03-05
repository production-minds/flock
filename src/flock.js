/**
 * Flock Wrapper Object
 */
var flock;

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

        function getNode() {
            return node;
        }

        self.node = getNode;

        /** @deprecated Since version 0.2. Use flock.node() instead. */
        self.root = getNode;

        //////////////////////////////
        // Delegates

        // core
        self.get = genMethod(core.get, args, nodeMapper);
        self.cleanup = genMethod(core.cleanup, args, self);

        // live
        if (!options.nolive && live) {
            self.init = genMethod(live.init, args, self);
            self.path = genMethod(live.path, args);
            self.parent = genMethod(live.parent, args, nodeMapper);
            self.closest = genMethod(live.closest, args, nodeMapper);
            self.name = genMethod(live.name, args);

            // event - must have live for events
            if (!options.noevent && event) {
                self.on = genMethod(event.subscribe, args, self);
                self.off = genMethod(event.unsubscribe, args, self);
                self.trigger = genMethod(event.trigger, args, self);
            }
        }

        // modification methods
        if (!options.nolive && live) {
            if (!options.noevent && event) {
                // evented set
                self.set = genMethod(event.set, args, self);
                self.unset = genMethod(event.unset, args, self);
            } else {
                // live set
                self.set = genMethod(live.set, args, self);
                self.unset = genMethod(core.unset, args, self);
            }
        } else {
            // core set
            self.set = genMethod(core.set, args, self);
            self.unset = genMethod(core.unset, args, self);
        }

        return self;
    };

    /**
     * Empty flock object.
     * Node method returns undefined.
     */
    flock.empty = {
        node: function () {}
    };
}());
