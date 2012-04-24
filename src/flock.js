/**
 * Flock Wrapper Object
 */
var flock;

(function () {
    /**
     * Flock constructor
     * @constructor
     * @param [root] {object} Root object for datastore. When omitted, empty object is assumed.
     * @param [options] {object} Options
     * @param [options.noevent] {boolean} No events.
     * @param [options.nomulti] {boolean} No complex queries, only single nodes may be accessed.
     * @param [options.nochaining] {boolean} No wrapping of querying methods in flock object.
     */
    flock = function (root, options) {
        // creating default arguments
        options = options || {};

        var
            // module references
            $utils = flock.utils,
            $single = flock.single,
            $multi = flock.multi,
            $evented = flock.evented,

            // instantiating base class with identical arguments
            base = $single.apply(this, arguments),
            self;

        if (!options.nomulti) {
            base = $multi(base);
        }

        if (!options.noevent) {
            base = $evented(base);
        }

        // adding top-level methods
        self = $utils.extend(base, {
            /**
             * Wraps node in flock object
             * @param node {object} Datastore node.
             */
            wrap: function (node) {
                return options.nochaining ?
                    node :
                    flock.apply(this, arguments);
            }
        });

        return self;
    };
}());
