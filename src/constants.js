/**
 * Flock Global Constants
 *
 * These constants have an effect on the traversal process.
 */
/*global flock */

flock.constants = (function (utils) {
    var self = {
        KEYS: 0,        // collect leaf keys
        VALUES: 1,      // collect leaf values
        BOTH: 2,        // collect key:value pairs of leaf nodes
        DEL: 3,         // delete leaf nodes
        COUNT: 4        // count leaf nodes
    };

    // delegating constants on flock object
    utils.delegate(flock, self);

    return self;
}(flock.utils));
