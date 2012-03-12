/*global flock, module, test, ok, equal, deepEqual, raises */
(function (u_live) {
    module("Live");

    var data = {
        hi: 'There!',
        hello: {
            world: {
                center: "!!"
            },
            all: "hey"
        }
    };

    u_live.init(data);

    test("Utilities", function () {
        ok(u_live.privates.empty({}), "Empty object is detected to be empty");
        ok(!u_live.privates.empty({foo:"bar"}), "Non-empty object is detected to be not empty");

        var tmp = {};
        tmp[u_live.metaKey()] = "foo";
        ok(u_live.privates.empty(tmp), "Object with just one meta key is detected to be empty");
    });

    test("Initialization", function () {
        equal(data.hello[u_live.metaKey()].name, 'hello', "Node name stored in meta node.");
        equal(data.hello[u_live.metaKey()].self, data.hello, "Node reference stored in meta node.");
        equal(data.hello[u_live.metaKey()].parent, data, "Parent node reference stored in meta node.");

        // re-initialization
        data.what = {
            test: {
                foo: data.hello.world
            }
        };
        u_live.init(data.what);
        equal(data.what.test[u_live.metaKey()].parent, data.what, "New sub-node initialized");
        equal(data.what.test.foo[u_live.metaKey()].parent, data.hello, "Re-initialization doesn't affect exising meta nodes");

        // de-initializing
        u_live.deinit(data);
        ok(typeof data[u_live.metaKey()] === 'undefined' &&
            typeof data.hello[u_live.metaKey()] === 'undefined' &&
            typeof data.hello.world[u_live.metaKey()] === 'undefined' &&
            typeof data.what[u_live.metaKey()] === 'undefined' &&
            typeof data.what.test[u_live.metaKey()] === 'undefined',
            "De-initialization removes meta nodes"
        );

        // restoring meta nodes
        u_live.init(data);
    });

    test("Path resolution", function () {
        deepEqual(u_live.path(data.hello.world), ['hello', 'world'], "Node path resolved");
    });

    test("Setting", function () {
        var
            value = {
                foo: {
                    bar: 'wut'
                }
            },
            tmp;

        tmp = u_live.set(data, ['hello', 'more'], value);

        equal(tmp, data.hello, "Set returns parent of changed node");
        equal(data.hello.more.foo.bar, 'wut', "Branch added to datastore.");
        equal(data.hello.more[u_live.metaKey()].name, 'more', "Meta nodes added to branch nodes");

        u_live.set(data, ['hello', 'world', 'center'], "blah");
        equal(data.hello.world.center, 'blah', "Setting ordinal node");

        u_live.set(data, ['hello', 'world', 'foo']);
        ok(u_live.privates.empty(data.hello.world.foo), "Default value for set is empty object");

        raises(function () {
            u_live.set(data, ['hello', 'world', u_live.metaKey()], "blah");
        }, "Setting fails on path with META key in it");
    });

    test("Traversal", function () {
        equal(u_live.parent(data.hello.world), data.hello, "Obtaining parent node");

        equal(u_live.closest(data.hello.world, 'world'), data.hello.world, "Closest node named 'world' is self");
        equal(u_live.closest(data.hello.world, 'hello'), data.hello, "Closest node named 'hello' is parent");
        ok(typeof u_live.closest(data.hello.world, 'invalid') === 'undefined', "No closest node named 'invalid'");

        equal(u_live.name(data.hello.world), 'world', "Obtaining node name (key in parent)");
        raises(function () {
            u_live.name(data.hello.world.center);
        }, "Meta getter throws error on ordinal (leaf) node");
    });
}(flock.live));
