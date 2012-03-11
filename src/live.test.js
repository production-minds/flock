/*global flock, module, test, ok, equal, deepEqual, raises */
(function (live) {
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

    live.init(data);

    test("Utilities", function () {
        ok(live.privates.empty({}), "Empty object is detected to be empty");
        ok(!live.privates.empty({foo:"bar"}), "Non-empty object is detected to be not empty");

        var tmp = {};
        tmp[live.metaKey()] = "foo";
        ok(live.privates.empty(tmp), "Object with just one meta key is detected to be empty");
    });

    test("Initialization", function () {
        equal(data.hello[live.metaKey()].name, 'hello', "Node name stored in meta node.");
        equal(data.hello[live.metaKey()].self, data.hello, "Node reference stored in meta node.");
        equal(data.hello[live.metaKey()].parent, data, "Parent node reference stored in meta node.");

        // re-initialization
        data.what = {
            test: {
                foo: data.hello.world
            }
        };
        live.init(data.what);
        equal(data.what.test[live.metaKey()].parent, data.what, "New sub-node initialized");
        equal(data.what.test.foo[live.metaKey()].parent, data.hello, "Re-initialization doesn't affect exising meta nodes");

        // de-initializing
        live.deinit(data);
        ok(typeof data[live.metaKey()] === 'undefined' &&
            typeof data.hello[live.metaKey()] === 'undefined' &&
            typeof data.hello.world[live.metaKey()] === 'undefined' &&
            typeof data.what[live.metaKey()] === 'undefined' &&
            typeof data.what.test[live.metaKey()] === 'undefined',
            "De-initialization removes meta nodes"
        );

        // restoring meta nodes
        live.init(data);
    });

    test("Path resolution", function () {
        deepEqual(live.path(data.hello.world), ['hello', 'world'], "Node path resolved");
    });

    test("Setting", function () {
        var
            value = {
                foo: {
                    bar: 'wut'
                }
            },
            tmp;

        tmp = live.set(data, ['hello', 'more'], value);

        equal(tmp, data.hello, "Set returns parent of changed node");
        equal(data.hello.more.foo.bar, 'wut', "Branch added to datastore.");
        equal(data.hello.more[live.metaKey()].name, 'more', "Meta nodes added to branch nodes");

        live.set(data, ['hello', 'world', 'center'], "blah");
        equal(data.hello.world.center, 'blah', "Setting ordinal node");

        live.set(data, ['hello', 'world', 'foo']);
        ok(live.privates.empty(data.hello.world.foo), "Default value for set is empty object");

        raises(function () {
            live.set(data, ['hello', 'world', live.metaKey()], "blah");
        }, "Setting fails on path with META key in it");
    });

    test("Traversal", function () {
        equal(live.parent(data.hello.world), data.hello, "Obtaining parent node");

        equal(live.closest(data.hello.world, 'world'), data.hello.world, "Closest node named 'world' is self");
        equal(live.closest(data.hello.world, 'hello'), data.hello, "Closest node named 'hello' is parent");
        ok(typeof live.closest(data.hello.world, 'invalid') === 'undefined', "No closest node named 'invalid'");

        equal(live.name(data.hello.world), 'world', "Obtaining node name (key in parent)");
        raises(function () {
            live.name(data.hello.world.center);
        }, "Meta getter throws error on ordinal (leaf) node");
    });
}(flock.live));
