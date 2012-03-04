/**
 * Flock Global Constants
 *
 * These constants have an effect on the traversal process.
 */
/*global flock */

flock.constants = (function (utils) {
    var self = {
        keys: 0,        // collect leaf keys
        values: 1,      // collect leaf values
        both: 2,        // collect key:value pairs of leaf nodes
        del: 3,         // delete leaf nodes
        count: 4        // count leaf nodes
    };

    // delegating constants on flock object
    utils.delegate(flock, self);

    return self;
}(flock.utils));
