/*global flock, module, test, ok, equal, notEqual, notStrictEqual, deepEqual, raises */
(function (Path) {
    module("Path");

    test("Normalization", function () {
        raises(function () {
            Path.normalize('...fds.fd');
        }, "Validation fails on leading dots");

        raises(function () {
            Path.normalize('fds.fd..');
        }, "Validation fails on trailing dots");

        raises(function () {
            Path.normalize(1000);
        }, "Validation fails on invalid argument type");

        deepEqual(
            Path.normalize(''),
            [],
            "Trivial path"
        );

        deepEqual(
            Path.normalize('first.second.thi rd'),
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
        notStrictEqual(Path.normalize(arrNotation), arrNotation, "Array input returns copy");
        deepEqual(Path.normalize(arrNotation), arrNotation, "Array copy is identical to original");
    });
        
    test("Pattern matching", function () {
        // matching
        equal(Path.match(['hello', 'world'], ['hello', 'world']), true, "Path matches pattern");
        equal(Path.match(['hello'], ['hello', 'world']), false, "Path doesn't match pattern");
        equal(Path.match('hello.world', 'hello.world'), true, "Path (string notation) matches pattern");
    });
}(flock.Path));
