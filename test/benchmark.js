////////////////////////////////////////////////////////////////////////////////
// Radiant
////////////////////////////////////////////////////////////////////////////////
/*global jOB, jOrder, flock */

// registering benchmarks on document ready
(function (jOB) {
	var json = jOrder.testing.json1000,
			ds, table,
			suffix_set = ['name'],
			suffix_get = ['.', 'name'],
			i;
	
	function set(name) {
		ds.set(name.split('').concat(suffix_set), name);
	}
	function get(name) {
		return ds.multiget(name.split('').concat(suffix_get), null, true);
	}
	
	function buildCache() {
		ds = flock();
		for (i = 0; i < json.length; i++) {
			set(json[i].name.replace(/\./g, ''));
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

	jOB.benchmark("Querying in cache", ".get()", ".multiget()");

	jOB.test("single node", function () {
		return [{result: ds.get('C.o.n')}];
	}, function () {
		return [{result: ds.multiget('C.o.n')}];
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
		return ds.multiget('C.o.n.*');
	});
	
	(function () {
		jOB.benchmark("Tree traversal", "Recursive", "Iterative");
		
		jOrder.core.MAX_DEPTH = 100;
		
		var orig = ds.root(),
				root = jOrder.deep(orig);
		
		jOB.test("", function test_rec() {
			var result = [],
					key;
				
			(function walk(obj, depth) {
				if (typeof obj === 'object') {
					for (key in obj) {
						if (obj.hasOwnProperty(key)) {
							walk(obj[key], depth + 1);
						}
					}
				} else {
					result.push({text: obj});
				}
			}(root, 0));

			return result;
		}, function test_closed() {
			var	result = [],
					depth = 0,
					node,
					level = root,
					key, count,
			
			stack = [root];
			
			while (1) {
				// taking next child node
				count = 0;
				for (key in level) {
					if (level.hasOwnProperty(key)) {
						node = level[key];
						delete level[key];
						count++;
						break;
					}
				}
				
				if (!count) {
					// node is empty
					if (depth === 0) {
						// reached end of traversal
						break;
					} else {
						// going one level back (reached last node on level)
						delete stack[depth];
						level = stack[--depth];
						continue;
					}
				}

				if (typeof node === 'object') {
					// node is object, can go deeper
					level = stack[++depth] = node;
				} else {
					// leaf node, processing
					result.push({text: node});
				}
			}
			
			return result;
		});
	}());	
	
	(function () {
		jOB.benchmark("String search", "Cache", "jOrder");
		
		jOrder.logging = false;
				
		jOB.test("DB initialization", function () {
			var tmp = flock(json);
		}, function () {
			var tmp = jOrder(json);
		});
		
		jOB.test("Building index", buildCache, buildJOrder);

		jOB.test("Querying 'Con'", function () {
			return get("Con");
		}, function () {
			return table.where([{name: "Con"}], {renumber: true, mode: jOrder.startof});
		});
		
		jOB.test("Stacked search ('Con', 'Cons', then 'Const')",
		function stacked_flock() {
			var stage, hits;
			stage = flock(ds.get('C.o.n'));
			hits = stage.multiget('...name', {loopback: true});
			stage = flock(stage.get('s'));
			hits = stage.multiget('...name', {loopback: true});			
			stage = flock(stage.get('t'));
			hits = stage.multiget('...name', {loopback: true});
			return hits;
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

