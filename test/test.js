////////////////////////////////////////////////////////////////////////////////
// Unit Tests for Radiant Cache
////////////////////////////////////////////////////////////////////////////////
/*global flock, module, ok, equals, notEqual, deepEqual, raises, console */
var test = function (test) {
	test.flock = function () {
		var cache = flock({
			first: {
				a: {},
				b: {},
				c: {},
				d: {},
				e: {}
			},
			second: {
				1: {},
				2: {},
				3: {}
			},
			third: {},
			fourth: {
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
		});
		
		module("Basics");

		test("Path resolution", function () {
			var path = 'first.a.bcde.1.55',
					apath = path.split('.');
			deepEqual(flock.resolve(''), [], "Root path");
			deepEqual(flock.resolve(path), apath, "String path " + path);
			deepEqual(flock.resolve('first.*.bcde...55'), ['first', '*', 'bcde', '', '55'], "Path with wildcards");
			raises(function () {
				flock.resolve('first.*.bcde......55');
			}, "Path with erroneous wildcards");
			raises(function () {
				cache.multiget('fourth...');
			}, "Path can't end in dot");
			deepEqual(flock.resolve('first.1,2,3.*'), ['first', ['1', '2', '3'], '*'], "Array keys");
		});
		
		module("Access");
		
		test("Accessing values", function () {
			ok(cache.get('first.a'), "Path 'cache.first.a' is defined");
			ok(!cache.get('first.f'), "Path 'cache.first.f' is undefined");
			raises(function () {
				cache.get('fifth.a');
			}, function (msg) {
				console.log(msg);
				return true;
			}, "Invalid path raises exception");
		});
		
		module("Queries");
		
		test("Wildcards", function () {
			// testing single-level wildcards
			deepEqual(
				cache.multiget('fourth.*'),
				[{a: "One", b: "Two"}, {a: "Three", b: "Four"}, {a: "Five", b: "Six"}],
				"Collecting nodes from path 'fourth.*'");
			deepEqual(
				cache.multiget('fourth.*', {limit: 1}),
				[{a: "One", b: "Two"}],
				"Retrieving first node from path 'fourth.*'");
			deepEqual(
				cache.multiget('fourth.*.a'),
				["One", "Three", "Five"],
				"Collecting nodes from path 'fourth.*.a'");
			deepEqual(
				cache.multiget('fourth.2.*'),
				["Three", "Four"],
				"Collecting nodes from path 'fourth.2.*'");
			deepEqual(
				cache.multiget('*.1'),
				[{}, {a: "One", b: "Two"}],
				"Collecting nodes from path '*.1'");
			
			deepEqual(
				cache.multiget('first,second.*', {mode: flock.lookup}),
				{a: {}, b: {}, c: {}, d: {}, e: {}, 1: {}, 2: {}, 3: {}},
				"Getting results as lookup");
		});
		
		test("OR relation", function () {
			deepEqual(
				cache.multiget(['fourth', [1, 3]]),
				[{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
				"Collecting specific nodes from path 'fourth.1,3'");
			deepEqual(
				cache.multiget('fourth.1,3'),
				[{a: "One", b: "Two"}, {a: "Five", b: "Six"}],
				"Collecting specific nodes from path 'fourth.1,3' (passed as string)");
			deepEqual(
				cache.multiget(['fourth', [1, 3], '*']),
				["One", "Two", "Five", "Six"],
				"Collecting specific nodes from path 'fourth.1,3.*'");
			deepEqual(
				cache.multiget([['first', 'third']]),
				[{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
				"Collecting specific nodes from path 'first,third'");
			deepEqual(
				cache.multiget('first,third'),
				[{ a: {}, b: {}, c: {}, d: {}, e: {} }, {}],
				"Collecting specific nodes from path 'first,third' (passed as string)");
		});
		
		test("Skipping", function () {
			// testing multi-level wildcards
			var cache = flock({
				1: {},
				test: {
					1: "hello",
					a: "world"
				},
				what: [
					"one",
					"two",
					"three",
					{
						awe: "some",
						1: "test"
					}
				]
			});

			deepEqual(
				cache.multiget('...1'),
				[{}, "hello", "two", "test"],
				"Collecting nodes from path '...1'");
			deepEqual(
				cache.multiget(['what', '3', 'awe']),
				["some"],
				"Collecting nodes from path 'what.3.awe'");
			deepEqual(
				cache.multiget(['', '3', 'awe']),
				["some"],
				"Collecting nodes from path '...3.awe'");

			// creating loopback
			cache.set('test.b', cache.get('test'));
			ok(typeof cache.get('test.b') !== 'undefined', "Loopback set");
			deepEqual(
				cache.multiget('...1'),
				[{}, "hello", "two", "test"],
				"Loopbacks don't affect result");
		});
		
		test("Edge cases", function () {
			var cache = flock({
				1: {},
				test: {
					1: "hello",
					a: "world"
				},
				what: [
					"one",
					"two",
					"three",
					{
						awe: "some",
						1: "test"
					}
				]
			});

			equals(cache.get(''), cache.root(), ".get('') and .root() point to the same object");
			equals(cache.multiget(''), cache.root(), ".multiget('') and .root() point to the same object");
			raises(function () {			
				cache.set('', {});
			}, "Can't set root");
		});
		
		module("Updating");
		
		test("Modifying values", function () {
			cache.set('first.b', 1);
			equals(cache.root().first.b, 1, "Setting value on existing path (cache.first.a)");
			var ref = cache.set('thousandth.x.5', 1000);
			equals(cache.root().thousandth.x[5], 1000, "Setting value on non-existing path (cache.thousandth.x.5)");
			equals(ref, cache.root().thousandth.x, "Method .set() returns reference to input node");
		});
		
		test("Deleting values", function () {
			var success;
				
			cache.set('thousandth.x.5', 1000);
			success = cache.unset('thousandth.x.5');
			ok(typeof cache.root().thousandth.x[5] === 'undefined', "Deleting value from cache (cache.thousandth.x.5)");
			
			equals(success, true, "Deletion returns success flag");
			
			equals(cache.unset('thousandth.x.5'), false, "Attempting to deletie non-existent value");
		});		
		
		module("Search");
		
		test("String index", function () {
			var index = flock();

			// sets string for full text search
			function set(name) {
				index.set(name.split(''), {name: name});
			}

			// setting up cache
			set("hello");
			set("world");
			set("hero");
			set("wounded");
			set("worn");
			set("hers");
			set("wedding");

			// querying data			
			deepEqual(index.multiget("w.o...name"), [
				"world",
				"worn",
				"wounded"
			], "wo...");
			deepEqual(index.multiget("h.e.r...name"), [
				"hero",
				"hers"
			], "her...");
			deepEqual(index.multiget("w...name"), [
				"world",
				"worn",
				"wounded",
				"wedding"
			], "w...");
			deepEqual(index.multiget("h...name"), [
				"hello",
				"hero",
				"hers"
			], "h...");
			deepEqual(index.multiget("w.o.*.n...name"), [
				"worn",
				"wounded"
			], "wo*n...");
			deepEqual(index.multiget("*.e...name"), [
				"hello",
				"hero",
				"hers",
				"wedding"
			], "*e...");
		});		
	};
	
	return test;
}(test || {});

