/*global flock, module, test, ok, equal, notEqual, deepEqual, raises, console */
(function (query, core) {
    var data = {
        first: {
            a: {},
            b: {},
            c: {},
            d: {},
            e: {}
        },
        second: {
            1: {},
            2: {},
            3: {}
        },
        third: {},
        fourth: {
            1: {
                a: "One",
                b: "Two"
            },
            2: {
                a: "Three",
                b: "Four"
            },
            3: {
                a: "Five",
                b: "Six"
            }
        }
    };

    module("Query");

    test("Path validation", function () {
        var path = 'first.a.bcde.1.55',
			apath = path.split('.');
        deepEqual(query.resolve(''), [], "Root path");
        deepEqual(query.resolve(path), apath, "String path " + path);
        deepEqual(query.resolve('first.*.bcde...55'), ['first', '*', 'bcde', null, '55'], "Path with wildcards");
        raises(function () {
            query.resolve('first.*.bcde......55');
        }, "Path with erroneous wildcards");
        raises(function () {
            query.many(data, 'fourth...');
        }, "Path can't end in dot");
        deepEqual(query.resolve('first.1,2,3.*'), ['first', ['1', '2', '3'], '*'], "Array keys");
    });

    test("Wildcards", function () {
        // testing single-level wildcards
        deepEqual(
            query.many(data, 'fourth.*'),
            [{a: "One", b: "Two"}, {a: "Three", b: "Four"}, {a: "Five", b: "Six"}],
            "Collecting nodes from path 'fourth.*'");
        deepEqual(
            query.many(data, 'fourth.*', {limit: 1}),
            [{a: "One", b: "Two"}],
            "Retrieving first node from path 'fourth.*'");
        deepEqual(
            query.many(data, 'fourth.*.a'),
            ["One", "Three", "Five"],
            "Collecting nodes from path 'fourth.*.a'");
        deepEqual(
            query.many(data, 'fourth.2.*'),
            ["Three", "Four"],
            "Collecting nodes from path 'fourth.2.*'");
        deepEqual(
            query.many(data, '*.1'),
            [{}, {a: "One", b: "Two"}],
            "Collecting nodes from path '*.1'");

        deepEqual(
            query.many(data, 'first,second.*', {mode: flock.both}),
            {a: {}, b: {}, c: {}, d: {}, e: {}, 1: {}, 2: {}, 3: {}},
            "Getting results as lookup");
    });

    test("OR relation", function () {
        deepEqual(
            query.many(data, ['fourth', [1, 3]]),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Collecting specific nodes from path 'fourth.1,3'");
        deepEqual(
            query.many(data, 'fourth.1,3'),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Collecting specific nodes from path 'fourth.1,3' (passed as string)");
        deepEqual(
            query.many(data, ['fourth', [1, 3], '*']),
            ["One", "Two", "Five", "Six"],
            "Collecting specific nodes from path 'fourth.1,3.*'");
        deepEqual(
            query.many(data, [['first', 'third']]),
            [{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
            "Collecting specific nodes from path 'first,third'");
        deepEqual(
            query.many(data, 'first,third'),
            [{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
            "Collecting specific nodes from path 'first,third' (passed as string)");

        deepEqual(
            query.many(data, [['thousandth', 'third']]),
            [{}],
            "Collecting non-existent keys");
        deepEqual(
            query.many(data, [['thousandth', 'third']], {mode: flock.both}),
            {third: {}},
            "Collecting non-existent keys (as lookup)");
        deepEqual(
            query.many(data, [['thousandth', 'third']], {undef: true}),
            [undefined, {}],
            "Collecting non-existent keys (undefined values allowed)");
    });

    test("Counting", function () {
        equal(query.many(data, 'first.*', {mode: flock.count}), 5, "5 elements on path 'first.*'");
        equal(query.many(data, 'fourth.*.a', {mode: flock.count}), 3, "3 elements on path 'fourth.*.a'");
        equal(query.many(data, '...a', {mode: flock.count}), 4, "4 elements on path '...a'");
    });

    test("Skipping", function () {
        // testing multi-level wildcards
        var data = {
            1: {},
            test: {
                1: "hello",
                a: "world"
            },
            what: [
                "one",
                "two",
                "three",
                {
                    awe: "some",
                    1: "test"
                }
            ]
        };

        deepEqual(
            query.many(data, '...1'),
            [{}, "hello", "two", "test"],
            "Collecting nodes from path '...1'");
        deepEqual(
            query.many(data, ['what', '3', 'awe']),
            ["some"],
            "Collecting nodes from path 'what.3.awe'");
        deepEqual(
            query.many(data, [null, '3', 'awe']),
            ["some"],
            "Collecting nodes from path '...3.awe'");

        // creating loopback
        data.test.b = data.test;
        deepEqual(
            query.many(data, '...1'),
            [{}, "hello", "two", "test"],
            "Loopbacks don't affect result");
    });

    test("Edge cases", function () {
        var data = {
            1: {},
            test: {
                1: "hello",
                a: "world",
                '.': "dot"
            },
            what: [
                "one",
                "two",
                "three",
                {
                    awe: "some",
                    1: "test"
                }
            ]
        };

        equal(query.many(data, ''), data, ".many('') and .root() point to the same object");
        deepEqual(query.many(data, ['test', '.']), ['dot'], "Dot as key acts as regular string");
    });

    test("Modifying multiple nodes", function () {
        var data = {
            fourth: {
                1: {
                    a: "One",
                    b: "Two"
                },
                2: {
                    a: "Three",
                    b: "Four"
                },
                3: {
                    a: "Five",
                    b: "Six"
                }
            }
        };

        query.mset(data, 'fourth.*.a');
        deepEqual(data.fourth, {
            1: {
                a: {},
                b: "Two"
            },
            2: {
                a: {},
                b: "Four"
            },
            3: {
                a: {},
                b: "Six"
            }
        }, "Setting empty object by default");

        query.many(data, 'fourth.*.a', {value: "A"});
        deepEqual(data.fourth, {
            1: {
                a: "A",
                b: "Two"
            },
            2: {
                a: "A",
                b: "Four"
            },
            3: {
                a: "A",
                b: "Six"
            }
        }, "Setting the value 'A' on several nodes");

        query.many(data, 'fourth.*.b', {value: function (leaf) {
            return leaf + "X";
        }});
        deepEqual(data.fourth, {
            1: {
                a: "A",
                b: "TwoX"
            },
            2: {
                a: "A",
                b: "FourX"
            },
            3: {
                a: "A",
                b: "SixX"
            }
        }, "Adding character 'X' to each leaf node on path");

        query.many(data, 'fourth.*.c', {value: "C"});
        deepEqual(data.fourth, {
            1: {
                a: "A",
                b: "TwoX",
                c: "C"
            },
            2: {
                a: "A",
                b: "FourX",
                c: "C"
            },
            3: {
                a: "A",
                b: "SixX",
                c: "C"
            }
        }, "Adding new node 'c' ('C') to 'fourth.*'");
    });

    test("Deleting multiple nodes", function () {
        var data = {};

        query.many(data, 'fourth', {value: {
            1: {
                a: "One",
                b: "Two"
            },
            2: {
                a: "Three",
                b: "Four"
            },
            3: {
                a: "Five",
                b: "Six"
            }
        }});
        query.many(data, 'fourth.*.a', {mode: flock.del});
        deepEqual(data.fourth, {
            1: {
                b: "Two"
            },
            2: {
                b: "Four"
            },
            3: {
                b: "Six"
            }
        }, "Deleted 'fourth.*.a'");
    });

    test("String index", function () {
        var data = {};

        // sets string for full text search
        function set(name) {
            core.set(data, name.split(''), {name: name});
        }

        // setting up cache
        set("hello");
        set("world");
        set("hero");
        set("wounded");
        set("worn");
        set("hers");
        set("wedding");

        // querying data
        deepEqual(query.many(data, "w.o...name"), [
            "world",
            "worn",
            "wounded"
        ], "wo...");
        deepEqual(query.many(data, "h.e.r...name"), [
            "hero",
            "hers"
        ], "her...");
        deepEqual(query.many(data, "w...name"), [
            "world",
            "worn",
            "wounded",
            "wedding"
        ], "w...");
        deepEqual(query.many(data, "h...name"), [
            "hello",
            "hero",
            "hers"
        ], "h...");
        deepEqual(query.many(data, "w.o.*.n...name"), [
            "worn",
            "wounded"
        ], "wo*n...");
        deepEqual(query.many(data, "*.e...name"), [
            "hello",
            "hero",
            "hers",
            "wedding"
        ], "*e...");
    });
}(flock.query,
    flock.core));
