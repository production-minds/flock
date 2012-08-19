/*global flock, module, test, ok, equal, notEqual, deepEqual, raises, console */
(function (u_query) {
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
        deepEqual(u_query.normalize(''), [], "Root path");
        deepEqual(u_query.normalize(path), apath, "String path " + path);
        deepEqual(u_query.normalize('first.*.bcde...55'), ['first', '*', 'bcde', null, '55'], "Path with wildcards");
        raises(function () {
            u_query.normalize('first.*.bcde......55');
        }, "Path with erroneous wildcards");
        raises(function () {
            u_query.Query(data, 'fourth...');
        }, "Path can't end in dot");
        deepEqual(u_query.normalize('first.1,2,3.*'), ['first', ['1', '2', '3'], '*'], "Array keys");
    });

    test("Pattern matching", function () {
        equal(u_query.match('first.a.bcde.1.55', 'first.a.bcde.1.55'), true, "Exact match");
        equal(u_query.match('first.a.bcde.1.55', 'first.a.*.1.55'), true, "Wildcard match");
        equal(u_query.match('first.a.bcde.1.55', 'first...1.55'), true, "Skipper match");
        equal(u_query.match('first.a.bcde.1.55', '...1.55'), true, "Leading skipper match");
        equal(u_query.match('first.a.bcde.1.55', 'first.a,b,c,d.bcde.1.55'), true, "Multiple key match");

        equal(u_query.match('first.a.bcde.1.55', 'first.a.u.1.55'), false, "Exact mismatch");
        equal(u_query.match('first.a.bcde.1.55', 'first.a.*.*.1.55'), false, "Wildcard mismatch");
        equal(u_query.match('first.a.bcde.1.55', 'first.a...2.55'), false, "Skipper mismatch");
        equal(u_query.match('first.a.bcde.1.55', 'first.b,c,d.bcde.1.55'), false, "Multiple key mismatch");
    });
}(flock.Query));
