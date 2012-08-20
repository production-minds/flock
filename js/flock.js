/**
 * Flock Wrapper Object
 */
var flock = flock || {};

(function ($utils, Single, $multi, $evented, $evented2) {
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
                nomulti: false,
                noevent: true,
                nochaining: true
            };
        } else {
            // empty options
            options = options || {};
        }

        var
            // instantiating base class with identical arguments
            base = Single.create.apply(Single, arguments),
            self;

        if (!options.nomulti) {
            base = $multi.create(base);
        }

        if (!options.noevent) {
            if (base.offset.length > 0) {
                base = $evented2.create(base);
            } else {
                base = $evented.create(base);
            }
        }

        // adding top-level methods
        self = $utils.extend(base, {
            noevent: options.noevent,
            nomulti: options.nomulti,

            /**
             * Wraps node in flock object
             * @param node {object} Datastore node.
             */
            wrap: function (node) {
                return this.nochaining ?
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
    flock.Single,
    flock.multi,
    flock.evented,
    flock.evented2
));
