/*global flock, module, test, ok, equal, notEqual, deepEqual, raises */
(function (u_path) {
    module("Path");

    test("Ignored key", function () {
        var tmp = u_path.ignoredKey();
        u_path.ignoredKey('foo');
        equal(u_path.ignoredKey(), 'foo', "Ignored key set");
        u_path.clearIgnoredKey();
        equal(typeof u_path.ignoredKey(), 'undefined', "Ignored key cleared");

        // restoring original state
        u_path.ignoredKey(tmp);
    });

    test("Normalization", function () {
        raises(function () {
            u_path.normalize('...fds.fd');
        }, "Validation fails on leading dots");

        raises(function () {
            u_path.normalize('fds.fd..');
        }, "Validation fails on trailing dots");

        raises(function () {
            u_path.normalize(1000);
        }, "Validation fails on invalid argument type");

        deepEqual(
            u_path.normalize('first.second.thi rd'),
            [
                'first',
                'second',
                'thi rd'
            ],
            "String path converted to array notation"
        );

        var arrNotation = [
            'first',
            'second',
            'thi rd'
        ];
        notEqual(u_path.normalize(arrNotation), arrNotation, "Array input returns copy");
        deepEqual(u_path.normalize(arrNotation), arrNotation, "Array copy is identical to original");
    });
        
    test("Pattern matching", function () {
        // matching
        equal(u_path.match(['hello', 'world'], ['hello', 'world']), true, "Path matches pattern");
        equal(u_path.match(['hello'], ['hello', 'world']), false, "Path doesn't match pattern");
        equal(u_path.match('hello.world', 'hello.world'), true, "Path (string notation) matches pattern");
    });
}(flock.path));
