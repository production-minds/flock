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
        deepEqual(cache.get(['fourth', '1', 'a']).node(), "One", "Simple get");

        deepEqual(
            cache
                .get(['fourth', '1'])
                .get(['a'])
                    .node(),
            "One",
            "Stacked get"
        );

        deepEqual(
            cache
                .get(['fourth', '1'])
                .set(['c'], "Hello!")
                .get(['c'])
                    .node(),
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
                    .node(),
            cache
                .get(['fourth'])
                    .node(),
            "Parent acquired"
        );

        deepEqual(
            cache
                .get(['fourth', '1'])
                    .path(),
            ['fourth', '1'],
            "Path resolution"
        );

        equal(
            cache
                .get(['first', 'a'])
                    .name(),
            "a",
            "Node name retrieval"
        );
    });
}(flock));
