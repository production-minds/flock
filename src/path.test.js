/*global flock, module, test, ok, equal, notEqual, deepEqual, raises */
(function ($path) {
    module("Path");

    test("Normalization", function () {
        raises(function () {
            $path.normalize('...fds.fd');
        }, "Validation fails on leading dots");

        raises(function () {
            $path.normalize('fds.fd..');
        }, "Validation fails on trailing dots");

        raises(function () {
            $path.normalize(1000);
        }, "Validation fails on invalid argument type");

        deepEqual(
            $path.normalize(''),
            [],
            "Trivial path"
        );

        deepEqual(
            $path.normalize('first.second.thi rd'),
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
        notEqual($path.normalize(arrNotation), arrNotation, "Array input returns copy");
        deepEqual($path.normalize(arrNotation), arrNotation, "Array copy is identical to original");
    });

    test("Pattern matching", function () {
        // matching
        equal($path.match(['hello', 'world'], ['hello', 'world']), true, "Path matches pattern");
        equal($path.match(['hello'], ['hello', 'world']), false, "Path doesn't match pattern");
        equal($path.match('hello.world', 'hello.world'), true, "Path (string notation) matches pattern");
    });

    test("Common root", function () {
        deepEqual(
            $path.common(
                'hello.world.1.test.case',
                'hello.world.3.test'
            ),
            ['hello', 'world'],
            "Common root of paths of different lengths and content"
        );

        deepEqual(
            $path.common(
                'hello.world.1.test.case',
                'hello.world.1.test'
            ),
            ['hello', 'world', '1', 'test'],
            "Common root of paths where one contains other"
        );

        deepEqual(
            $path.common(
                'hAllo.world.1.test.case',
                'hEllo.world.1.test'
            ),
            [],
            "Common root of completely different paths"
        );
    });
}(flock.path));
