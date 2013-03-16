/**
 * Datastore Fake Event
 *
 * Delegates events to orgin datastore.
 */
/* global dessert, troop, flock */
troop.promise(flock, 'Evented2', function () {
    var base = flock.Multi,
        self;

    /**
     * @class flock.Evented2
     * @extends flock.Multi
     */
    self = flock.Evented2 = base.extend()
        .addPrivateMethod(/** @lends flock.Evented2 */{
            /**
             * Generates a method with datastore path as first parameter.
             * Generated method calls same method of origin datastore
             * with path prepended with offset.
             * @returns {function}
             */
            _genMethod: function (methodName) {
                return function () {
                    var args = Array.prototype.slice.call(arguments),
                        path = args.shift(),
                        result;

                    // prending path with offset
                    path = flock.Path.normalize(path);
                    path = this.offset.concat(path);
                    args.unshift(path);

                    // running method on origin datastore
                    result = this.origin[methodName].apply(this.origin, args);

                    if (result === this.origin) {
                        // returning current datastore object when method returned itself
                        return this;
                    } else {
                        // returning result otheriwse
                        return result;
                    }
                };
            }
        });

    self.addMethod(/** @lends flock.Evented2 */{
        on      : self._genMethod('on'),
        one     : self._genMethod('one'),
        delegate: self._genMethod('delegate'),
        off     : self._genMethod('off'),
        trigger : self._genMethod('trigger'),
        get     : self._genMethod('get'),
        set     : self._genMethod('set'),
        unset   : self._genMethod('unset'),
        cleanup : self._genMethod('cleanup')
    });
});
