/*global flock, module, test, ok, equal, notEqual, deepEqual, raises */
(function () {
    function getDs() {
        return flock.compat({
            first : {
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
            third : {},
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
    }

    module("Flock");

    test("Utils", function () {
        var ds = getDs();
        deepEqual(ds.keys(), ['first', 'second', 'third', 'fourth'], "Key extraction");
    });

    test("Creation", function () {
        equal(flock.compat(5).root, 5, "Flock based on ordinal (number)");
        equal(flock.compat("hello").root, "hello", "Flock based on ordinal (string)");
        equal(flock.compat(true).root, true, "Flock based on ordinal (boolean)");
        equal(flock.compat(null).root, null, "Flock based on null");

        deepEqual(flock.compat().root, {}, "Flock based on undefined defaults to empty object");
        equal(typeof flock.compat().get('test'), 'undefined', "Derived flock based on undefined");
    });

    test("Single", function () {
        var ds = getDs();

        deepEqual(ds.get(['fourth', '1', 'a']), "One", "Simple get");

        ok(typeof ds.get(['nonexisting', '1', 'a']) === 'undefined', "Empty result set returns undefined");

        ds = flock.compat({hello: {world: {}}});
        deepEqual(ds.get('hello'), {world: {}}, "Simple get with object result");
    });

    test("Options", function () {
        var ds = getDs();

        ok(
            !ds.nomulti && !ds.noevent,
            "All flags are false by default"
        );

        var tmp;

        tmp = flock.compat({hello: {world: {}}}, {
            noevent: true
        });

        equal(
            tmp.noevent,
            true,
            "Non-default options set (noevent: true)"
        );

        tmp.nomulti = true;
        ok(typeof tmp.nomulti === 'undefined', "Options cannot be modified through property");

        tmp = flock.compat({}, flock.COMPAT);
        ok(
            tmp.noevent,
            "Compatibility options"
        );
    });

    test("Events", function () {
        var ds = getDs(),
            i;

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

    test("Mapping", function () {
        var ds = flock.compat({
                emp1: {fname: "John", lname: "Smith", department: "IT"},
                emp2: {fname: "John", lname: "Green", department: "HR"},
                emp3: {fname: "Matt", lname: "Smith", department: "IT"}
            }),
            tmp;

        tmp = ds.map(['department'], ['lname'], ['fname'], []);

        deepEqual(
            tmp,
            {
                "IT": {
                    "Smith": {
                        "John": {
                            "fname"     : "John",
                            "lname"     : "Smith",
                            "department": "IT"
                        },
                        "Matt": {
                            "fname"     : "Matt",
                            "lname"     : "Smith",
                            "department": "IT"
                        }
                    }
                },
                "HR": {
                    "Green": {
                        "John": {
                            "fname"     : "John",
                            "lname"     : "Green",
                            "department": "HR"
                        }
                    }
                }
            },
            "Query result mapped to lookup"
        );

        tmp = ds.map('department', 'fname', 'lname', '');

        deepEqual(
            tmp,
            {
                "IT": {
                    "John": {
                        "Smith": {
                            "fname"     : "John",
                            "lname"     : "Smith",
                            "department": "IT"
                        }
                    },
                    "Matt": {
                        "Smith": {
                            "fname"     : "Matt",
                            "lname"     : "Smith",
                            "department": "IT"
                        }
                    }
                },
                "HR": {
                    "John": {
                        "Green": {
                            "fname"     : "John",
                            "lname"     : "Green",
                            "department": "HR"
                        }
                    }
                }
            },
            "Passing pats in string notation"
        );
    });
}());
