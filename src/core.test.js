/*global flock, module, test, ok, equal, deepEqual */
(function (basic) {
    module("Core");

    var data = {
        hi: 'There!',
        hello: {
            world: {
                center: "!!"
            },
            all: "hey"
        }
    };

    test("Getting", function () {
        equal(basic.get(data, ['hi']), "There!", "Getting ordinal value");
        equal(basic.get(data, ['hello', 'world']), data.hello.world, "Getting datastore node");
        ok(typeof basic.get(data, ['hello', 'yall']) === 'undefined', "Attempting to get from invalid path returns undefined");
    });

    test("Setting", function () {
        basic.set(data, ['hello', 'world', 'test'], "test");
        equal(data.hello.world.test, "test", "Value set on existing node");

        basic.set(data, ['hello', 'yall', 'folks'], "test");
        equal(data.hello.yall.folks, "test", "Value set on non-existing path");
    });
}(flock.core));
