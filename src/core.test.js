/*global flock, module, test, ok, equal, deepEqual */
(function (basic) {
    module("Core");

    var data = {
        hi: 'There!',
        hello: {
            world: {
                center: "!!"
            },
            all: "hey"
        }
    };

    test("Getting", function () {
        equal(basic.get(data, ['hi']).root(), "There!", "Getting ordinal value");
        equal(basic.get(data, ['hello', 'world']).root(), data.hello.world, "Getting datastore node");
        ok(typeof basic.get(data, ['hello', 'yall']).root() === 'undefined', "Attempting to get from invalid path returns undefined");
    });

    test("Setting", function () {
        basic.set(data, ['hello', 'world', 'test'], "test");
        equal(data.hello.world.test, "test", "Value set on existing node");

        basic.set(data, ['hello', 'yall', 'folks'], "test");
        equal(data.hello.yall.folks, "test", "Value set on non-existing path");
    });

    test("Unsetting", function () {
        var data = {
            hi: 'There!',
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            }
        };

        basic.unset(data, ['hello', 'world', 'center']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                },
                all: "hey"
            }
        }, "Single node removed");

        basic.unset(data, ['hello', 'all']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                }
            }
        }, "Single node removed");
    });

    test("Cleanup", function () {
        var data = {
            hi: 'There!',
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            }
        };

        basic.cleanup(data, ['hi']);
        deepEqual(data, {
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            }
        }, "Single node removed");

        basic.cleanup(data, ['hello', 'world', 'center']);
        deepEqual(data, {
            hello: {
                all: "hey"
            }
        }, "Node removed with all empty ancestors");

        basic.cleanup(data, ['hello', 'all']);
        deepEqual(data, {}, "Remaining nodes removed with all empty ancestors");
    });
}(flock.core));
