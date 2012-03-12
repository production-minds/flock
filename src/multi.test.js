/*global flock, module, test, ok, equal, notEqual, deepEqual, raises, console */
(function ($, u_multi, u_single) {
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

    module("Multi");

    test("Wildcards", function () {
        // testing single-level wildcards
        deepEqual(
            u_multi.query(data, 'fourth.*'),
            [{a: "One", b: "Two"}, {a: "Three", b: "Four"}, {a: "Five", b: "Six"}],
            "Collecting nodes from path 'fourth.*'");
        deepEqual(
            u_multi.query(data, 'fourth.*', {limit: 1}),
            [{a: "One", b: "Two"}],
            "Retrieving first node from path 'fourth.*'");
        deepEqual(
            u_multi.query(data, 'fourth.*.a'),
            ["One", "Three", "Five"],
            "Collecting nodes from path 'fourth.*.a'");
        deepEqual(
            u_multi.query(data, 'fourth.2.*'),
            ["Three", "Four"],
            "Collecting nodes from path 'fourth.2.*'");
        deepEqual(
            u_multi.query(data, '*.1'),
            [{}, {a: "One", b: "Two"}],
            "Collecting nodes from path '*.1'");

        deepEqual(
            u_multi.query(data, 'first,second.*', {mode: $.BOTH}),
            {a: {}, b: {}, c: {}, d: {}, e: {}, 1: {}, 2: {}, 3: {}},
            "Getting results as lookup");
    });

    test("Ignored key", function () {
        u_multi.ignoredKey('2');
        deepEqual(
            u_multi.query(data, 'fourth.*'),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Ignoring key '2' along path 'fourth.*'");

        u_multi.ignoredKey();
    });

    test("OR relation", function () {
        deepEqual(
            u_multi.query(data, ['fourth', [1, 3]]),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Collecting specific nodes from path 'fourth.1,3'");
        deepEqual(
            u_multi.query(data, 'fourth.1,3'),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Collecting specific nodes from path 'fourth.1,3' (passed as string)");
        deepEqual(
            u_multi.query(data, ['fourth', [1, 3], '*']),
            ["One", "Two", "Five", "Six"],
            "Collecting specific nodes from path 'fourth.1,3.*'");
        deepEqual(
            u_multi.query(data, [['first', 'third']]),
            [{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
            "Collecting specific nodes from path 'first,third'");
        deepEqual(
            u_multi.query(data, 'first,third'),
            [{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
            "Collecting specific nodes from path 'first,third' (passed as string)");

        deepEqual(
            u_multi.query(data, [['thousandth', 'third']]),
            [{}],
            "Collecting non-existent keys");
        deepEqual(
            u_multi.query(data, [['thousandth', 'third']], {mode: $.BOTH}),
            {third: {}},
            "Collecting non-existent keys (as lookup)");
        deepEqual(
            u_multi.query(data, [['thousandth', 'third']], {undef: true}),
            [undefined, {}],
            "Collecting non-existent keys (undefined values allowed)");
    });

    test("Counting", function () {
        equal(u_multi.query(data, 'first.*', {mode: $.COUNT}), 5, "5 elements on path 'first.*'");
        equal(u_multi.query(data, 'fourth.*.a', {mode: $.COUNT}), 3, "3 elements on path 'fourth.*.a'");
        equal(u_multi.query(data, '...a', {mode: $.COUNT}), 4, "4 elements on path '...a'");
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
            u_multi.query(data, '...1'),
            [{}, "hello", "two", "test"],
            "Collecting nodes from path '...1'");
        deepEqual(
            u_multi.query(data, ['what', '3', 'awe']),
            ["some"],
            "Collecting nodes from path 'what.3.awe'");
        deepEqual(
            u_multi.query(data, [null, '3', 'awe']),
            ["some"],
            "Collecting nodes from path '...3.awe'");

        // creating loopback
        data.test.b = data.test;
        deepEqual(
            u_multi.query(data, '...1'),
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

        equal(u_multi.query(data, ''), data, ".query('') and datastore root point to the same object");
        deepEqual(u_multi.query(data, ['test', '.']), ['dot'], "Dot as key acts as regular string");
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

        u_multi.query(data, 'fourth.*.a', {value: {}});
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

        u_multi.query(data, 'fourth.*.a', {value: "A"});
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

        u_multi.query(data, 'fourth.*.b', {value: function (leaf) {
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

        u_multi.query(data, 'fourth.*.c', {value: "C"});
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

        u_multi.query(data, 'fourth', {value: {
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
        u_multi.query(data, 'fourth.*.a', {mode: $.DEL});
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
        function addWord(name) {
            u_single.set(data, name.split(''), {name: name});
        }

        // setting up cache
        addWord("hello");
        addWord("world");
        addWord("hero");
        addWord("wounded");
        addWord("worn");
        addWord("hers");
        addWord("wedding");

        // querying data
        deepEqual(u_multi.query(data, "w.o...name"), [
            "world",
            "worn",
            "wounded"
        ], "wo...");
        deepEqual(u_multi.query(data, "h.e.r...name"), [
            "hero",
            "hers"
        ], "her...");
        deepEqual(u_multi.query(data, "w...name"), [
            "world",
            "worn",
            "wounded",
            "wedding"
        ], "w...");
        deepEqual(u_multi.query(data, "h...name"), [
            "hello",
            "hero",
            "hers"
        ], "h...");
        deepEqual(u_multi.query(data, "w.o.*.n...name"), [
            "worn",
            "wounded"
        ], "wo*n...");
        deepEqual(u_multi.query(data, "*.e...name"), [
            "hello",
            "hero",
            "hers",
            "wedding"
        ], "*e...");
    });
}(flock,
    flock.multi,
    flock.single));
