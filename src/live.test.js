/*global flock, module, test, ok, equal, deepEqual */
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
        ok(typeof data[live.META] === 'undefined', "root node has no meta node.");
        equal(data.hello[live.META].name, 'hello', "Node name stored in meta node.");
        equal(data.hello[live.META].self, data.hello, "Node reference stored in meta node.");
        equal(data.hello[live.META].parent, data, "Parent node reference stored in meta node.");
    });

    test("Path resolution", function () {
        deepEqual(live.path(data.hello.world), ['hello', 'world'], "Node path resolved");
    });
}(flock.live));
