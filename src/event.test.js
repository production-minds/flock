/*global flock, module, test, ok, equal, deepEqual, raises */
(function (live, event) {
    module("Event");

    var data = {
        hi: 'There!',
        hello: {
            world: {
                center: "!!"
            },
            all: "hey"
        }
    };

    live.init(data);

    test("Subscription", function () {
        function testHandler() { }

        raises(function () {
            event.subscribe(data.hello.world, 'testEvent', "nonFunction");
        }, "Invalid event handler raises error.");
        raises(function () {
            event.subscribe(data.hello.world.center, 'testEvent', testHandler);
        }, "Invalid datastore node raises error.");

        event.subscribe(data.hello.world, 'testEvent', testHandler);
        event.subscribe(data.hello, 'otherEvent', testHandler);
        equal(data.hello.world[live.META].handlers.testEvent[0], testHandler, "Event handler added");
        equal(data.hello[live.META].handlers.otherEvent[0], testHandler, "Other event handler added");

        event.unsubscribe(data.hello.world, 'testEvent', testHandler);
        equal(data.hello.world[live.META].handlers.testEvent.length, 0, "Event handler removed");

        event.unsubscribe(data.hello.world, 'testEvent');
        equal(data.hello.world[live.META].handlers.hasOwnProperty('testEvent'), false, "Event handlers removed for given event");

        event.unsubscribe(data.hello.world);
        equal(data.hello.world[live.META].hasOwnProperty('handlers'), false, "All event handlers removed from node");
    });

    test("Triggering", function () {
        var i, j;
        function testHandler() { i++; }
        function otherHandler() { j++; }

        event.subscribe(data.hello.world, 'testEvent', testHandler);
        event.subscribe(data.hello, 'testEvent', otherHandler);
        event.subscribe(data.hello.world, 'otherEvent', otherHandler);

        i = j = 0;
        event.trigger(data.hello.world, 'otherEvent');
        equal(j, 1, "Event triggered");

        i = j = 0;
        event.trigger(data.hello.world, 'testEvent');
        equal(i, 1, "Event triggered on source node");
        equal(j, 1, "Event bubbled to parent");

        j = 0;
        event.unsubscribe(data.hello.world);
        event.trigger(data.hello.world, 'testEvent');
        equal(j, 1, "Event bubbled to parent from non-capturing node");

        raises(function () {
            event.trigger(data.hello.all, 'testEvent');
        }, "Triggering event on ordinal node raises error");
    });

    test("Setting", function () {
        var i, tmp;
        function onChange() { i++; }
        function onAdd() { i += 2; }

        event.subscribe(data, 'add', onAdd);
        event.subscribe(data, 'change', onChange);

        // testing data update
        i = 0;
        tmp = event.set(data, ['hello', 'world', 'center'], "blah");
        equal(tmp, data.hello.world, "Set returns parent of changed node");
        equal(i, 1, "Update triggers 'change' event");

        // testing data addition
        i = 0;
        event.set(data, ['hello', 'world', 'whatever'], "blah");
        equal(i, 2, "Addition triggers 'add' event");

        event.unsubscribe(data, 'add', onAdd);
        event.unsubscribe(data, 'change', onChange);
    });

    test("Unsetting", function () {
        var i, tmp;
        function onRemove() { i++; }

        event.subscribe(data, 'remove', onRemove);

        i = 0;
        tmp = event.unset(data, ['hello', 'world', 'center']);
        equal(tmp, data.hello.world, "Unset returns parent of removed node");
        equal(i, 1, "Unsetting triggers 'remove' event");

        event.unset(data, ['hello', 'world', 'center']);
        equal(i, 1, "Unsetting non-existing path doesn't trigger event");
    });
}(flock.live,
    flock.event));
