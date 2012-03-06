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

    test("Path normalization", function () {
        var path = 'first.a.bcde.1.55',
			apath = path.split('.');
        deepEqual(query.normalizePath(''), [], "Root path");
        deepEqual(query.normalizePath(path), apath, "String path " + path);
        deepEqual(query.normalizePath('first.*.bcde...55'), ['first', '*', 'bcde', null, '55'], "Path with wildcards");
        raises(function () {
            query.normalizePath('first.*.bcde......55');
        }, "Path with erroneous wildcards");
        raises(function () {
            query.query(data, 'fourth...');
        }, "Path can't end in dot");
        deepEqual(query.normalizePath('first.1,2,3.*'), ['first', ['1', '2', '3'], '*'], "Array keys");
    });

    test("Wildcards", function () {
        // testing single-level wildcards
        deepEqual(
            query.query(data, 'fourth.*'),
            [{a: "One", b: "Two"}, {a: "Three", b: "Four"}, {a: "Five", b: "Six"}],
            "Collecting nodes from path 'fourth.*'");
        deepEqual(
            query.query(data, 'fourth.*', {limit: 1}),
            [{a: "One", b: "Two"}],
            "Retrieving first node from path 'fourth.*'");
        deepEqual(
            query.query(data, 'fourth.*.a'),
            ["One", "Three", "Five"],
            "Collecting nodes from path 'fourth.*.a'");
        deepEqual(
            query.query(data, 'fourth.2.*'),
            ["Three", "Four"],
            "Collecting nodes from path 'fourth.2.*'");
        deepEqual(
            query.query(data, '*.1'),
            [{}, {a: "One", b: "Two"}],
            "Collecting nodes from path '*.1'");

        deepEqual(
            query.query(data, 'first,second.*', {mode: flock.both}),
            {a: {}, b: {}, c: {}, d: {}, e: {}, 1: {}, 2: {}, 3: {}},
            "Getting results as lookup");
    });

    test("Ignored key", function () {
        query.ignoredKey('2');
        deepEqual(
            query.query(data, 'fourth.*'),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Ignoring key '2' along path 'fourth.*'");

        query.ignoredKey();
    });

    test("OR relation", function () {
        deepEqual(
            query.query(data, ['fourth', [1, 3]]),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Collecting specific nodes from path 'fourth.1,3'");
        deepEqual(
            query.query(data, 'fourth.1,3'),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Collecting specific nodes from path 'fourth.1,3' (passed as string)");
        deepEqual(
            query.query(data, ['fourth', [1, 3], '*']),
            ["One", "Two", "Five", "Six"],
            "Collecting specific nodes from path 'fourth.1,3.*'");
        deepEqual(
            query.query(data, [['first', 'third']]),
            [{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
            "Collecting specific nodes from path 'first,third'");
        deepEqual(
            query.query(data, 'first,third'),
            [{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
            "Collecting specific nodes from path 'first,third' (passed as string)");

        deepEqual(
            query.query(data, [['thousandth', 'third']]),
            [{}],
            "Collecting non-existent keys");
        deepEqual(
            query.query(data, [['thousandth', 'third']], {mode: flock.both}),
            {third: {}},
            "Collecting non-existent keys (as lookup)");
        deepEqual(
            query.query(data, [['thousandth', 'third']], {undef: true}),
            [undefined, {}],
            "Collecting non-existent keys (undefined values allowed)");
    });

    test("Counting", function () {
        equal(query.query(data, 'first.*', {mode: flock.count}), 5, "5 elements on path 'first.*'");
        equal(query.query(data, 'fourth.*.a', {mode: flock.count}), 3, "3 elements on path 'fourth.*.a'");
        equal(query.query(data, '...a', {mode: flock.count}), 4, "4 elements on path '...a'");
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
            query.query(data, '...1'),
            [{}, "hello", "two", "test"],
            "Collecting nodes from path '...1'");
        deepEqual(
            query.query(data, ['what', '3', 'awe']),
            ["some"],
            "Collecting nodes from path 'what.3.awe'");
        deepEqual(
            query.query(data, [null, '3', 'awe']),
            ["some"],
            "Collecting nodes from path '...3.awe'");

        // creating loopback
        data.test.b = data.test;
        deepEqual(
            query.query(data, '...1'),
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

        equal(query.query(data, ''), data, ".query('') and datastore root point to the same object");
        deepEqual(query.query(data, ['test', '.']), ['dot'], "Dot as key acts as regular string");
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

        query.query(data, 'fourth.*.a', {value: {}});
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

        query.query(data, 'fourth.*.a', {value: "A"});
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

        query.query(data, 'fourth.*.b', {value: function (leaf) {
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

        query.query(data, 'fourth.*.c', {value: "C"});
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

        query.query(data, 'fourth', {value: {
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
        query.query(data, 'fourth.*.a', {mode: flock.del});
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
        deepEqual(query.query(data, "w.o...name"), [
            "world",
            "worn",
            "wounded"
        ], "wo...");
        deepEqual(query.query(data, "h.e.r...name"), [
            "hero",
            "hers"
        ], "her...");
        deepEqual(query.query(data, "w...name"), [
            "world",
            "worn",
            "wounded",
            "wedding"
        ], "w...");
        deepEqual(query.query(data, "h...name"), [
            "hello",
            "hero",
            "hers"
        ], "h...");
        deepEqual(query.query(data, "w.o.*.n...name"), [
            "worn",
            "wounded"
        ], "wo*n...");
        deepEqual(query.query(data, "*.e...name"), [
            "hello",
            "hero",
            "hers",
            "wedding"
        ], "*e...");
    });
}(flock.query,
    flock.core));
