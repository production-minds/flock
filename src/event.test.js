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

        event = $event(root);

    test("Subscription", function () {
        function testHandler() {
        }

        event.subscribe('hello.world', 'testEvent', testHandler);
        event.subscribe('hello', 'otherEvent', testHandler);
        equal(event.lookup()['hello.world']['testEvent'][0], testHandler, "Event handler added");
        equal(event.lookup()['hello']['otherEvent'][0], testHandler, "Other event handler added");

        event.unsubscribe('hello.world', 'testEvent', testHandler);
        equal(event.lookup()['hello.world']['testEvent'].length, 0, "Event handler removed");

        event.unsubscribe('hello.world', 'testEvent');
        equal(event.lookup()['hello.world'].hasOwnProperty('testEvent'), false, "Event handlers removed for given event");

        event.unsubscribe('hello.world');
        equal(event.lookup().hasOwnProperty('hello.world'), false, "All event handlers removed from node");
    });

    test("Triggering", function () {
        var i = 0, j = 0, k = 0,
            eventData = "eventData";

        function testHandler() {
            i++;
        }

        function otherHandler() {
            j++;
        }

        function topHandler() {
            k++;
        }

        function stopHandler() {
            i++;
            return false;
        }

        event.subscribe('hello.world', 'testEvent', testHandler);
        event.subscribe('hello', 'testEvent', otherHandler);
        event.subscribe('', 'testEvent', topHandler);
        event.subscribe('hello.world', 'otherEvent', otherHandler);
        event.subscribe('hello.world', 'argTesterEvent', function (event, data) {
            equal(event.name, 'argTesterEvent', "Event name passed to handler checks out");
            deepEqual(event.target, 'hello.world', "Event target passed to handler checks out");
            equal(data, eventData, "Custom event data passed to handler checks out");
            return false;
        });

        // checking arguments passed to event handler
        event.trigger('hello.world', 'argTesterEvent', {data: eventData});

        i = j = 0;
        event.trigger('hello.world', 'otherEvent');
        equal(j, 1, "Event triggered on single subscribed node");

        i = j = k = 0;
        event.trigger('hello.world', 'testEvent');
        equal(i, 1, "Event triggered on source node (source and parent both have handlers)");
        equal(j, 1, "> Event bubbled to parent");
        equal(k, 1, "> Event bubbled to root");

        j = 0;
        event.unsubscribe('hello.world');
        event.trigger('hello.world', 'testEvent');
        equal(j, 1, "Event bubbled to parent from non-capturing node");

        i = j = 0;
        event.subscribe('hello.world', 'testEvent', stopHandler);
        event.trigger('hello.world', 'testEvent');
        equal(i, 1, "Event triggered on source node with handler that returns false");
        equal(j, 0, "> Event didn't bubble bubble to parent");

        // one-time events
        i = 0;
        event.unsubscribe('hello.world');
        event.once('hello.world', 'testEvent', testHandler);
        event.trigger('hello.world', 'testEvent');
        equal(i, 1, "One-time event triggered handler");
        event.trigger('hello.world', 'testEvent');
        equal(i, 1, "Handler triggered no more upon one-time event");
    });

    test("Delegation", function () {
        var i;

        function testHandler() {
            i++;
        }

        i = 0;
        event.delegate('', 'testEvent', ['hello', 'world'], testHandler);
        event.trigger('hello.world', 'testEvent');

        equal(i, 1, "Delegated event fired when triggered on right path");
        event.trigger('hello', 'testEvent');
        equal(i, 1, "Delegated event did not fire when triggered on wrong path");

        // path patterns
        i = 0;
        event.unsubscribe('', 'testEvent');
        event.delegate('', 'otherEvent', ['*', 'world'], testHandler);
        event.trigger('hello.world', 'otherEvent');
        equal(i, 1, "Pattern delegated event fired on matching node");
        event.trigger('bybye.world', 'otherEvent');
        equal(i, 2, "Pattern delegated event fired on other matching node");
    });

    test("Getting", function () {
        event.subscribe('', 'access', function (event, data) {
            equal(event.name, 'access', "Event name (access) ok.");
            equal(event.target, 'hello.world.center', "Event target ok.");
            equal(data.value, '!!', "Value ok");
            equal(data.data, 'test', "Custom data ok.");
        });

        event.get('hello.world.center', {data: 'test'});

        event.unsubscribe('', 'access');

        event.subscribe('', 'access', function (event, data) {
            equal(typeof data.value, 'undefined', "Value ok on non-existing node");
        });

        event.get('hello.world.blahblah');

        event.unsubscribe('', 'access');
    });

    test("Access", function () {
        event.subscribe('hello.world.center', 'access', function (event, data) {
            var handler = data.data;

            handler(event.target, data.value);
            return false;
        });

        event.get('hello.world.center', function (path, value) {
            equal(path, 'hello.world.center', "Path is ok.");
            equal(value, '!!', "Value is ok.");
        });

        event.unsubscribe('hello.world.center', 'access');
    });

    /**
     * Exemplifies loading data on demand and returning with it.
     */
    test("On demand loading", function () {
        /**
         * Pretends to load data associated with a cache path.
         * @param path {string} Cache path.
         * @param handler {function} Loader handler.
         */
        function mockLoader(path, handler) {
            handler(path, 'blah');
        }

        // subscribing to access event
        event.subscribe('hello.world', 'access', function (event, data) {
            var handler = data.data;

            if (typeof data.value === 'undefined') {
                // loading data if value is empty
                mockLoader(event.target, function (path, value) {
                    handler(event.target, value);
                });
            } else {
                handler(event.target, data.value);
            }

            // preventing further event propagation
            return false;
        });

        // getting existing node
        event.get('hello.world.center', function (path, value) {
            equal(value, '!!', "Data node accessed at existing node");
        });

        // attempting to load data from non-existing node
        event.get('hello.world.blahblah', function (path, value) {
            equal(value, 'blah', "Data node loaded and accessed on previously missing node");
        });

        event.unsubscribe('hello.world', 'access');
    });

    test("Setting", function () {
        // checking handler arguments
        event.subscribe('', 'change', function (event, data) {
            equal(event.name, 'change', "Event name ok.");
            equal(event.target, 'hello.world.center', "Event target ok");
            equal(data.before, "!!", "Before value ok");
            equal(data.after, "!!!", "After value ok");
            equal(data.name, 'center', "Node name ok");
            equal(data.data, "customData", "Custom data ok");
        });
        event.set(['hello', 'world', 'center'], "!!!", {data: "customData"});
        event.unsubscribe('', 'change');

        var i;

        function onChange() {
            i++;
        }

        function onAdd() {
            i += 2;
        }

        event.subscribe('', 'add', onAdd);
        event.subscribe('', 'change', onChange);

        // testing data update
        i = 0;
        event.set(['hello', 'world', 'center'], {data: "blah"});
        equal(i, 1, "Update triggers 'change' event");

        i = 0;
        event.set(['hello', 'world', 'center'], "boo", {data: {foo: "bar"}});

        i = 0;
        event.set(['hello', 'world', 'center'], "boo", {trigger: false});
        equal(i, 0, "Non-triggering call to event.set()");

        // testing data addition
        i = 0;
        event.set(['hello', 'world', 'whatever'], "blah");
        equal(i, 2, "Addition triggers 'add' event");

        event.unsubscribe('', 'add', onAdd);
        event.unsubscribe('', 'change', onChange);
    });

    test("Unsetting", function () {
        var i;

        function onRemove() {
            i++;
        }

        event.subscribe('', 'remove', onRemove);

        i = 0;
        root.hello.world.center = "a";
        event.unset(['hello', 'world', 'center']);
        equal(i, 1, "Unsetting triggers 'remove' event");

        root.hello.world.center = "a";
        event.unset(['hello', 'world', 'center'], {trigger: false});
        equal(i, 1, "Non-triggering call to event.unset()");

        event.unset(['hello', 'world', 'center']);
        equal(i, 1, "Unsetting non-existing path doesn't trigger event");
    });
}(flock.event));
