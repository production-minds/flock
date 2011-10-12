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
		
		var root = ds.root();
		
		function keys(obj) {
			var result = [],
					key;
			for (key in obj) {
				result.push(key);
			}
			return result;
		}
		
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
					result.push(obj);
				}
			}(root, 0));
			
			return result;
		}, function test_closed() {
			var	result = [],
					node = root,
					depth = 0,
					level, key,
			
			stack = [{
				node: node,
				keys: keys(node),
				pos: 0
			}];
			
			while (1) {
				level = stack[depth];
				
				if (level.pos === level.keys.length) {
					if (depth === 0) {
						break;
					} else {
						// going one level back (reached last node on level)
						delete stack[depth];
						level = stack[--depth];
						level.pos++;
						continue;
					}
				}

				key = level.keys[level.pos];
				node = level.node[key];
				
				if (typeof node === 'object') {
					// setting up next level
					level = {
						node: node,
						keys: keys(node),
						pos: 0
					};
					stack[++depth] = level;
				} else {
					// going on to next node in level
					result.push(node);
					level.pos++;
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
		
		jOB.test("Stacked search ('Con', then 'st')",
		function () {
			var stage = ds.get('C.o.n'),
					hits = ds.multiget('C.o.n...name', {loopback: true});
			return flock(stage).multiget('s.t...name', {loopback: true});
		}, function () {
			var hits = table.where([{name: 'Con'}], {renumber: true, mode: jOrder.startof});
			return jOrder(hits)
				.index('name', ['name'], {type: jOrder.string, ordered: true, grouped: true})
				.where([{name: 'Const'}], {renumber: true, mode: jOrder.startof});
		});
	}());	
}(jOB));

