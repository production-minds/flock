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
     * @param [options.nomulti] {boolean} No complex queries, only single nodes may be accessed.
     * @param [options.nochaining] {boolean} No wrapping of querying methods in flock object.
     */
    flock = function (node, options) {
        // creating default arguments
        node = node || {};
        options = options || {
            nolive: false,
            noinit: false,
            noevent: false,
            nomulti: false,
            nochaining: false
        };

        // shortcuts
        var utils = flock.utils,
            single = flock.single,
            live = flock.live,
            event = flock.event,
            multi = flock.multi,
            genMethod = utils.genMethod,
            nodeMapper = options.nochaining ? undefined : chainedNodeMapper,
            args = [node],
            ds = {};

        //////////////////////////////
        // Getters, setters

        ds.node = function () {
            return node;
        };

        /**
         * Returns copy of the options object as to
         * prevent it from being modified.
         */
        ds.options = function () {
            return {
                nolive: options.nolive,
                noinit: options.noinit,
                noevent: options.noevent,
                nomulti: options.nomulti,
                nochaining: options.nochaining
            };
        };

        //////////////////////////////
        // Delegates

        // single node methods
        ds.get = genMethod(single.get, args, nodeMapper, options);
        ds.clear = genMethod(single.clear, args, ds);
        ds.cleanup = genMethod(single.cleanup, args, ds);
        ds.map = genMethod(single.map, args, ds);

        // live
        if (!options.nolive && live) {
            // initializing
            if (!options.noinit) {
                live.init(node);
            }

            // general live methods
            ds.init = genMethod(live.init, args, ds);
            ds.deinit = genMethod(live.deinit, args, ds);
            ds.path = genMethod(live.path, args);
            ds.parent = genMethod(live.parent, args, nodeMapper, options);
            ds.closest = genMethod(live.closest, args, nodeMapper, options);
            ds.name = genMethod(live.name, args);

            // event - must have live for events
            if (!options.noevent && event) {
                ds.on = genMethod(event.subscribe, args, ds);
                ds.once = genMethod(event.once, args, ds);
                ds.delegate = genMethod(event.delegate, args, ds);
                ds.off = genMethod(event.unsubscribe, args, ds);
                ds.trigger = genMethod(event.trigger, args, ds);
            }
        }

        // modification methods
        if (!options.nolive && live) {
            if (!options.noevent && event) {
                // evented set
                ds.set = genMethod(event.set, args, ds);
                ds.unset = genMethod(event.unset, args, ds);
            } else {
                // live set
                ds.set = genMethod(live.set, args, ds);
                ds.unset = genMethod(single.unset, args, ds);
            }

            ds.empty = genMethod(live.empty, args);
        } else {
            // core set
            ds.set = genMethod(single.set, args, ds);
            ds.unset = genMethod(single.unset, args, ds);
            ds.empty = genMethod(utils.isEmpty, args);
        }

        if (!options.nomulti && multi) {
            if (!options.nolive && live) {
                // setting meta key to be ignored by traversal
                multi.ignoredKey(live.metaKey());
            }

            // query method
            ds.query = genMethod(multi.query, args, nodeMapper, options);
        }

        return ds;
    };

    /**
     * Empty flock object.
     * Node method returns undefined.
     */
    flock.empty = {
        node: function () {}
    };
}());
