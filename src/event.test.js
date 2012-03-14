/*global flock, module, test, ok, equal, deepEqual, raises */
(function (u_live, u_event) {
    module("Event");

    var json = {
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
    };

    u_live.init(json);

    test("Subscription", function () {
        function testHandler() { }

        raises(function () {
            u_event.subscribe(json.hello.world, 'testEvent', "nonFunction");
        }, "Invalid event handler raises error.");
        raises(function () {
            u_event.subscribe(json.hello.world.center, 'testEvent', testHandler);
        }, "Invalid datastore node raises error.");

        u_event.subscribe(json.hello.world, 'testEvent', testHandler);
        u_event.subscribe(json.hello, 'otherEvent', testHandler);
        equal(json.hello.world[u_live.metaKey()].handlers.testEvent[0], testHandler, "Event handler added");
        equal(json.hello[u_live.metaKey()].handlers.otherEvent[0], testHandler, "Other event handler added");

        u_event.unsubscribe(json.hello.world, 'testEvent', testHandler);
        equal(json.hello.world[u_live.metaKey()].handlers.testEvent.length, 0, "Event handler removed");

        u_event.unsubscribe(json.hello.world, 'testEvent');
        equal(json.hello.world[u_live.metaKey()].handlers.hasOwnProperty('testEvent'), false, "Event handlers removed for given event");

        u_event.unsubscribe(json.hello.world);
        equal(json.hello.world[u_live.metaKey()].hasOwnProperty('handlers'), false, "All event handlers removed from node");
    });

    test("Triggering", function () {
        var i, j,
            eventData = "eventData";
        function testHandler() { i++; }
        function otherHandler() { j++; }
        function stopHandler() { i++; return false; }

        u_event.subscribe(json.hello.world, 'testEvent', testHandler);
        u_event.subscribe(json.hello, 'testEvent', otherHandler);
        u_event.subscribe(json.hello.world, 'otherEvent', otherHandler);
        u_event.subscribe(json.hello.world, 'argTesterEvent', function (event, data) {
            equal(event.name, 'argTesterEvent', "Event name passed to handler checks out");
            deepEqual(u_live.path(event.target), ['hello', 'world'], "Event target passed to handler checks out");
            equal(data, eventData, "Custom event data passed to handler checks out");
            return false;
        });

        // checking arguments passed to event handler
        u_event.trigger(json.hello.world, 'argTesterEvent', {data: eventData});

        i = j = 0;
        u_event.trigger(json.hello.world, 'otherEvent');
        equal(j, 1, "Event triggered on single subscribed node");

        i = j = 0;
        u_event.trigger(json.hello.world, 'testEvent');
        equal(i, 1, "Event triggered on source node (source and parent both have handlers)");
        equal(j, 1, "> Event bubbled to parent");

        j = 0;
        u_event.unsubscribe(json.hello.world);
        u_event.trigger(json.hello.world, 'testEvent');
        equal(j, 1, "Event bubbled to parent from non-capturing node");

        i = j = 0;
        u_event.subscribe(json.hello.world, 'testEvent', stopHandler);
        u_event.trigger(json.hello.world, 'testEvent');
        equal(i, 1, "Event triggered on source node with handler that returns false");
        equal(j, 0, "> Event didn't bubble bubble to parent");

        raises(function () {
            u_event.trigger(json.hello.all, 'testEvent');
        }, "Triggering event on ordinal node raises error");

        // one-time events
        i = 0;
        u_event.unsubscribe(json.hello.world);
        u_event.once(json.hello.world, 'testEvent', testHandler);
        u_event.trigger(json.hello.world, 'testEvent');
        equal(i, 1, "One-time event triggered handler");
        u_event.trigger(json.hello.world, 'testEvent');
        equal(i, 1, "Handler triggered no more upon one-time event");
    });

    test("Delegation", function () {
        var i;
        function testHandler() { i++; }

        i = 0;
        u_event.delegate(json, ['hello', 'world'], 'testEvent', testHandler);
        u_event.trigger(json.hello.world, 'testEvent');
        equal(i, 1, "Delegated event fired when triggered on right path");
        u_event.trigger(json.hello, 'testEvent');
        equal(i, 1, "Delegated event did not fire when triggered on wrong path");

        // path patterns
        i = 0;
        u_event.unsubscribe(json, 'testEvent');
        u_event.delegate(json, ['*', 'world'], 'otherEvent', testHandler);
        u_event.trigger(json.hello.world, 'otherEvent');
        equal(i, 1, "Pattern delegated event fired on matching node");
        u_event.trigger(json.bybye.world, 'otherEvent');
        equal(i, 2, "Pattern delegated event fired on other matching node");
    });

    test("Setting", function () {
        // checking handler arguments
        u_event.subscribe(json, 'change', function (event, data) {
            equal(event.name, 'change', "Event name ok.");
            deepEqual(u_live.path(event.target), ['hello', 'world'], "Event target ok");
            deepEqual(data.before, "!!", "Before value ok");
            deepEqual(data.after, "!!!", "After value ok");
            deepEqual(data.name, 'center', "Node name ok");
            equal(data.data, "customData", "Custom data ok");
        });
        u_event.set(json, ['hello', 'world', 'center'], "!!!", {data: "customData"});
        u_event.unsubscribe(json, 'change');

        var i, tmp;
        function onChange() { i++; }
        function onAdd() { i += 2; }
        u_event.subscribe(json, 'add', onAdd);
        u_event.subscribe(json, 'change', onChange);

        // testing data update
        i = 0;
        tmp = u_event.set(json, ['hello', 'world', 'center'], {data: "blah"});
        equal(tmp, json.hello.world, "Set returns parent of changed node");
        equal(i, 1, "Update triggers 'change' event");

        i = 0;
        u_event.set(json, ['hello', 'world', 'center'], "boo", {data: {foo: "bar"}});

        i = 0;
        u_event.set(json, ['hello', 'world', 'center'], "boo", {trigger: false});
        equal(i, 0, "Non-triggering call to event.set()");

        // testing data addition
        i = 0;
        u_event.set(json, ['hello', 'world', 'whatever'], "blah");
        equal(i, 2, "Addition triggers 'add' event");

        u_event.unsubscribe(json, 'add', onAdd);
        u_event.unsubscribe(json, 'change', onChange);
    });

    test("Unsetting", function () {
        var i, tmp;
        function onRemove() { i++; }

        u_event.subscribe(json, 'remove', onRemove);

        i = 0;
        json.hello.world.center = "a";
        tmp = u_event.unset(json, ['hello', 'world', 'center']);
        equal(tmp.parent, json.hello.world, "Unset returns parent of removed node");
        equal(i, 1, "Unsetting triggers 'remove' event");

        json.hello.world.center = "a";
        u_event.unset(json, ['hello', 'world', 'center'], {trigger: false});
        equal(i, 1, "Non-triggering call to event.unset()");

        u_event.unset(json, ['hello', 'world', 'center']);
        equal(i, 1, "Unsetting non-existing path doesn't trigger event");
    });
}(flock.live,
    flock.event));
