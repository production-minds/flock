/*global flock, module, test, ok, equal, deepEqual, raises */
(function (u_utils) {
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

        instanceTest = u_utils.genMethod(staticTest, [5]);
        equal(instanceTest(4), 9, "Generated method remembers arguments");

        instanceTest = u_utils.genMethod(undefTest, [5], function() { return "ready"; });
        equal(instanceTest(4), "ready", "Generated method applies mapper");

        instanceTest = u_utils.genMethod(staticTest, [5], function(result, custom) { return result + custom; }, 9);
        equal(instanceTest(4), 18, "Passing custom data to mapper");

        instanceTest = u_utils.genMethod(undefTest, [5], "foo");
        equal(instanceTest(4), "foo", "Generated method returns specified (non-function) value");
    });

    test("Objects", function () {
        equal(u_utils.isEmpty({}), true, "Empty object tested for empty");
        equal(u_utils.isEmpty({foo: "bar"}), false, "Non-empty object tested for empty");
        equal(u_utils.isEmpty({foo: "bar"}, 'foo'), true, "Non-empty object with ignored key tested for empty");

        equal(u_utils.isSingle({}), false, "Empty object tested for single");
        equal(u_utils.isSingle({foo: "bar"}), true, "Single-property object tested for single");
        equal(u_utils.isSingle({foo: "bar", what: "eva"}), false, "Multi-property object tested for single");
        equal(u_utils.isSingle({foo: "bar", what: "eva"}, 'foo'), true, "Multi-property object with ignored key tested for single");

        equal(u_utils.firstProperty({foo: "bar"}), 'foo', "First property of an object");
        ok(typeof u_utils.firstProperty({}) === 'undefined', "First property of an empty object");
    });

    test("Delegation", function () {
        var tmp,
            key, count;

        tmp = {};
        u_utils.delegateProperty(tmp, data, 'hi');
        equal(tmp.hi, data.hi, "Delegating single property");

        raises(function () {
            u_utils.delegateProperty(tmp, data, 'hi');
        }, "Attempting to overwrite existing property fails");

        u_utils.delegateProperty(tmp, data, 'hi', true);
        equal(tmp.hi, data.hi, "Overwriting single property in silent mode");

        tmp = {};
        u_utils.delegate(tmp, data);
        deepEqual(tmp, data, "Delegating all properties");

        tmp = {};
        count = 0;
        u_utils.delegate(tmp, data.hello, ['world', 'third']);
        for (key in tmp) {
            if (tmp.hasOwnProperty(key)) {
                count++;
            }
        }
        ok(count === 2 && tmp.world === data.hello.world && tmp.third === data.hello.third,
            "Delegating specified properties");
    });
}(flock.utils));
