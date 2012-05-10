////////////////////////////////////////////////////////////////////////////////
// Radiant
////////////////////////////////////////////////////////////////////////////////
/*global jOB, jOrder, flock */

// registering benchmarks on document ready
(function (jOB) {
    var json = jOrder.testing.json1000,
        ds, table,
        suffixSet = ['name'],
        suffixGet = ['.', 'name'],
        i;

    function setName(name) {
        ds.set(name.split('').concat(suffixSet), name);
    }
    function getName(name) {
        return ds.traverse(name.split('').concat(suffixGet), null, true).node();
    }

    function buildCache() {
        if (ds) {
            ds.clear();
        } else {
            ds = flock({}, {nolive: true});
        }
        for (i = 0; i < json.length; i++) {
            setName(json[i].name.replace(/\./g, ''));
        }
        return [{length: i}];
    }
    function buildJOrder() {
        table = jOrder([])
            .index('name', ['name'], {type: jOrder.string, ordered: true, grouped: true});
        for (i = 0; i < json.length; i++) {
            table.insert([{name: json[i].name.replace(/\./g, '')}]);
        }
        return [{length: i}];
    }

    buildCache();
    buildJOrder();

    jOB.benchmark("Querying in cache", ".getName()", ".traverse()");

    jOB.test("single node", function () {
        return [{result: ds.get('C.o.n')}];
    }, function () {
        return [{result: ds.traverse('C.o.n').node()}];
    });

    jOB.test("multiple nodes", function () {
        var root = ds.get('C.o.n'),
            i, result = [];
        for (i in root) {
            if (root.hasOwnProperty(i)) {
                result.push(root[i]);
            }
        }
        return result;
    }, function () {
        return ds.traverse('C.o.n.*').node();
    });

    (function () {
        jOB.benchmark("String search", "Cache", "jOrder");

        jOrder.logging = false;

        jOB.test("DB initialization", function () {
            flock(json);
        }, function () {
            jOrder(json);
        });

        jOB.test("Building index", buildCache, buildJOrder);

        jOB.test("Querying 'Con'", function () {
            return getName("Con");
        }, function () {
            return table.where([{name: "Con"}], {renumber: true, mode: jOrder.startof});
        });

        jOB.test("Stacked search ('Con', 'Cons', then 'Const')",
        function stacked_flock() {
            var stage;
            stage = ds.get('C.o.n');
            stage.traverse('...name', {loopback: true}).node();
            stage = stage.get('s');
            stage.traverse('...name', {loopback: true}).node();
            stage = stage.get('t');
            return stage.traverse('...name', {loopback: true}).node();
        }, function stacked_jOrder() {
            var hits;
            hits = table.where([{name: 'Con'}], {renumber: true, mode: jOrder.startof});
            hits = jOrder(hits)
                .index('name', ['name'], {type: jOrder.string, ordered: true, grouped: true})
                .where([{name: 'Cons'}], {renumber: true, mode: jOrder.startof});
            hits = jOrder(hits)
                .index('name', ['name'], {type: jOrder.string, ordered: true, grouped: true})
                .where([{name: 'Const'}], {renumber: true, mode: jOrder.startof});
            return hits;
        });
    }());
}(jOB));
