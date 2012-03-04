/*global flock, module, test, ok, equal, notEqual, deepEqual, raises, console */
(function ($) {
    var cache = $({
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

    module("Flock");

    test("Utils", function () {
        equal($.delegate, $.utils.delegate, "Delegation method delegated");
        equal($.isEmpty, $.utils.isEmpty, "Empty object tester method delegated");
    });

    test("Core", function () {
        deepEqual(cache.get(['fourth', '1', 'a']).root(), "One", "Simple get");

        deepEqual(
            cache
                .get(['fourth', '1'])
                .get(['a'])
                    .root(),
            "One",
            "Stacked get"
        );

        deepEqual(
            cache
                .get(['fourth', '1'])
                .set(['c'], "Hello!")
                .get(['c'])
                    .root(),
            "Hello!",
            "Stacked set & get"
        );
    });

    test("Live", function () {
        cache.init();

        equal(
            cache
                .get(['fourth', '1'])
                .parent()
                    .root(),
            cache
                .get(['fourth'])
                    .root(),
            "Parent acquired"
        );

        deepEqual(
            cache
                .get(['fourth', '1'])
                    .path(),
            ['fourth', '1'],
            "Path resolution"
        );
    });
}(flock));
