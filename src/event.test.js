/*global flock, module, test, ok, equal, deepEqual */
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

        event.subscribe(data, ['hello', 'world'], 'testEvent', testHandler);
        event.subscribe(data, ['hello'], 'otherEvent', testHandler);
        equal(data.hello.world[live.META].handlers.testEvent[0], testHandler, "Event handler added");
        equal(data.hello[live.META].handlers.otherEvent[0], testHandler, "Other event handler added");

        event.unsubscribe(data, ['hello', 'world'], 'testEvent', testHandler);
        equal(data.hello.world[live.META].handlers.testEvent.length, 0, "Event handler removed");

        event.unsubscribe(data, ['hello', 'world'], 'testEvent');
        equal(data.hello.world[live.META].handlers.hasOwnProperty('testEvent'), false, "Event handlers removed for given event");

        event.unsubscribe(data, ['hello', 'world']);
        equal(data.hello.world[live.META].hasOwnProperty('handlers'), false, "All event handlers removed from node");
    });

    test("Triggering", function () {
        var i, j;
        function testHandler() { i++; }
        function otherHandler() { j++; }

        event.subscribe(data, ['hello', 'world'], 'testEvent', testHandler);
        event.subscribe(data, ['hello'], 'testEvent', otherHandler);
        event.subscribe(data, ['hello', 'world'], 'otherEvent', otherHandler);

        i = j = 0;
        event.trigger(data, ['hello', 'world'], 'otherEvent');
        equal(j, 1, "Event triggered");

        i = j = 0;
        event.trigger(data, ['hello', 'world'], 'testEvent');
        equal(i, 1, "Event triggered on source node");
        equal(j, 1, "Event bubbled to parent");

        i = j = 0;
        event.trigger(data, ['hello', 'all'], 'testEvent');
        ok((i === 0) && (j === 0), "Triggering event on unsubscribed path doesn't trigger event");
    });
}(flock.live,
    flock.event));
