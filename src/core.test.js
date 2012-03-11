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

    test("Paths", function () {
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

        // matching
        equal(core.matchPath(['hello', 'world'], ['hello', 'world']), true, "Path matches pattern");
        equal(core.matchPath(['hello'], ['hello', 'world']), false, "Path doesn't match pattern");
        equal(core.matchPath('hello.world', 'hello.world'), true, "Path (string notation) matches pattern");
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
        var tmp;

        tmp = core.set(data, ['hello', 'world', 'test'], "test");
        equal(tmp, data.hello.world, "Set returns parent of changed node");
        equal(data.hello.world.test, "test", "Value set on existing node");

        core.set(data, ['hello', 'yall', 'folks'], "test");
        equal(data.hello.yall.folks, "test", "Value set on non-existing path");

        core.set(data, ['hello', 'yall', 'folks']);
        deepEqual(data.hello.yall.folks, {}, "Default value for set is empty object");
    });

    test("Unsetting", function () {
        var
            data = {
                hi: 'There!',
                hello: {
                    world: {
                        center: "!!"
                    },
                    all: "hey"
                }
            },
            tmp;

        tmp = core.unset(data, ['hello', 'world', 'center']);
        equal(tmp, data.hello.world, "Unset returns parent of removed node");
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                },
                all: "hey"
            }
        }, "Single ordinal node removed");

        core.unset(data, ['hello', 'all']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                }
            }
        }, "Single node removed");

        core.clear(data);
        deepEqual(data, {}, "Clearing entire datastores");
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

    test("Transform", function () {
        var testDataSource = {
                a: {
                    foo: "hello",
                    bar: {
                        test: "world"
                    }
                },
                b: {
                    foo: "lorem",
                    bar: {
                        test: "ipsum"
                    }
                }
            },

            testDataDest = {
                foo: "hello",
                bar: "world"
            };

        deepEqual(core.transform(testDataSource, ['foo'], ['bar']), {
            hello: {
                test: "world"
            },
            lorem: {
                test: "ipsum"
            }
        }, "First level values turned into two level lookup");

        deepEqual(core.transform(testDataSource, ['foo'], ['bar', 'test']), {
            hello: "world",
            lorem: "ipsum"
        }, "Second level values turned into one level lookup");

        deepEqual(core.transform(testDataSource, ['foo'], ['bar', 'test'], []), {
            "hello": {
                "world": {
                    "foo": "hello",
                    "bar": {
                        "test": "world"
                    }
                }
            },
            "lorem": {
                "ipsum": {
                    "foo": "lorem",
                    "bar": {
                        "test": "ipsum"
                    }
                }
            }
        }, "Empty path as last node attaches child nodes to the lookup as leaf nodes");

        raises(function () {
            core.transform(testDataDest, ['foo'], ['bar']);
        }, "Non-object child nodes raise error");
    });
}(flock.core));
