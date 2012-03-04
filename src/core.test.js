/*global flock, module, test, ok, equal, notEqual, deepEqual, raises */
(function (core) {
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

    test("Path normalization", function () {
        raises(function () {
            core.normalizePath('...fds.fd');
        }, "Validation fails on leading dots");

        raises(function () {
            core.normalizePath('fds.fd..');
        }, "Validation fails on trailing dots");

        raises(function () {
            core.normalizePath(1000);
        }, "Validation fails on invalid argument type");

        deepEqual(
            core.normalizePath('first.second.thi rd'),
            [
                'first',
                'second',
                'thi rd'
            ],
            "String path converted to array notation"
        );

        var arrNotation = [
            'first',
            'second',
            'thi rd'
        ];
        notEqual(core.normalizePath(arrNotation), arrNotation, "Array input returns copy");
        deepEqual(core.normalizePath(arrNotation), arrNotation, "Array copy is identical to original");
    });

    test("Getting", function () {
        equal(core.get(data, ['hi']), "There!", "Getting ordinal value");
        equal(core.get(data, ['hello', 'world']), data.hello.world, "Getting datastore node");
        equal(core.get(data, 'hello.world'), data.hello.world, "Getting datastore node w/ path in string notation");
        ok(typeof core.get(data, [
            'hello', 'yall'
        ]) === 'undefined', "Attempting to get from invalid path returns undefined");
    });

    test("Setting", function () {
        core.set(data, ['hello', 'world', 'test'], "test");
        equal(data.hello.world.test, "test", "Value set on existing node");

        core.set(data, ['hello', 'yall', 'folks'], "test");
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

        core.unset(data, ['hello', 'world', 'center']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                },
                all: "hey"
            }
        }, "Single node removed");

        core.unset(data, ['hello', 'all']);
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

        core.cleanup(data, ['hi']);
        deepEqual(data, {
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            }
        }, "Single node removed");

        core.cleanup(data, ['hello', 'world', 'center']);
        deepEqual(data, {
            hello: {
                all: "hey"
            }
        }, "Node removed with all empty ancestors");

        core.cleanup(data, ['hello', 'all']);
        deepEqual(data, {}, "Remaining nodes removed with all empty ancestors");
    });
}(flock.core));
