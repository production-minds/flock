/*global flock, module, test, expect, ok, equal, deepEqual, raises */
(function ($evented2, $evented, $single) {
    module("Event 2");

    var
        root = {
            hi: 'There!',
            hello: {
                world: {
                    center: "!!"
                },
                all: "hey"
            },
            bybye: {
                world: {}
            }
        },

        // evented datastore
        original = $evented.create($single.create(root)),

        // derived evented datastore
        derived = $evented2.create($single.create(root.hello.world, null, {
            ds: original,
            offset: ['hello', 'world']
        }));

    test("Creation", function () {
        deepEqual(derived.origin.offset, ['hello', 'world'], "Derived offset");
        equal(derived.origin.ds, original, "Original datasotre in derived");
    });

    test("Subscription", function () {
        expect(2);

        derived.on(
            'center',
            'testEvent',
            function (event) {
                equal(event.name, 'testEvent', "Name of test event");
                equal(event.target, 'hello.world.center', "Abslolute path to affected node");
            }
        );

        original
            .trigger('hello.world.center', 'testEvent')
            .off('hello.world.center', 'testEvent');
    });

    test("Triggering", function () {
        expect(2);

        original.on(
            'hello.world.center',
            'testEvent',
            function (event) {
                equal(event.name, 'testEvent', "Name of test event");
                equal(event.target, 'hello.world.center', "Absolute path to affected node");
            }
        );

        derived
            .trigger('center', 'testEvent')
            .off('center', 'testEvent');
    });

    test("Delegation", function () {
        expect(2);
        original.delegate(
            '',
            'testEvent',
            '*.world',
            function (event) {
                equal(event.name, 'testEvent', "Name of test event");
                equal(event.target, 'hello.world', "Absolute path to affected node");
            }
        );

        derived
            .trigger('', 'testEvent')
            .trigger('center', 'testEvent');

        original.off('');
    });

    test("Access", function () {
        expect(2);
        original.on(
            '',
            flock.ACCESS,
            function (event) {
                equal(event.target, 'hello.world.test', "Absolute path to accessed missing node");
            }
        );

        original.get('hello.world.test');
        derived.get('test');

        original.off('');
    });

    test("Setting", function () {
        expect(2);
        original.on(
            '',
            flock.CHANGE,
            function (event, data) {
                equal(data.after, 'testValue', "Value set on node");
                equal(event.target, 'hello.world.test', "Absolute path to changed node");
            }
        );

        derived.set('test', 'testValue');

        original.off('');
    });

    test("Unsetting", function () {
        derived.set('test', 'testValue');

        expect(2);
        original.on(
            '',
            flock.REMOVE,
            function (event, data) {
                equal(data.before, 'testValue', "Before value removed from node");
                equal(event.target, 'hello.world.test', "Absolute path to removed node");
            }
        );

        derived.unset('test', 'testValue');

        original.off('');
    });
}(
    flock.evented2,
    flock.evented,
    flock.single
));
