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

    test("Core", function () {
        deepEqual(cache.get(['fourth', '1', 'a']).node(), "One", "Simple get");

        deepEqual(
            cache
                .get(['fourth', '1'])
                .get(['a'])
                    .node(),
            "One",
            "Chained get"
        );

        deepEqual(
            cache
                .get(['fourth', '1'])
                .set(['c'], "Hello!")
                .get(['c'])
                    .node(),
            "Hello!",
            "Chained set & get"
        );

        var nonChainable = $({hello: {world: {}}}, {nolive: true, nochaining: true});
        deepEqual(nonChainable.get('hello'), {world: {}}, "Querying returns bare node on non-chaninng datastore");
    });

    test("Options", function () {
        deepEqual(cache.options(), {
            nolive: false,
            noinit: false,
            noevent: false,
            nomulti: false,
            nochaining: false
        }, "All flags are false by default");

        var tmp;

        tmp = $({hello: {world: {}}}, {
            nolive: true
        });

        deepEqual(tmp.options(), {
            nolive: true,
            noinit: undefined,
            noevent: undefined,
            nomulti: undefined,
            nochaining: undefined
        }, "Non-default options set (nolive: true)");

        deepEqual(tmp.get('hello.world').options(), {
            nolive: true,
            noinit: undefined,
            noevent: undefined,
            nomulti: undefined,
            nochaining: undefined
        }, "Derived flock object preserves options");

        tmp.options().noevent = true;
        ok(typeof tmp.options().noevent === 'undefined', "Options cannot be modified through property");

        // non-live tets
        ok(tmp.get(['hello', 'world']).empty(), "utils.empty delegated to flock");

        tmp = $({hello: {world: {}}}, {
            noinit: true
        });
        equal(tmp.node().hasOwnProperty($.live.metaKey()), false, "Option 'noinit' prevents automatic initialization");
    });

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

        var tmp = $({}, {nolive: true});
        ok(typeof cache.node()[$.live.metaKey()] === 'object', "Flock with 'nolive' off does initialize by default.");
        ok(typeof tmp.node()[$.live.metaKey()] === 'undefined', "Flock with 'nolive' on doesn't initialize by default.");
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
                .query('fourth.*', {mode: flock.BOTH})
                .get('1')
                    .node(),
            cache
                .get('fourth.1')
                    .node(),
            "Stacked querying and getting"
        );
    });
}(flock));
