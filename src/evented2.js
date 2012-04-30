/**
 * Datastore Fake Event
 *
 * Delegates events to orgin datastore.
 */
var flock = flock || {};

flock.evented2 = (function ($single, $path, $utils) {
    var self;

    /**
     * Generates a method with datastore path as first parameter.
     * Generated method calls same method of origin datastore
     * with path prepended with offset.
     * @returns {function}
     */
    function genMethod(methodName) {
        return function () {
            var args = Array.prototype.slice.call(arguments),
                path = args.shift(),
                ds = this.origin.ds,
                offset = this.origin.offset;

            path = $path.normalize(path);
            path = offset.concat(path);
            args.unshift(path);

            return ds[methodName].apply(ds, args);
        };
    }

    //////////////////////////////
    // Class

    self = {
        /**
         * @constructor
         * @param base {object} Base class instance.
         */
        create: function (base) {
            if (arguments.length > 1) {
                // root and options were passed instead of base
                // falling back to flock.single
                base = $single.create.apply(this, arguments);
            }

            return $utils.extend(base, self);
        },

        //////////////////////////////
        // Event functionality

        on: genMethod('on'),
        one: genMethod('one'),
        delegate: genMethod('delegate'),
        off: genMethod('off'),
        trigger: genMethod('trigger'),
        get: genMethod('get'),
        set: genMethod('set'),
        unset: genMethod('unset'),
        cleanup: genMethod('cleanup')
    };

    return self;
}(
    flock.single,
    flock.path,
    flock.utils
));
