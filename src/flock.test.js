/*global flock, module, test, ok, equal, notEqual, deepEqual, raises, console */
(function () {
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

    module("Flock");

    test("Core", function () {
        deepEqual(cache.get(['first', 'a']), {}, "Core functions work");
    });
}());
