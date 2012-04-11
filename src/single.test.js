/*global flock, module, test, ok, equal, notEqual, deepEqual, raises */
(function ($single) {
    module("Single");

    var
        data = {
            hi: 'There!',
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            },
            foo: 5
        };

    test("Getting", function () {
        equal($single.get.call(data, ['hi']), "There!", "Getting ordinal value");
        equal($single.get.call(data, ['hello', 'world']), data.hello.world, "Getting datastore node");
        equal($single.get.call(data, 'hello.world'), data.hello.world, "Getting datastore node w/ path in string notation");
        ok(typeof $single.get.call(data, [
            'hello', 'yall'
        ]) === 'undefined', "Attempting to get from invalid path returns undefined");
    });

    test("Setting", function () {
        $single.set.call(data, ['hello', 'world', 'test'], "test");
        equal(data.hello.world.test, "test", "Value set on existing node");

        $single.set.call(data, ['hello', 'yall', 'folks'], "test");
        equal($single.get.call(data, 'hello.yall.folks'), "test", "Value set on non-existing path");

        $single.set.call(data, ['hello', 'yall', 'folks']);
        deepEqual($single.get.call(data, 'hello.yall.folks'), {}, "Default value for set is empty object");
    });

    test("Math", function () {
        $single.add.call(data, 'foo');
        equal(data.foo, 6, "Default increment is 1");
        $single.add.call(data, 'foo', 4);
        equal(data.foo, 10, "Custom increment");
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
            };

        $single.unset.call(data, ['hello', 'world', 'center']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                },
                all: "hey"
            }
        }, "Single ordinal node removed");

        $single.unset.call(data, ['hello', 'all']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                }
            }
        }, "Single node removed");
    });

    test("Cleanup", function () {
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

            removed = {};

        $single.cleanup.call(data, ['blaaaaah']);

        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            }
        }, "Attempting to remove invalid node doesn't change data");

        $single.cleanup.call(data, ['hi']);

        deepEqual(data, {
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            }
        }, "Single node removed");

        $single.cleanup.call(data, ['hello', 'world', 'center'], removed);

        deepEqual(removed, {parent: data.hello, name: 'world'}, "Cleanup returns name and parent of removed node");

        deepEqual(data, {
            hello: {
                all: "hey"
            }
        }, "Node removed with all empty ancestors");

        $single.cleanup.call(data, ['hello', 'all']);
        deepEqual(data, {}, "Remaining nodes removed with all empty ancestors");
    });

    test("Mapping", function () {
        var
            data = {
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
            };

        deepEqual($single.map.call(data, ['foo'], ['bar']), {
            hello: {
                test: "world"
            },
            lorem: {
                test: "ipsum"
            }
        }, "First level values turned into two level lookup");

        deepEqual($single.map.call(data, ['foo'], ['bar', 'test']), {
            hello: "world",
            lorem: "ipsum"
        }, "Second level values turned into one level lookup");

        deepEqual($single.map.call(data, ['foo'], ['bar', 'test'], []), {
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
    });
}(flock.single));
