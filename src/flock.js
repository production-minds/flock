/**
 * Flock Wrapper Object
 */
var flock;

(function () {
    var DEFAULT_OPTIONS = {
        nolive: false,
        noinit: false,
        noevent: false,
        nomulti: false,
        nochaining: false
    };

    /**
     * Flock constructor
     * @constructor
     * @param [node] {object} Root object for datastore. When omitted, empty object is assumed.
     * @param [options] {object} Options (tune performance vs. richness):
     * @param [options.noevent] {boolean} No events.
     * @param [options.nomulti] {boolean} No complex queries, only single nodes may be accessed.
     * @param [options.nochaining] {boolean} No wrapping of querying methods in flock object.
     */
    flock = function (node, options) {
        // creating default arguments
        options = options || DEFAULT_OPTIONS;

        // shortcuts
        var u_utils = flock.utils,
            u_single = flock.single,
            u_event = flock.event,
            u_multi = flock.multi,
            genMethod = u_utils.genMethod,
            nodeMapper = options.nochaining ? undefined : flock,
            nodeArgs = [node],
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

        // utils
        ds.keys = genMethod(u_utils.keys, nodeArgs);
        ds.values = genMethod(u_utils.values, nodeArgs);

        // tester functions
        ds.isEmpty = genMethod(u_utils.isEmpty, nodeArgs);
        ds.isNull = genMethod(u_utils.isNull, nodeArgs);
        ds.isUndefined = genMethod(u_utils.isUndefined, nodeArgs);
        ds.isOrdinal = genMethod(u_utils.isOrdinal, nodeArgs);
        ds.isNode = genMethod(u_utils.isNode, nodeArgs);

        // single node methods
        ds.get = genMethod(u_single.get, nodeArgs, nodeMapper, options);
        ds.map = genMethod(u_single.map, nodeArgs, nodeMapper, options);

        // event - must have live for events
        if (!options.noevent && u_event) {
            ds.on = genMethod(u_event.subscribe, nodeArgs, ds);
            ds.once = genMethod(u_event.once, nodeArgs, ds);
            ds.delegate = genMethod(u_event.delegate, nodeArgs, ds);
            ds.off = genMethod(u_event.unsubscribe, nodeArgs, ds);
            ds.trigger = genMethod(u_event.trigger, nodeArgs, ds);
        }

        if (!options.noevent && u_event) {
            // evented set
            ds.set = genMethod(u_event.set, nodeArgs, ds);
            ds.unset = genMethod(u_event.unset, nodeArgs, ds);
            ds.cleanup = genMethod(u_event.cleanup, nodeArgs, ds);
        } else {
            // core set
            ds.set = genMethod(u_single.set, nodeArgs, ds);
            ds.unset = genMethod(u_single.unset, nodeArgs, ds);
            ds.cleanup = genMethod(u_single.cleanup, nodeArgs, ds);

            // math functions
            ds.add = genMethod(u_single.add, nodeArgs);
        }

        if (!options.nomulti && u_multi) {
            // query method
            ds.query = genMethod(u_multi.query, nodeArgs, nodeMapper, options);
        }

        return ds;
    };

    /**
     * Sets default options.
     * @param value {object} Options object.
     */
    flock.defaultOptions = function (value) {
        var key;
        for (key in value) {
            if (value.hasOwnProperty(key) &&
                DEFAULT_OPTIONS.hasOwnProperty(key)
                ) {
                DEFAULT_OPTIONS[key] = value[key];
            }
        }
    };
}());
