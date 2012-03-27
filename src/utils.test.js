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
        equal(u_utils.isEmpty(), true, "Undefined tested for empty");
        equal(u_utils.isEmpty(null), true, "Null tested for empty");
        equal(u_utils.isEmpty(0), true, "Number tested for empty");
        equal(u_utils.isEmpty("hello"), false, "String fails for empty");

        equal(u_utils.isEmpty({}), true, "Empty object tested for empty");
        equal(u_utils.isEmpty({foo: "bar"}), false, "Non-empty object tested for empty");

        equal(u_utils.isSingle({}), false, "Empty object tested for single");
        equal(u_utils.isSingle({foo: "bar"}), true, "Single-property object tested for single");
        equal(u_utils.isSingle({foo: "bar", what: "eva"}), false, "Multi-property object tested for single");

        equal(u_utils.isNull(0), false, "Number is not null");
        equal(u_utils.isNull(null), true, "Null is null");
        equal(u_utils.isUndefined(0), false, "Number is not undefined");
        equal(u_utils.isUndefined(undefined), true, "Undefined is not undefined");
        equal(u_utils.isOrdinal(null), false, "Null is not ordinal");
        equal(u_utils.isOrdinal(undefined), false, "Undefined is not ordinal");
        equal(u_utils.isOrdinal(0), true, "Number is ordinal");
        equal(u_utils.isOrdinal("hello"), true, "String is ordinal");
        equal(u_utils.isOrdinal(true), true, "Boolean is ordinal");

        equal(u_utils.isNode(0), false, "Number is not node");
        equal(u_utils.isNode("hello"), false, "String is not node");
        equal(u_utils.isNode(null), false, "Null is not node");
        equal(u_utils.isNode(undefined), false, "Undefined is not node");
        equal(u_utils.isNode({}), true, "Object is node");

        equal(u_utils.firstKey({foo: "bar"}), 'foo', "First property of an object");
        ok(typeof u_utils.firstKey({}) === 'undefined', "First property of an empty object");

        deepEqual(u_utils.keys({foo: "bar", hello: "world"}), ['foo', 'hello'], "Key extraction");
        deepEqual(u_utils.values({foo: "bar", hello: "world"}), ['bar', 'world'], "Value extraction");
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
