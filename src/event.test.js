/*global flock, module, test, ok, equal, deepEqual, raises */
(function ($event) {
    module("Event");

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

        // mock datastore object
        mock = {root: function () {return root;}};

    test("Subscription", function () {
        function testHandler() { }

        $event.subscribe.call(mock, 'hello.world', 'testEvent', testHandler);
        $event.subscribe.call(mock, 'hello', 'otherEvent', testHandler);
        equal(mock.eventLookup['hello.world']['testEvent'][0], testHandler, "Event handler added");
        equal(mock.eventLookup['hello']['otherEvent'][0], testHandler, "Other event handler added");

        $event.unsubscribe.call(mock, 'hello.world', 'testEvent', testHandler);
        equal(mock.eventLookup['hello.world']['testEvent'].length, 0, "Event handler removed");

        $event.unsubscribe.call(mock, 'hello.world', 'testEvent');
        equal(mock.eventLookup['hello.world'].hasOwnProperty('testEvent'), false, "Event handlers removed for given event");

        $event.unsubscribe.call(mock, 'hello.world');
        equal(mock.eventLookup.hasOwnProperty('hello.world'), false, "All event handlers removed from node");
    });

    test("Triggering", function () {
        var i = 0, j = 0, k = 0,
            eventData = "eventData";

        function testHandler() { i++; }

        function otherHandler() { j++; }

        function topHandler() { k++; }

        function stopHandler() {
            i++;
            return false;
        }

        $event.subscribe.call(mock, 'hello.world', 'testEvent', testHandler);
        $event.subscribe.call(mock, 'hello', 'testEvent', otherHandler);
        $event.subscribe.call(mock, '', 'testEvent', topHandler);
        $event.subscribe.call(mock, 'hello.world', 'otherEvent', otherHandler);
        $event.subscribe.call(mock, 'hello.world', 'argTesterEvent', function (event, data) {
            equal(event.name, 'argTesterEvent', "Event name passed to handler checks out");
            deepEqual(event.target, 'hello.world', "Event target passed to handler checks out");
            equal(data, eventData, "Custom event data passed to handler checks out");
            return false;
        });

        // checking arguments passed to event handler
        $event.trigger.call(mock, 'hello.world', 'argTesterEvent', {data: eventData});

        i = j = 0;
        $event.trigger.call(mock, 'hello.world', 'otherEvent');
        equal(j, 1, "Event triggered on single subscribed node");

        i = j = k = 0;
        $event.trigger.call(mock, 'hello.world', 'testEvent');
        equal(i, 1, "Event triggered on source node (source and parent both have handlers)");
        equal(j, 1, "> Event bubbled to parent");
        equal(k, 1, "> Event bubbled to root");

        j = 0;
        $event.unsubscribe.call(mock, 'hello.world');
        $event.trigger.call(mock, 'hello.world', 'testEvent');
        equal(j, 1, "Event bubbled to parent from non-capturing node");

        i = j = 0;
        $event.subscribe.call(mock, 'hello.world', 'testEvent', stopHandler);
        $event.trigger.call(mock, 'hello.world', 'testEvent');
        equal(i, 1, "Event triggered on source node with handler that returns false");
        equal(j, 0, "> Event didn't bubble bubble to parent");

        // one-time events
        i = 0;
        $event.unsubscribe.call(mock, 'hello.world');
        $event.once.call(mock, 'hello.world', 'testEvent', testHandler);
        $event.trigger.call(mock, 'hello.world', 'testEvent');
        equal(i, 1, "One-time event triggered handler");
        $event.trigger.call(mock, 'hello.world', 'testEvent');
        equal(i, 1, "Handler triggered no more upon one-time event");
    });

    test("Delegation", function () {
        var i;

        function testHandler() { i++; }

        i = 0;
        $event.delegate.call(mock, '', 'testEvent', ['hello', 'world'], testHandler);
        $event.trigger.call(mock, 'hello.world', 'testEvent');

        equal(i, 1, "Delegated event fired when triggered on right path");
        $event.trigger.call(mock, 'hello', 'testEvent');
        equal(i, 1, "Delegated event did not fire when triggered on wrong path");

        // path patterns
        i = 0;
        $event.unsubscribe.call(mock, '', 'testEvent');
        $event.delegate.call(mock, '', 'otherEvent', ['*', 'world'], testHandler);
        $event.trigger.call(mock, 'hello.world', 'otherEvent');
        equal(i, 1, "Pattern delegated event fired on matching node");
        $event.trigger.call(mock, 'bybye.world', 'otherEvent');
        equal(i, 2, "Pattern delegated event fired on other matching node");
    });

    test("Setting", function () {
        // checking handler arguments
        $event.subscribe.call(mock, '', 'change', function (event, data) {
            equal(event.name, 'change', "Event name ok.");
            deepEqual(event.target, 'hello.world.center', "Event target ok");
            deepEqual(data.before, "!!", "Before value ok");
            deepEqual(data.after, "!!!", "After value ok");
            deepEqual(data.name, 'center', "Node name ok");
            equal(data.data, "customData", "Custom data ok");
        });
        $event.set.call(mock, ['hello', 'world', 'center'], "!!!", {data: "customData"});
        $event.unsubscribe.call(mock, '', 'change');

        var i;

        function onChange() { i++; }

        function onAdd() { i += 2; }

        $event.subscribe.call(mock, '', 'add', onAdd);
        $event.subscribe.call(mock, '', 'change', onChange);

        // testing data update
        i = 0;
        $event.set.call(mock, ['hello', 'world', 'center'], {data: "blah"});
        equal(i, 1, "Update triggers 'change' event");

        i = 0;
        $event.set.call(mock, ['hello', 'world', 'center'], "boo", {data: {foo: "bar"}});

        i = 0;
        $event.set.call(mock, ['hello', 'world', 'center'], "boo", {trigger: false});
        equal(i, 0, "Non-triggering call to $event.set.call(mock, )");

        // testing data addition
        i = 0;
        $event.set.call(mock, ['hello', 'world', 'whatever'], "blah");
        equal(i, 2, "Addition triggers 'add' event");

        $event.unsubscribe.call(mock, '', 'add', onAdd);
        $event.unsubscribe.call(mock, '', 'change', onChange);
    });

    test("Unsetting", function () {
        var i;

        function onRemove() { i++; }

        $event.subscribe.call(mock, '', 'remove', onRemove);

        i = 0;
        root.hello.world.center = "a";
        $event.unset.call(mock, ['hello', 'world', 'center']);
        equal(i, 1, "Unsetting triggers 'remove' event");

        root.hello.world.center = "a";
        $event.unset.call(mock, ['hello', 'world', 'center'], {trigger: false});
        equal(i, 1, "Non-triggering call to $event.unset.call(mock, )");

        $event.unset.call(mock, ['hello', 'world', 'center']);
        equal(i, 1, "Unsetting non-existing path doesn't trigger event");
    });
}(flock.event));
