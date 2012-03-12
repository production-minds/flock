/*global flock, module, test, ok, equal, notEqual, deepEqual, raises */
(function (u_core) {
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
        equal(u_core.get(data, ['hi']), "There!", "Getting ordinal value");
        equal(u_core.get(data, ['hello', 'world']), data.hello.world, "Getting datastore node");
        equal(u_core.get(data, 'hello.world'), data.hello.world, "Getting datastore node w/ path in string notation");
        ok(typeof u_core.get(data, [
            'hello', 'yall'
        ]) === 'undefined', "Attempting to get from invalid path returns undefined");
    });

    test("Setting", function () {
        var tmp;

        tmp = u_core.set(data, ['hello', 'world', 'test'], "test");
        equal(tmp, data.hello.world, "Set returns parent of changed node");
        equal(data.hello.world.test, "test", "Value set on existing node");

        u_core.set(data, ['hello', 'yall', 'folks'], "test");
        equal(data.hello.yall.folks, "test", "Value set on non-existing path");

        u_core.set(data, ['hello', 'yall', 'folks']);
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

        tmp = u_core.unset(data, ['hello', 'world', 'center']);
        equal(tmp, data.hello.world, "Unset returns parent of removed node");
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                },
                all: "hey"
            }
        }, "Single ordinal node removed");

        u_core.unset(data, ['hello', 'all']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                }
            }
        }, "Single node removed");

        u_core.clear(data);
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

        u_core.cleanup(data, ['hi']);
        deepEqual(data, {
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            }
        }, "Single node removed");

        u_core.cleanup(data, ['hello', 'world', 'center']);
        deepEqual(data, {
            hello: {
                all: "hey"
            }
        }, "Node removed with all empty ancestors");

        u_core.cleanup(data, ['hello', 'all']);
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

        deepEqual(u_core.transform(testDataSource, ['foo'], ['bar']), {
            hello: {
                test: "world"
            },
            lorem: {
                test: "ipsum"
            }
        }, "First level values turned into two level lookup");

        deepEqual(u_core.transform(testDataSource, ['foo'], ['bar', 'test']), {
            hello: "world",
            lorem: "ipsum"
        }, "Second level values turned into one level lookup");

        deepEqual(u_core.transform(testDataSource, ['foo'], ['bar', 'test'], []), {
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
            u_core.transform(testDataDest, ['foo'], ['bar']);
        }, "Non-object child nodes raise error");
    });
}(flock.core));
