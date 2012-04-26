/*global flock, module, test, ok, equal, deepEqual, raises */
(function ($evented, $single) {
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

        // creating evented datastore object explicitly from flock.single
        ds = $evented($single(root, {nochaining: true}));

    test("Subscription", function () {
        function testHandler() {
        }

        ds.on('hello.world', 'testEvent', testHandler);
        ds.on('hello', 'otherEvent', testHandler);
        equal(ds.lookup()['hello.world']['testEvent'][0], testHandler, "Event handler added");
        equal(ds.lookup()['hello']['otherEvent'][0], testHandler, "Other event handler added");

        ds.off('hello.world', 'testEvent', testHandler);
        equal(ds.lookup()['hello.world']['testEvent'].length, 0, "Event handler removed");

        ds.off('hello.world', 'testEvent');
        equal(ds.lookup()['hello.world'].hasOwnProperty('testEvent'), false, "Event handlers removed for given event");

        ds.off('hello.world');
        equal(ds.lookup().hasOwnProperty('hello.world'), false, "All event handlers removed from node");
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

        ds.on('hello.world', 'testEvent', testHandler);
        ds.on('hello', 'testEvent', otherHandler);
        ds.on('', 'testEvent', topHandler);
        ds.on('hello.world', 'otherEvent', otherHandler);
        ds.on('hello.world', 'argTesterEvent', function (event, data) {
            equal(event.name, 'argTesterEvent', "Event name passed to handler checks out");
            deepEqual(event.target, 'hello.world', "Event target passed to handler checks out");
            equal(data, eventData, "Custom event data passed to handler checks out");
            return false;
        });

        // checking arguments passed to event handler
        ds.trigger('hello.world', 'argTesterEvent', {data: eventData});

        i = j = 0;
        ds.trigger('hello.world', 'otherEvent');
        equal(j, 1, "Event triggered on single subscribed node");

        i = j = k = 0;
        ds.trigger('hello.world', 'testEvent');
        equal(i, 1, "Event triggered on source node (source and parent both have handlers)");
        equal(j, 1, "> Event bubbled to parent");
        equal(k, 1, "> Event bubbled to root");

        j = 0;
        ds.off('hello.world');
        ds.trigger('hello.world', 'testEvent');
        equal(j, 1, "Event bubbled to parent from non-capturing node");

        i = j = 0;
        ds.on('hello.world', 'testEvent', stopHandler);
        ds.trigger('hello.world', 'testEvent');
        equal(i, 1, "Event triggered on source node with handler that returns false");
        equal(j, 0, "> Event didn't bubble bubble to parent");

        // one-time events
        i = 0;
        ds.off('hello.world');
        ds.one('hello.world', 'testEvent', testHandler);
        ds.trigger('hello.world', 'testEvent');
        equal(i, 1, "One-time event triggered handler");
        ds.trigger('hello.world', 'testEvent');
        equal(i, 1, "Handler triggered no more upon one-time event");
    });

    test("Delegation", function () {
        var i;

        function testHandler() {
            i++;
        }

        i = 0;
        ds.delegate('', 'testEvent', ['hello', 'world'], testHandler);
        ds.trigger('hello.world', 'testEvent');

        equal(i, 1, "Delegated event fired when triggered on right path");
        ds.trigger('hello', 'testEvent');
        equal(i, 1, "Delegated event did not fire when triggered on wrong path");

        // path patterns
        i = 0;
        ds.off('', 'testEvent');
        ds.delegate('', 'otherEvent', ['*', 'world'], testHandler);
        ds.trigger('hello.world', 'otherEvent');
        equal(i, 1, "Pattern delegated event fired on matching node");
        ds.trigger('bybye.world', 'otherEvent');
        equal(i, 2, "Pattern delegated event fired on other matching node");
    });

    test("Getting", function () {
        ds.on('', flock.ACCESS, function (event, data) {
            equal(event.name, flock.ACCESS, "Event name (access) ok.");
            equal(event.target, 'hello.world.center', "Event target ok.");
            equal(data.value, '!!', "Value ok");
            equal(data.data, 'test', "Custom data ok.");
        });

        ds.get('hello.world.center', {data: 'test'});

        ds.off('', flock.ACCESS);

        ds.on('', flock.ACCESS, function (event, data) {
            equal(typeof data.value, 'undefined', "Value ok on non-existing node");
        });

        ds.get('hello.world.blahblah');

        ds.off('', flock.ACCESS);
    });

    test("Access", function () {
        ds.on('hello.world.center', flock.ACCESS, function (event, data) {
            var handler = data.data;

            handler(event.target, data.value);
            return false;
        });

        ds.get('hello.world.center', function (path, value) {
            equal(path, 'hello.world.center', "Path is ok.");
            equal(value, '!!', "Value is ok.");
        });

        ds.off('hello.world.center', flock.ACCESS);
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
        ds.on('hello.world', flock.ACCESS, function (event, data) {
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
        ds.get('hello.world.center', function (path, value) {
            equal(value, '!!', "Data node accessed at existing node");
        });

        // attempting to load data from non-existing node
        ds.get('hello.world.blahblah', function (path, value) {
            equal(value, 'blah', "Data node loaded and accessed on previously missing node");
        });

        ds.off('hello.world', flock.ACCESS);
    });

    test("Setting", function () {
        // checking handler arguments
        ds.on('', flock.CHANGE, function (event, data) {
            equal(event.name, flock.CHANGE, "Event name ok.");
            equal(event.target, 'hello.world.center', "Event target ok");
            equal(data.before, "!!", "Before value ok");
            equal(data.after, "!!!", "After value ok");
            equal(data.name, 'center', "Node name ok");
            equal(data.data, "customData", "Custom data ok");
        });
        ds.set(['hello', 'world', 'center'], "!!!", {data: "customData"});
        ds.off('', flock.CHANGE);

        var i;

        function onChange() {
            i++;
        }

        function onAdd() {
            i += 2;
        }

        ds.on('', flock.ADD, onAdd);
        ds.on('', flock.CHANGE, onChange);

        // testing data update
        i = 0;
        ds.set(['hello', 'world', 'center'], {data: "blah"});
        equal(i, 1, "Update triggers flock.CHANGE event");

        i = 0;
        ds.set(['hello', 'world', 'center'], "boo", {data: {foo: "bar"}});

        i = 0;
        ds.set(['hello', 'world', 'center'], "boo", {trigger: false});
        equal(i, 0, "Non-triggering call to event.set()");

        // testing data addition
        i = 0;
        ds.set(['hello', 'world', 'whatever'], "blah");
        equal(i, 2, "Addition triggers flock.ADD event");

        ds.off('', flock.ADD, onAdd);
        ds.off('', flock.CHANGE, onChange);
    });

    test("Unsetting", function () {
        var i;

        function onRemove() {
            i++;
        }

        ds.on('', flock.REMOVE, onRemove);

        i = 0;
        root.hello.world.center = "a";
        ds.unset(['hello', 'world', 'center']);
        equal(i, 1, "Unsetting triggers flock.REMOVE event");

        root.hello.world.center = "a";
        ds.unset(['hello', 'world', 'center'], {trigger: false});
        equal(i, 1, "Non-triggering call to event.unset()");

        ds.unset(['hello', 'world', 'center']);
        equal(i, 1, "Unsetting non-existing path doesn't trigger event");
    });
}(
    flock.evented,
    flock.single
));
