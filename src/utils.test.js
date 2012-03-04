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

    test("Methods and poperties", function () {
        var staticTest = function (a, b) {
                return a + b;
            },
            undefTest = function () { },
            instanceTest;

        instanceTest = utils.genMethod(staticTest, [5]);
        equal(instanceTest(4), 9, "Generated method remembers arguments");

        instanceTest = utils.genMethod(undefTest, [5], "ready");
        equal(instanceTest(4), "ready", "Generated method returns specified value");
    });

    test("Objects", function () {
        equal(utils.isEmpty({}), true, "Empty object tested for empty");
        equal(utils.isEmpty({foo: "bar"}), false, "Non-empty object tested for empty");

        equal(utils.isSingle({}), false, "Empty object tested for single");
        equal(utils.isSingle({foo: "bar"}), true, "Single-property object tested for single");
        equal(utils.isSingle({foo: "bar", what: "eva"}), false, "Multi-property object tested for single");

        equal(utils.firstProperty({foo: "bar"}), 'foo', "First property of an object");
        ok(typeof utils.firstProperty({}) === 'undefined', "First property of an empty object");
    });

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
