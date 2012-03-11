/*global flock, module, test, ok, equal, deepEqual, raises */
(function (live, event) {
    module("Event");

    var json = {
        hi: 'There!',
        hello: {
            world: {
                center: "!!"
            },
            all: "hey"
        }
    };

    live.init(json);

    test("Subscription", function () {
        function testHandler() { }

        raises(function () {
            event.subscribe(json.hello.world, 'testEvent', "nonFunction");
        }, "Invalid event handler raises error.");
        raises(function () {
            event.subscribe(json.hello.world.center, 'testEvent', testHandler);
        }, "Invalid datastore node raises error.");

        event.subscribe(json.hello.world, 'testEvent', testHandler);
        event.subscribe(json.hello, 'otherEvent', testHandler);
        equal(json.hello.world[live.metaKey()].handlers.testEvent[0], testHandler, "Event handler added");
        equal(json.hello[live.metaKey()].handlers.otherEvent[0], testHandler, "Other event handler added");

        event.unsubscribe(json.hello.world, 'testEvent', testHandler);
        equal(json.hello.world[live.metaKey()].handlers.testEvent.length, 0, "Event handler removed");

        event.unsubscribe(json.hello.world, 'testEvent');
        equal(json.hello.world[live.metaKey()].handlers.hasOwnProperty('testEvent'), false, "Event handlers removed for given event");

        event.unsubscribe(json.hello.world);
        equal(json.hello.world[live.metaKey()].hasOwnProperty('handlers'), false, "All event handlers removed from node");
    });

    test("Triggering", function () {
        var i, j,
            eventData = "eventData";
        function testHandler() { i++; }
        function otherHandler() { j++; }
        function stopHandler() { i++; return false; }

        event.subscribe(json.hello.world, 'testEvent', testHandler);
        event.subscribe(json.hello, 'testEvent', otherHandler);
        event.subscribe(json.hello.world, 'otherEvent', otherHandler);
        event.subscribe(json.hello.world, 'argTesterEvent', function (event, data) {
            equal(event.name, 'argTesterEvent', "Event name passed to handler checks out");
            deepEqual(live.path(event.target), ['hello', 'world'], "Event target passed to handler checks out");
            equal(data, eventData, "Custom event data passed to handler checks out");
            return false;
        });

        // checking arguments passed to event handler
        event.trigger(json.hello.world, 'argTesterEvent', eventData);

        i = j = 0;
        event.trigger(json.hello.world, 'otherEvent');
        equal(j, 1, "Event triggered on single subscribed node");

        i = j = 0;
        event.trigger(json.hello.world, 'testEvent');
        equal(i, 1, "Event triggered on source node (source and parent both have handlers)");
        equal(j, 1, "> Event bubbled to parent");

        j = 0;
        event.unsubscribe(json.hello.world);
        event.trigger(json.hello.world, 'testEvent');
        equal(j, 1, "Event bubbled to parent from non-capturing node");

        i = j = 0;
        event.subscribe(json.hello.world, 'testEvent', stopHandler);
        event.trigger(json.hello.world, 'testEvent');
        equal(i, 1, "Event triggered on source node with handler that returns false");
        equal(j, 0, "> Event didn't bubble bubble to parent");

        raises(function () {
            event.trigger(json.hello.all, 'testEvent');
        }, "Triggering event on ordinal node raises error");
    });

    test("Setting", function () {
        // checking handler arguments
        event.subscribe(json, 'change', function (event, data) {
            equal(event.name, 'change', "Event name ok.");
            deepEqual(live.path(event.target), ['hello', 'world'], "Event target ok");
            deepEqual(data.before, "!!", "Before value ok");
            deepEqual(data.after, "!!!", "After value ok");
            deepEqual(data.name, 'center', "Node name ok");
            equal(data.data, "customData", "Custom data ok");
        });
        event.set(json, ['hello', 'world', 'center'], "!!!", "customData");
        event.unsubscribe(json, 'change');

        var i, tmp;
        function onChange() { i++; }
        function onAdd() { i += 2; }
        event.subscribe(json, 'add', onAdd);
        event.subscribe(json, 'change', onChange);

        // testing data update
        i = 0;
        tmp = event.set(json, ['hello', 'world', 'center'], "blah");
        equal(tmp, json.hello.world, "Set returns parent of changed node");
        equal(i, 1, "Update triggers 'change' event");

        i = 0;
        event.set(json, ['hello', 'world', 'center'], "boo", {foo: "bar"});

        i = 0;
        event.set(json, ['hello', 'world', 'center'], "boo", null, false);
        equal(i, 0, "Non-triggering call to event.set()");

        // testing data addition
        i = 0;
        event.set(json, ['hello', 'world', 'whatever'], "blah");
        equal(i, 2, "Addition triggers 'add' event");

        event.unsubscribe(json, 'add', onAdd);
        event.unsubscribe(json, 'change', onChange);


    });

    test("Unsetting", function () {
        var i, tmp;
        function onRemove() { i++; }

        event.subscribe(json, 'remove', onRemove);

        i = 0;
        json.hello.world.center = "a";
        tmp = event.unset(json, ['hello', 'world', 'center']);
        equal(tmp, json.hello.world, "Unset returns parent of removed node");
        equal(i, 1, "Unsetting triggers 'remove' event");

        json.hello.world.center = "a";
        event.unset(json, ['hello', 'world', 'center'], false);
        equal(i, 1, "Non-triggering call to event.unset()");

        event.unset(json, ['hello', 'world', 'center']);
        equal(i, 1, "Unsetting non-existing path doesn't trigger event");
    });
}(flock.live,
    flock.event));
