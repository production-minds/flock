/*global flock, module, test, ok, equal, notEqual, deepEqual, raises */
(function (u_single, u_path) {
    module("Single");

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
        equal(u_single.get(data, ['hi']), "There!", "Getting ordinal value");
        equal(u_single.get(data, ['hello', 'world']), data.hello.world, "Getting datastore node");
        equal(u_single.get(data, 'hello.world'), data.hello.world, "Getting datastore node w/ path in string notation");
        ok(typeof u_single.get(data, [
            'hello', 'yall'
        ]) === 'undefined', "Attempting to get from invalid path returns undefined");
    });

    test("Setting", function () {
        var tmp;

        tmp = u_single.set(data, ['hello', 'world', 'test'], "test");
        equal(tmp, data.hello.world, "Set returns parent of changed node");
        equal(data.hello.world.test, "test", "Value set on existing node");

        u_single.set(data, ['hello', 'yall', 'folks'], "test");
        equal(u_single.get(data, 'hello.yall.folks'), "test", "Value set on non-existing path");

        u_single.set(data, ['hello', 'yall', 'folks']);
        deepEqual(u_single.get(data, 'hello.yall.folks'), {}, "Default value for set is empty object");
        
        tmp = u_path.ignoredKey();
        u_path.ignoredKey("yall");
        raises(function () {
            u_single.set(data, ['hello', 'yall', 'folks']);
        }, "Ignored key in path throws error");
        u_path.ignoredKey(tmp);
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

        tmp = u_single.unset(data, ['hello', 'world', 'center']);
        equal(tmp, data.hello.world, "Unset returns parent of removed node");
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                },
                all: "hey"
            }
        }, "Single ordinal node removed");

        u_single.unset(data, ['hello', 'all']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                }
            }
        }, "Single node removed");
    });

    test("Clearing", function () {
        var
            data = {
                ignored: {},
                hi: 'There!',
                hello: {
                    world: {
                        center: "!!"
                    },
                    all: "hey"
                }
            },
            tmp;

        u_single.clear(data.hello);
        deepEqual(data.hello, {}, "Clearing datastore node");

        // setting global ignored key
        tmp = u_path.ignoredKey();
        u_path.ignoredKey('ignored');

        u_single.clear(data);
        deepEqual(data, {ignored: {}}, "Clearing datastore root with ignored key");

        // restirong global ignored key
        u_path.ignoredKey(tmp);
    });

    test("Cleanup", function () {
        var data = {
                hi: 'There!',
                hello: {
                    world: {
                        ignored: {},
                        center: "!!"
                    },
                    all: "hey"
                }
            },
            tmp;

        // setting global ignored key
        tmp = u_path.ignoredKey();
        u_path.ignoredKey('ignored');

        u_single.cleanup(data, ['hi']);
        deepEqual(data, {
            hello: {
                world: {
                    ignored: {},
                    center: "!!"
                },
                all: "hey"
            }
        }, "Single node removed");

        u_single.cleanup(data, ['hello', 'world', 'center']);
        deepEqual(data, {
            hello: {
                all: "hey"
            }
        }, "Node removed with all empty ancestors");

        u_single.cleanup(data, ['hello', 'all']);
        deepEqual(data, {}, "Remaining nodes removed with all empty ancestors");

        // restoring global ignored key
        u_path.ignoredKey(tmp);
    });

    test("Mapping", function () {
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

        deepEqual(u_single.map(testDataSource, ['foo'], ['bar']), {
            hello: {
                test: "world"
            },
            lorem: {
                test: "ipsum"
            }
        }, "First level values turned into two level lookup");

        deepEqual(u_single.map(testDataSource, ['foo'], ['bar', 'test']), {
            hello: "world",
            lorem: "ipsum"
        }, "Second level values turned into one level lookup");

        deepEqual(u_single.map(testDataSource, ['foo'], ['bar', 'test'], []), {
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
            u_single.map(testDataDest, ['foo'], ['bar']);
        }, "Non-object child nodes raise error");
    });
}(flock.single,
    flock.path));
