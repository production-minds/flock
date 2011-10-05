////////////////////////////////////////////////////////////////////////////////
// Radiant
////////////////////////////////////////////////////////////////////////////////
/*global jOB, jOrder, flock */

// registering benchmarks on document ready
(function (jOB) {
	var 
	
	ds = flock({
		1: {
			first: {
				1: {
					a: "One",
					b: "Two"
				},
				2: {
					a: "Three",
					b: "Four"
				},
				3: {
					a: "Five",
					b: "Six"
				}
			}
		}
	}),
	
	value = 123,
	digits = 8;

	jOB.benchmark("Querying in cache", ".get()", ".multiget()");

	jOB.test("single node", function () {
		return [{result: ds.get('1.first.1.a')}];
	}, function () {
		return [{result: ds.multiget('1.first.1.a')}];
	});
	
	jOB.test("multiple nodes", function () {
		var root = ds.get('1.first'),
				i, result = [];
		for (i in root) {
			if (root.hasOwnProperty(i)) {
				result.push(root[i]);
			}
		}
		return result;
	}, function () {
		return ds.multiget('1.first.*');
	});
	
	
	(function () {
		jOB.benchmark("String search", "Cache", "jOrder");
		
		jOrder.logging = false;
		
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
		
		jOB.test("Building index", buildCache, buildJOrder);
		jOB.test("Querying", function () {
			return get("Con");
		}, function () {
			return table.where([{name: "Con"}], {renumber: true, mode: jOrder.startof});
		});
	}());	
}(jOB));

