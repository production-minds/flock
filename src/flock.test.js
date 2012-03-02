/*global flock, module, test, ok, equal, notEqual, deepEqual, raises, console */
(function (flock) {
    var cache = flock({
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
    });

    module("Basics");

    test("Path resolution", function () {
        var path = 'first.a.bcde.1.55',
			apath = path.split('.');
        deepEqual(flock.resolve(''), [], "Root path");
        deepEqual(flock.resolve(path), apath, "String path " + path);
        deepEqual(flock.resolve('first.*.bcde...55'), ['first', '*', 'bcde', null, '55'], "Path with wildcards");
        raises(function () {
            flock.resolve('first.*.bcde......55');
        }, "Path with erroneous wildcards");
        raises(function () {
            cache.many('fourth...');
        }, "Path can't end in dot");
        deepEqual(flock.resolve('first.1,2,3.*'), ['first', ['1', '2', '3'], '*'], "Array keys");
    });

    module("Access");

    test("Accessing values", function () {
        ok(cache.get('first.a'), "Path 'cache.first.a' is defined");
        ok(!cache.get('first.f'), "Path 'cache.first.f' is undefined");
        raises(function () {
            cache.get('fifth.a');
        }, function (msg) {
            console.log(msg);
            return true;
        }, "Invalid path raises exception");
    });

    module("Queries");

    test("Wildcards", function () {
        // testing single-level wildcards
        deepEqual(
            cache.many('fourth.*'),
            [{a: "One", b: "Two"}, {a: "Three", b: "Four"}, {a: "Five", b: "Six"}],
            "Collecting nodes from path 'fourth.*'");
        deepEqual(
            cache.many('fourth.*', {limit: 1}),
            [{a: "One", b: "Two"}],
            "Retrieving first node from path 'fourth.*'");
        deepEqual(
            cache.many('fourth.*.a'),
            ["One", "Three", "Five"],
            "Collecting nodes from path 'fourth.*.a'");
        deepEqual(
            cache.many('fourth.2.*'),
            ["Three", "Four"],
            "Collecting nodes from path 'fourth.2.*'");
        deepEqual(
            cache.many('*.1'),
            [{}, {a: "One", b: "Two"}],
            "Collecting nodes from path '*.1'");

        deepEqual(
            cache.many('first,second.*', {mode: flock.both}),
            {a: {}, b: {}, c: {}, d: {}, e: {}, 1: {}, 2: {}, 3: {}},
            "Getting results as lookup");
    });

    test("OR relation", function () {
        deepEqual(
            cache.many(['fourth', [1, 3]]),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Collecting specific nodes from path 'fourth.1,3'");
        deepEqual(
            cache.many('fourth.1,3'),
            [{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
            "Collecting specific nodes from path 'fourth.1,3' (passed as string)");
        deepEqual(
            cache.many(['fourth', [1, 3], '*']),
            ["One", "Two", "Five", "Six"],
            "Collecting specific nodes from path 'fourth.1,3.*'");
        deepEqual(
            cache.many([['first', 'third']]),
            [{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
            "Collecting specific nodes from path 'first,third'");
        deepEqual(
            cache.many('first,third'),
            [{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
            "Collecting specific nodes from path 'first,third' (passed as string)");

        deepEqual(
            cache.many([['thousandth', 'third']]),
            [{}],
            "Collecting non-existent keys");
        deepEqual(
            cache.many([['thousandth', 'third']], {mode: flock.both}),
            {third: {}},
            "Collecting non-existent keys (as lookup)");
        deepEqual(
            cache.many([['thousandth', 'third']], {undef: true}),
            [undefined, {}],
            "Collecting non-existent keys (undefined values allowed)");
    });

    test("Counting", function () {
        equal(cache.many('first.*', {mode: flock.count}), 5, "5 elements on path 'first.*'");
        equal(cache.many('fourth.*.a', {mode: flock.count}), 3, "3 elements on path 'fourth.*.a'");
        equal(cache.many('...a', {mode: flock.count}), 4, "4 elements on path '...a'");
    });

    test("Skipping", function () {
        // testing multi-level wildcards
        var cache = flock({
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
        });

        deepEqual(
            cache.many('...1'),
            [{}, "hello", "two", "test"],
            "Collecting nodes from path '...1'");
        deepEqual(
            cache.many(['what', '3', 'awe']),
            ["some"],
            "Collecting nodes from path 'what.3.awe'");
        deepEqual(
            cache.many([null, '3', 'awe']),
            ["some"],
            "Collecting nodes from path '...3.awe'");

        // creating loopback
        cache.set('test.b', cache.get('test'));
        ok(typeof cache.get('test.b') !== 'undefined', "Loopback set");
        deepEqual(
            cache.many('...1'),
            [{}, "hello", "two", "test"],
            "Loopbacks don't affect result");
    });

    test("Edge cases", function () {
        var cache = flock({
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
        });

        equal(cache.get(''), cache.root(), ".get('') and .root() point to the same object");
        equal(cache.many(''), cache.root(), ".many('') and .root() point to the same object");
        raises(function () {
            cache.set('', {});
        }, "Can't set root");
        deepEqual(cache.many(['test', '.']), ['dot'], "Dot as key acts as regular string");
    });

    module("Updating");

    test("Modifying values", function () {
		// saving backup
		var tmp = cache.root().first.b,
			ref;

        cache.set('first.b');
        deepEqual(cache.get(['first', 'b']), {}, "Setting empty object by default");

        cache.set('first.b', 1);
        equal(cache.root().first.b, 1, "Setting value on existing path (cache.first.a)");
        ref = cache.set('thousandth.x.5', 1000);
        equal(cache.root().thousandth.x[5], 1000, "Setting value on non-existing path (cache.thousandth.x.5)");
        equal(ref, cache.root().thousandth.x, "Method .set() returns reference to input node");

		// restoring modified node
		cache.root().first.b = tmp;
    });

    test("Deleting values", function () {
        var success;

        cache.set('thousandth.x.5', 1000);
        success = cache.unset('thousandth.x.5');
        ok(typeof cache.root().thousandth.x[5] === 'undefined', "Deleting value from cache (cache.thousandth.x.5)");

        equal(success, true, "Deletion returns success flag");

        equal(cache.unset('thousandth.x.5'), false, "Attempting to deletie non-existent value");
    });

    test("Modifying multiple nodes", function () {
        cache.mset('fourth.*.a');
        deepEqual(cache.get('fourth'), {
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

        cache.many('fourth.*.a', {value: "A"});
        deepEqual(cache.get('fourth'), {
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

        cache.many('fourth.*.b', {value: function (leaf) {
            return leaf + "X";
        }});
        deepEqual(cache.get('fourth'), {
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

        cache.many('fourth.*.c', {value: "C"});
        deepEqual(cache.get('fourth'), {
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
        cache.many('fourth', {value: {
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
        cache.many('fourth.*.a', {mode: flock.del});
        deepEqual(cache.get('fourth'), {
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

    module("Search");

    test("String index", function () {
        var index = flock();

        // sets string for full text search
        function set(name) {
            index.set(name.split(''), {name: name});
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
        deepEqual(index.many("w.o...name"), [
            "world",
            "worn",
            "wounded"
        ], "wo...");
        deepEqual(index.many("h.e.r...name"), [
            "hero",
            "hers"
        ], "her...");
        deepEqual(index.many("w...name"), [
            "world",
            "worn",
            "wounded",
            "wedding"
        ], "w...");
        deepEqual(index.many("h...name"), [
            "hello",
            "hero",
            "hers"
        ], "h...");
        deepEqual(index.many("w.o.*.n...name"), [
            "worn",
            "wounded"
        ], "wo*n...");
        deepEqual(index.many("*.e...name"), [
            "hello",
            "hero",
            "hers",
            "wedding"
        ], "*e...");
    });
}(flock));
