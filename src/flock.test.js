/*global flock, module, test, ok, equal, notEqual, deepEqual, raises */
(function ($) {
    var
        ds = $({
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
        deepEqual(ds.keys(), ['first', 'second', 'third', 'fourth'], "Key extraction");
    });

    test("Creation", function () {
        equal($(5).root(), 5, "Flock based on ordinal (number)");
        equal($("hello").root(), "hello", "Flock based on ordinal (string)");
        equal($(true).root(), true, "Flock based on ordinal (boolean)");
        equal($(null).root(), null, "Flock based on null");

        deepEqual($().root(), {}, "Flock based on undefined defaults to empty object");
        equal(typeof $().get('test').root(), 'undefined', "Derived flock based on undefined");
    });

    test("Single", function () {
        deepEqual(ds.get(['fourth', '1', 'a']).root(), "One", "Simple get");

        deepEqual(
            ds
                .get(['fourth', '1'])
                .get(['a'])
                .root(),
            "One",
            "Chained get"
        );

        deepEqual(
            ds
                .get(['fourth', '1'])
                .set(['c'], "Hello!")
                .get(['c'])
                .root(),
            "Hello!",
            "Chained set & get"
        );

        ok(typeof ds.get(['nonexisting', '1', 'a']).root() === 'undefined', "Empty result set returns undefined");

        var nonChainable = $({hello: {world: {}}}, {nochaining: true});
        deepEqual(nonChainable.get('hello'), {world: {}}, "Querying returns bare node on non-chaninng datastore");
    });

    test("Options", function () {
        deepEqual(ds.options(), {}, "All flags are false by default");

        var tmp;

        tmp = $({hello: {world: {}}}, {
            noevent: true
        });

        deepEqual(
            tmp.options(),
            {
                noevent: true
            },
            "Non-default options set (nochaining: true)"
        );

        deepEqual(
            tmp.get('hello.world').options(),
            {
                noevent: true
            },
            "Derived flock object preserves options"
        );

        tmp.options().nomulti = true;
        ok(typeof tmp.options().nomulti === 'undefined', "Options cannot be modified through property");

        // non-live tets
        ok(tmp.get(['hello', 'world']).isEmpty(), "utils.empty delegated to flock");

        tmp = $({}, $.COMPAT);
        deepEqual(
            tmp.options(),
            {
                noevent: true,
                nochaining: true
            },
            "Compatibility options"
        );
    });

    test("Events", function () {
        var i;

        function testHandler() {
            i++;
        }

        // triggering event on child node and capturing on parent node
        ds.on(['fourth'], 'testEvent', testHandler);
        i = 0;
        ds.trigger(['fourth', '1'], 'testEvent', "moreInfo");
        equal(i, 1, "Event triggered and captured");
        ds.off(['fourth'], 'testEvent');

        // capturing event on root node
        ds.on([], 'testEvent', testHandler);
        i = 0;
        ds.trigger(['fourth', '1'], 'testEvent', "moreInfo");
        equal(i, 1, "Event captured on root node");
        ds.off([], 'testEvent');
    });

    test("Querying", function () {
        deepEqual(
            ds
                .mget('fourth.*', {mode: $.BOTH})
                .get('1')
                .root(),
            ds
                .get('fourth.1')
                .root(),
            "Stacked querying and getting"
        );
    });

    test("Mapping", function () {
        var
            ds = flock({
                employees: {
                    emp1: {fname: "John", lname: "Smith", department: "IT"},
                    emp2: {fname: "John", lname: "Green", department: "HR"},
                    emp3: {fname: "Matt", lname: "Smith", department: "IT"}
                }
            }),
            tmp;

        tmp = ds
            .get('employees')
            .map(['department'], ['lname'], ['fname'], []);

        ok(tmp.get('HR.Green.John'), "Query result mapped to lookup");

        tmp = ds
            .get('employees')
            .map('department', 'fname', 'lname', '');

        ok(tmp.get('HR.John.Green'), "Passing pats in string notation");
    });

    test("Origin", function () {
        equal(
            ds
                .get('fourth.1')
                .get('a')
                .origin().ds,
            ds,
            "Origin datastore OK"
        );

        deepEqual(
            ds
                .get('fourth.1')
                .get('a')
                .origin().path,
            ['fourth', '1', 'a'],
            "Origin path OK"
        );
    });
}(flock));
