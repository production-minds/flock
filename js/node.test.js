/*global flock, module, test, ok, equal, deepEqual, raises */
(function ($node) {
    module("Node");

    function node(root) {
        return $node.create(root);
    }

    test("Testing", function () {
        equal(node().isEmpty(), true, "Undefined tested for empty");
        equal(node(null).isEmpty(), true, "Null tested for empty");
        equal(node(0).isEmpty(), true, "Number tested for empty");
        equal(node("hello").isEmpty(), false, "String fails for empty");

        equal(node({}).isEmpty(), true, "Empty object tested for empty");
        equal(node({foo: "bar"}).isEmpty(), false, "Non-empty object tested for empty");

        equal(node({}).isSingle(), false, "Empty object tested for single");
        equal(node({foo: "bar"}).isSingle(), true, "Single-property object tested for single");
        equal(node({foo: "bar", what: "eva"}).isSingle(), false, "Multi-property object tested for single");

        equal(node(0).isNull(), false, "Number is not null");
        equal(node(null).isNull(), true, "Null is null");
        equal(node(0).isUndefined(), false, "Number is not undefined");
        equal(node(undefined).isUndefined(), true, "Undefined is not undefined");
        equal(node(null).isOrdinal(), false, "Null is not ordinal");
        equal(node(undefined).isOrdinal(), false, "Undefined is not ordinal");
        equal(node(0).isOrdinal(), true, "Number is ordinal");
        equal(node("hello").isOrdinal(), true, "String is ordinal");
        equal(node(true).isOrdinal(), true, "Boolean is ordinal");

        equal(node(0).isNode(), false, "Number is not node");
        equal(node("hello").isNode(), false, "String is not node");
        equal(node(null).isNode(), false, "Null is not node");
        equal(node(undefined).isNode(), false, "Undefined is not node");
        equal(node({}).isNode(), true, "Object is node");
    });

    test("Keys & Values", function () {
        equal(node({foo: "bar"}).firstKey(), 'foo', "First property of an object");
        ok(typeof node({}).firstKey() === 'undefined', "First property of an empty object");

        deepEqual(node({foo: "bar", hello: "world"}).keys(), ['foo', 'hello'], "Key extraction");
        deepEqual(node({foo: "bar", hello: "world"}).values(), ['bar', 'world'], "Value extraction");
    });
}(
    flock.node
));
