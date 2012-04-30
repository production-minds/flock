/**
 * Datastore Fake Event
 *
 * Delegates events to orgin datastore.
 */
var flock = flock || {};

flock.evented2 = (function ($path, $utils) {
    var ctor;

    /**
     * Generates a method with datastore path as first parameter.
     * Generated method calls same method of origin datastore
     * with path prepended with offset.
     * @returns {function}
     */
    function genMethod(methodName) {
        return function () {
            var args = Array.prototype.slice.call(arguments),
                path = args.shift();

            path = $path.normalize(path);
            path = this.origin.offset.concat(path);
            args.unshift(path);

            return this.origin.ds[methodName].apply(this, args);
        };
    }

    //////////////////////////////
    // Class

    ctor = function (base) {
        var self;

        self = $utils.extend(base, {
            //////////////////////////////
            // Getters, setters

            lookup: function () {
                return this.origin.ds.lookup();
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
        });

        return self;
    };

    return ctor;
}(
    flock.path,
    flock.utils
));
