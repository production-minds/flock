/*global flock, module, test, ok, equal, notEqual, deepEqual, raises */
(function ($utils) {
    module("Utils");

    var data = {
            hi: 'There!',
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey",
                third: 3
            }
        };

    test("Mixin", function () {
        var tmp;

        tmp = {};
        equal(
            $utils.mixin(tmp, data),
            tmp,
            "Original destination is changed"
        );

        tmp = {};
        deepEqual(
            $utils.mixin(tmp, data),
            data,
            "All source properties copied"
        );
    });

    test("Blend", function () {
        notEqual(
            $utils.blend({}, data),
            data,
            "Original destination object remains untouched"
        );

        deepEqual(
            $utils.blend({}, data),
            data,
            "All source properties copied"
        );
    });

    test("Extend", function () {
        var base,
            extended;

        base = {test: "hello"};
        extended = $utils.extend(base, data);

        console.log(extended);

        notEqual(extended, base, "Result is different from base");
        equal(extended.test, base.test, "Result has base property");
        equal(extended.hasOwnProperty('test'), false, "Base property moved a level up the prototype chain");

        base = {};
        extended = $utils.extend(base, data);

        deepEqual(
            extended,
            data,
            "All source properties copied"
        );
    });
}(flock.utils));
