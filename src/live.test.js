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

    test("Initialization", function () {
        equal(data.hello[live.META].name, 'hello', "Node name stored in meta node.");
        equal(data.hello[live.META].self, data.hello, "Node reference stored in meta node.");
        equal(data.hello[live.META].parent, data, "Parent node reference stored in meta node.");
    });

    test("Path resolution", function () {
        deepEqual(live.path(data.hello.world), ['hello', 'world'], "Node path resolved");
    });

    test("Setting", function () {
        var value = {
            foo: {
                bar: 'wut'
            }
        };

        live.set(data, ['hello', 'more'], value);

        equal(data.hello.more.foo.bar, 'wut', "Branch added to datastore.");
        equal(data.hello.more[live.META].name, 'more', "Meta nodes added to branch nodes");
    });

    test("Traversal", function () {
        equal(live.parent(data.hello.world), data.hello, "Obtaining parent node");
        equal(live.name(data.hello.world), 'world', "Obtaining node name");
        raises(function () {
            live.name(data.hello.world.center);
        }, "Meta getter throws error on ordinal (leaf) node");
    });
}(flock.live));
