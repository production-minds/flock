/**
 * Flock Wrapper Object
 */
/* global dessert, troop, flock */
(function (Single, Multi, Evented) {
    troop.Base.addConstant.call(flock, /** @lends flock */{
        COMPAT: 'mainOptions.compat'
    });

    /**
     * @param {object} [root] Root object for datastore. When omitted, empty object is assumed.
     * @param {object|string} [options] Options
     * @param {boolean} [options.noevent] No events.
     * @param {boolean} [options.nomulti] No complex queries, only single nodes may be accessed.
     */
    flock.compat = function (root, options) {
        // filtering options argument
        if (options === flock.COMPAT) {
            // compatibility mode, no events, no chaining
            options = {
                nomulti: false,
                noevent: true
            };
        } else {
            // empty options
            options = options || {};
        }

        var result;

        if (!options.noevent) {
            result = Evented.create(root);
        } else if (!options.nomulti) {
            result = Multi.create(root);
        } else {
            result = Single.create(root);
        }

        // adding top-level methods
        result.addConstant({
            noevent: options.noevent,
            nomulti: options.nomulti
        });

        return result;
    };
}(flock.Single, flock.Multi, flock.Evented));
