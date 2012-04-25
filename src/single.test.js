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
        },

        single = $single(data, {nochaining: true});

    test("Getting", function () {
        equal(single.get(['hi']), "There!", "Getting ordinal value");

        equal(single.get(['hello', 'world']), data.hello.world, "Getting datastore node");
        equal(single.get('hello.world'), data.hello.world, "Getting datastore node w/ path in string notation");
        ok(typeof single.get([
            'hello', 'yall'
        ]) === 'undefined', "Attempting to get from invalid path returns undefined");
    });

    test("Origin", function () {
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
            },

            single = $single(data);

        equal(
            single
                .get(['hello', 'world'])
                .origin().ds,
            single,
            "Origin datastore OK"
        );

        deepEqual(
            single
                .get(['hello', 'world'])
                .origin().path,
            ['hello', 'world'],
            "Origin path OK"
        );

        equal(
            single
                .get('hello')
                    .get('world')
                .origin().ds,
            single,
            "Origin datastore OK (multi-depth)"
        );

        deepEqual(
            single
                .get('hello')
                    .get('world')
                .origin().path,
            ['hello', 'world'],
            "Origin path OK (multi-depth)"
        );
    });

    test("Setting", function () {
        single.set(['hello', 'world', 'test'], "testt");
        equal(data.hello.world.test, "testt", "Value set on existing node");

        single.set(['hello', 'world', 'test'], "test");
        equal(data.hello.world.test, "test", "- same with non-static");

        single.set(['hello', 'yall', 'folks'], "test");
        equal(single.get('hello.yall.folks'), "test", "Value set on non-existing path");

        single.set(['hello', 'yall', 'folks']);
        equal(typeof single.get('hello.yall.folks'), 'undefined', "Default value for set is undefined");
    });

    test("Math", function () {
        single.add('foo');
        equal(data.foo, 6, "Default increment is 1");

        single.add('foo');
        equal(data.foo, 7, "- same with non-static");

        single.add('foo', 3);
        equal(data.foo, 10, "Custom increment");
    });

    test("Unsetting", function () {
        var
            data = {
                hi: 'There!',
                hello: {
                    world: {
                        center: "!!",
                        other: "??"
                    },
                    all: "hey"
                }
            },

            single = $single(data);

        single.unset(['hello', 'world', 'center']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                    other: "??"
                },
                all: "hey"
            }
        }, "- same with non-static");

        single.unset(['hello', 'world', 'other']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                },
                all: "hey"
            }
        }, "Single ordinal node removed");

        single.unset(['hello', 'all']);
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

            single = $single(data);

        single.cleanup(['blaaaaah']);
        deepEqual(data, {
            hi: 'There!',
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            }
        }, "Attempting to remove invalid node doesn't change data");

        single.cleanup(['hi']);
        deepEqual(data, {
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            }
        }, "Single node removed");

        single.cleanup(['hello', 'world', 'center']);
        deepEqual(data, {
            hello: {
                all: "hey"
            }
        }, "Node removed with all empty ancestors");

        single.cleanup(['hello', 'all']);
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
            },

            single = $single(data, {nochaining: true});

        deepEqual(single.map(['foo'], ['bar']), {
            hello: {
                test: "world"
            },
            lorem: {
                test: "ipsum"
            }
        }, "First level values turned into two level lookup");

        deepEqual(single.map(['foo'], ['bar']), {
            hello: {
                test: "world"
            },
            lorem: {
                test: "ipsum"
            }
        }, "- same with non-static");

        deepEqual(single.map(['foo'], ['bar', 'test']), {
            hello: "world",
            lorem: "ipsum"
        }, "Second level values turned into one level lookup");

        deepEqual(single.map(['foo'], ['bar', 'test'], []), {
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
