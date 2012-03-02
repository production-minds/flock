/**
 * Flock Global Constants
 *
 * These constants have an effect on the traversal process.
 */
var flock = flock || {};

flock.constants = {
    keys: 0,        // collect leaf keys
    values: 1,      // collect leaf values
    both: 2,        // collect key:value pairs of leaf nodes
    del: 3,         // delete leaf nodes
    count: 4        // count leaf nodes
};
