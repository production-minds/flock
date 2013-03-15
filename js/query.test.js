/*global flock, module, test, ok, equal, notEqual, deepEqual, raises, console */
(function (Query) {
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

    test("Normalization", function () {
        var path = 'first.a.bcde.1.55',
			apath = path.split('.');
        deepEqual(Query.normalize(''), [], "Root path");
        deepEqual(Query.normalize(path), apath, "String path " + path);
        deepEqual(Query.normalize('first.*.bcde...55'), ['first', '*', 'bcde', null, '55'], "Path with wildcards");
        raises(function () {
            Query.normalize('first.*.bcde......55');
        }, "Path with erroneous wildcards");
        raises(function () {
            Query.query(data, 'fourth...');
        }, "Path can't end in dot");
        deepEqual(Query.normalize('first.1,2,3.*'), ['first', ['1', '2', '3'], '*'], "Array keys");
    });

    test("Pattern matching", function () {
        equal(Query.match('first.a.bcde.1.55', 'first.a.bcde.1.55'), true, "Exact match");
        equal(Query.match('first.a.bcde.1.55', 'first.a.*.1.55'), true, "Wildcard match");
        equal(Query.match('first.a.bcde.1.55', 'first...1.55'), true, "Skipper match");
        equal(Query.match('first.a.bcde.1.55', '...1.55'), true, "Leading skipper match");
        equal(Query.match('first.a.bcde.1.55', 'first.a,b,c,d.bcde.1.55'), true, "Multiple key match");

        equal(Query.match('first.a.bcde.1.55', 'first.a.u.1.55'), false, "Exact mismatch");
        equal(Query.match('first.a.bcde.1.55', 'first.a.*.*.1.55'), false, "Wildcard mismatch");
        equal(Query.match('first.a.bcde.1.55', 'first.a...2.55'), false, "Skipper mismatch");
        equal(Query.match('first.a.bcde.1.55', 'first.b,c,d.bcde.1.55'), false, "Multiple key mismatch");
    });
}(flock.Query));
