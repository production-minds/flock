/*global flock, module, test, ok, equal, deepEqual */
(function (utils) {
    module("Utils");

    var data = {
        hi: 'There!',
        hello: {
            world: {
                center: "!!"
            },
            all: "hey"
        }
    };

    test("Delegation", function () {
        var tmp,
            key, count;

        tmp = {};
        utils.delegate(tmp, data);
        deepEqual(tmp, data, "Delegating all properties");

        tmp = {};
        count = 0;
        utils.delegate(tmp, data, ['hi']);
        for (key in tmp) {
            if (tmp.hasOwnProperty(key)) {
                count++;
            }
        }
        ok(count === 1 && tmp.hi === data.hi, "Delegating single property");
    });
}(flock.utils));
