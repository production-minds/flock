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
        var u_utils = flock.utils,
            u_path = flock.path,
            u_single = flock.single,
            u_live = flock.live,
            u_event = flock.event,
            u_multi = flock.multi,
            genMethod = u_utils.genMethod,
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
        ds.get = genMethod(u_single.get, args, nodeMapper, options);
        ds.clear = genMethod(u_single.clear, args, ds);
        ds.cleanup = genMethod(u_single.cleanup, args, ds);
        ds.map = genMethod(u_single.map, args, ds);

        // live
        if (!options.nolive && u_live) {
            // initializing
            if (!options.noinit) {
                u_live.init(node);
            }

            // general live methods
            ds.init = genMethod(u_live.init, args, ds);
            ds.deinit = genMethod(u_live.deinit, args, ds);
            ds.path = genMethod(u_live.path, args);
            ds.parent = genMethod(u_live.parent, args, nodeMapper, options);
            ds.closest = genMethod(u_live.closest, args, nodeMapper, options);
            ds.name = genMethod(u_live.name, args);

            // event - must have live for events
            if (!options.noevent && u_event) {
                ds.on = genMethod(u_event.subscribe, args, ds);
                ds.once = genMethod(u_event.once, args, ds);
                ds.delegate = genMethod(u_event.delegate, args, ds);
                ds.off = genMethod(u_event.unsubscribe, args, ds);
                ds.trigger = genMethod(u_event.trigger, args, ds);
            }
        }

        // modification methods
        if (!options.nolive && u_live) {
            if (!options.noevent && u_event) {
                // evented set
                ds.set = genMethod(u_event.set, args, ds);
                ds.unset = genMethod(u_event.unset, args, ds);
            } else {
                // live set
                ds.set = genMethod(u_live.set, args, ds);
                ds.unset = genMethod(u_single.unset, args, ds);
            }

            ds.empty = genMethod(u_live.empty, args);
        } else {
            // core set
            ds.set = genMethod(u_single.set, args, ds);
            ds.unset = genMethod(u_single.unset, args, ds);
            ds.empty = genMethod(u_utils.isEmpty, args);
        }

        if (!options.nomulti && u_multi) {
            if (!options.nolive && u_live) {
                // setting meta key to be ignored by traversal
                u_path.ignoredKey(u_live.metaKey());
            }

            // query method
            ds.query = genMethod(u_multi.query, args, nodeMapper, options);
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
