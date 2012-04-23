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

        var $utils = flock.utils,
            $single = flock.single,
            $multi = flock.multi,
            $evented = flock.evented,
            base = $single(root, options),
            self;

        if (!options.nomulti) {
            base = $multi(null, base);
        }

        if (!options.noevent) {
            base = $evented(null, base);
        }

        self = Object.create(base);

        // adding top-level methods
        $utils.extend(self, {
            /**
             * Retrieves a copy of the
             */
            options: function () {
                return $utils.extend({}, options);
            },

            /**
             * Wraps node in flock object
             * @param node {object} Datastore node.
             */
            wrap: function (node) {
                return options.nochaining ?
                    node :
                    flock(node, options);
            }
        });

        return self;
    };
}());
