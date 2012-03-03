/*global flock, module, test, ok, equal, deepEqual, raises */
(function (utils) {
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

    test("Delegation", function () {
        var tmp,
            key, count;

        tmp = {};
        utils.delegateProperty(tmp, data, 'hi');
        equal(tmp.hi, data.hi, "Delegating single property");

        raises(function () {
            utils.delegateProperty(tmp, data, 'hi');
        }, "Attempting to overwrite existing property fails");

        utils.delegateProperty(tmp, data, 'hi', true);
        equal(tmp.hi, data.hi, "Overwriting single property in silent mode");

        tmp = {};
        utils.delegate(tmp, data);
        deepEqual(tmp, data, "Delegating all properties");

        tmp = {};
        count = 0;
        utils.delegate(tmp, data.hello, ['world', 'third']);
        for (key in tmp) {
            if (tmp.hasOwnProperty(key)) {
                count++;
            }
        }
        ok(count === 2 && tmp.world === data.hello.world && tmp.third === data.hello.third,
            "Delegating specified properties");
    });
}(flock.utils));
