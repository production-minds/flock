/**
 * Flock Wrapper Object
 */
var flock;

(function () {
    /**
     * Maps a datastore node to a flock object.
     * @param node {object} Datastore node.
     */
    function chainedNodeMapper(node, options) {
        return typeof node !== 'undefined' ?
            flock(node, options) :
            flock.empty;
    }

    /**
     * Flock constructor
     * @constructor
     * @param [node] {object} Root object for datastore. When omitted, empty object is assumed.
     * @param [options] {object} Options (tune performance vs. richness):
     * @param [options.nolive] {boolean} No parent chain traversal.
     * @param [options.noinit] {boolean} No upfront datastore initialization (when live).
     * @param [options.noevent] {boolean} No events.
     * @param [options.noquery] {boolean} No complex queries, only single nodes may be accessed.
     * @param [options.nochaining] {boolean} No wrapping of querying methods in flock object.
     */
    flock = function (node, options) {
        // creating default arguments
        node = node || {};
        options = options || {
            nolive: false,
            noinit: false,
            noevent: false,
            noquery: false,
            nochaining: false
        };

        // shortcuts
        var utils = flock.utils,
            core = flock.core,
            live = flock.live,
            event = flock.event,
            query = flock.query,
            genMethod = utils.genMethod,
            nodeMapper = options.nochaining ? undefined : chainedNodeMapper,
            args = [node],
            self = {};

        //////////////////////////////
        // Getters, setters

        self.node = function () {
            return node;
        };

        /**
         * Returns copy of the options object as to
         * prevent it from being modified.
         */
        self.options = function () {
            return {
                nolive: options.nolive,
                noinit: options.noinit,
                noevent: options.noevent,
                noquery: options.noquery,
                nochaining: options.nochaining
            };
        };

        //////////////////////////////
        // Delegates

        // core
        self.get = genMethod(core.get, args, nodeMapper, options);
        self.clear = genMethod(core.clear, args, self);
        self.cleanup = genMethod(core.cleanup, args, self);

        // live
        if (!options.nolive && live) {
            // initializing
            if (!options.noinit) {
                live.init(node);
            }

            // general live methods
            self.init = genMethod(live.init, args, self);
            self.deinit = genMethod(live.deinit, args, self);
            self.path = genMethod(live.path, args);
            self.parent = genMethod(live.parent, args, nodeMapper, options);
            self.closest = genMethod(live.closest, args, nodeMapper, options);
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

            self.empty = genMethod(live.empty, args);
        } else {
            // core set
            self.set = genMethod(core.set, args, self);
            self.unset = genMethod(core.unset, args, self);
            self.empty = genMethod(utils.isEmpty, args);
        }

        if (!options.noquery && query) {
            if (!options.nolive && live) {
                // setting meta key to be ignored by traversal
                query.ignoredKey(live.metaKey());
            }

            // query method
            self.query = genMethod(query.query, args, nodeMapper, options);
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
