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

    cache.init();

    test("Live", function () {
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

    test("Events", function () {
        var i;
        function testHandler() { i++; }

        // triggering event on child node and capturing on parent node
        cache.get(['fourth'])
            .on('testEvent', testHandler);
        i = 0;
        cache.get(['fourth', '1'])
            .trigger('testEvent', "moreInfo");
        equal(i, 1, "Event triggered and captured");
        cache.get(['fourth'])
            .off('testEvent');

        // capturing event on root node
        cache.on('testEvent', testHandler);
        i = 0;
        cache.get(['fourth', '1'])
            .trigger('testEvent', "moreInfo");
        equal(i, 1, "Event captured on root node");
        cache.off('testEvent');
    });

    test("Querying", function () {
        deepEqual(
            cache
                .query('fourth.*', {mode: flock.both})
                .get('1')
                    .node(),
            cache
                .get('fourth.1')
                    .node(),
            "Stacked querying and getting"
        );
    });
}(flock));
