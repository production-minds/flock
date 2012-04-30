/**
 * Flock Wrapper Object
 */
var flock = flock || {};

(function ($utils, $single, $multi, $evented) {
    var
        // library-level constants
        constants = {
            COMPAT: 'mainOptions.compat'
        },

        // backup of library so far
        backup = flock;

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
        // filtering options argument
        if (options === flock.COMPAT) {
            // compatibility mode, no events, no chaining
            options = {
                noevent: true,
                nochaining: true
            };
        } else {
            // empty options
            options = options || {};
        }

        var
            // instantiating base class with identical arguments
            base = $single.create.apply(this, arguments),
            self;

        if (!options.nomulti) {
            base = $multi.create(base);
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

    // (re-)adding properties and methods to flock
    $utils.mixin(flock, constants);
    $utils.mixin(flock, backup);
}(
    flock.utils,
    flock.single,
    flock.multi,
    flock.evented
));
