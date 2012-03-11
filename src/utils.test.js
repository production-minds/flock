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
        },

        testData1 = {
            a: {
                foo: "hello",
                bar: {
                    test: "world"
                }
            },
            b: {
                foo: "lorem",
                bar: {
                    test: "ipsum"
                }
            }
        },

        testData2 = {
            foo: "hello",
            bar: "world"
        };

    test("Methods and poperties", function () {
        var staticTest = function (a, b) {
                return a + b;
            },
            undefTest = function () { },
            instanceTest;

        instanceTest = utils.genMethod(staticTest, [5]);
        equal(instanceTest(4), 9, "Generated method remembers arguments");

        instanceTest = utils.genMethod(undefTest, [5], function() { return "ready"; });
        equal(instanceTest(4), "ready", "Generated method applies mapper");

        instanceTest = utils.genMethod(staticTest, [5], function(result, custom) { return result + custom; }, 9);
        equal(instanceTest(4), 18, "Passing custom data to mapper");

        instanceTest = utils.genMethod(undefTest, [5], "foo");
        equal(instanceTest(4), "foo", "Generated method returns specified (non-function) value");
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

    test("Transform", function () {
        deepEqual(utils.transform(testData1, ['foo'], ['bar']), {
            hello: {
                test: "world"
            },
            lorem: {
                test: "ipsum"
            }
        });

        deepEqual(utils.transform(testData1, ['foo'], ['bar', 'test']), {
            hello: "world",
            lorem: "ipsum"
        });

        deepEqual(utils.transform(testData1, ['foo'], ['bar', 'test'], []), {
            "hello": {
                "world": {
                    "foo": "hello",
                    "bar": {
                        "test": "world"
                    }
                }
            },
            "lorem": {
                "ipsum": {
                    "foo": "lorem",
                    "bar": {
                        "test": "ipsum"
                    }
                }
            }
        }, "Empty path as last node attaches child nodes to the lookup as leaf nodes");

        raises(function () {
            utils.transform(testData2, ['foo'], ['bar']);
        }, "Non-object child nodes raise error");
    });
}(flock.utils));
