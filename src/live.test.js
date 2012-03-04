/*global flock, module, test, ok, equal, deepEqual, raises */
(function (live, utils) {
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
        ok(utils.isEmpty(data[live.META]), "root node has empty meta node.");
        equal(data.hello[live.META].name, 'hello', "Node name stored in meta node.");
        equal(data.hello[live.META].self, data.hello, "Node reference stored in meta node.");
        equal(data.hello[live.META].parent, data, "Parent node reference stored in meta node.");
    });

    test("Path resolution", function () {
        deepEqual(live.path(data.hello.world), ['hello', 'world'], "Node path resolved");
    });

    test("Traversal", function () {
        equal(live.parent(data.hello.world), data.hello, "Obtaining parent node");
        equal(live.name(data.hello.world), 'world', "Obtaining node name");
        raises(function () {
            live.name(data.hello.world.center);
        }, "Meta getter throws error on ordinal (leaf) node");
    });
}(flock.live,
    flock.utils));
