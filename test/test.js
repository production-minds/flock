////////////////////////////////////////////////////////////////////////////////
// Unit Tests for Radiant Cache
////////////////////////////////////////////////////////////////////////////////
/*global flock, module, ok, equals, notEqual, deepEqual, raises, console */
var test = function (test) {
	test.flock = function () {
		var ds = flock({
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
			deepEqual(flock.resolve(''), [], "Root path (empty string)");
			deepEqual(flock.resolve([]), [], "Root path (empty array)");
			deepEqual(flock.resolve(path), apath, "String path " + path);
			deepEqual(flock.resolve(apath), apath, "Array path " + path);
			notEqual(flock.resolve(apath), apath, "Resolved path is copy.");
			deepEqual(flock.resolve('first.*.bcde...55'), ['first', '*', 'bcde', '', '55'], "Path with wildcards (string)");
			deepEqual(flock.resolve('first.*.bcde......55'), ['first', '*', 'bcde', '', '55'], "Path with erroneous wildcards (string)");
			deepEqual(flock.resolve(['first', '*', 'bcde', '', '55']), ['first', '*', 'bcde', '', '55'], "Path with wildcards (array)");
			raises(function () {
				ds.multiget('fourth...');
			}, "Path can't end in dot (string)");
			raises(function () {
				ds.multiget(['fourth', '.']);
			}, "Path can't end in dot (array)");
		});
		
		module("Access");
		
		test("Accessing values", function () {
			ok(ds.get('first.a'), "Path 'ds.first.a' is defined");
			ok(!ds.get('first.f'), "Path 'ds.first.f' is undefined");
			raises(function () {
				ds.get('fifth.a');
			}, function (msg) {
				console.log(msg);
				return true;
			}, "Invalid path raises exception");
		});
		
		test("Modifying values", function () {
			ds.set('first.b', 1);
			equals(ds.root().first.b, 1, "Setting value on existing path (ds.first.a)");
			ds.set('thousandth.x.5', 1000);
			equals(ds.root().thousandth.x[5], 1000, "Setting value on non-existing path (ds.thousandth.x.5)");
		});
		
		test("Deleting values", function () {
			var success;
				
			ds.set('thousandth.x.5', 1000);
			success = ds.unset('thousandth.x.5');
			ok(typeof ds.root().thousandth.x[5] === 'undefined', "Deleting value from cache (ds.thousandth.x.5)");
			
			equals(success, true, "Deletion returns success flag");
			
			equals(ds.unset('thousandth.x.5'), false, "Attempting to deletie non-existent value");
		});
		
		module("Queries");
		
		test("Wildcards", function () {
			// testing single-level wildcards
			deepEqual(
				ds.multiget('fourth.*'),
				[{a: "One", b: "Two"}, {a: "Three", b: "Four"}, {a: "Five", b: "Six"}],
				"Collecting nodes from path 'fourth.*'");
			deepEqual(
				ds.multiget('fourth.*', 1),
				[{a: "One", b: "Two"}],
				"Retrieving first node from path 'fourth.*'");
			deepEqual(
				ds.multiget('fourth.*.a'),
				["One", "Three", "Five"],
				"Collecting nodes from path 'fourth.*.a'");
			deepEqual(
				ds.multiget('fourth.2.*'),
				["Three", "Four"],
				"Collecting nodes from path 'fourth.2.*'");
			deepEqual(
				ds.multiget('*.1'),
				[{}, {a: "One", b: "Two"}],
				"Collecting nodes from path '*.1'");
		});
		
		test("Skipping", function () {
			// testing multi-level wildcards
			var dstmp = flock({
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
				dstmp.multiget('...1'),
				[{}, "hello", "two", "test"],
				"Collecting nodes from path '...1'");

			// creating loopback
			dstmp.set('test.b', dstmp.get('test'));
			ok(typeof dstmp.get('test.b') !== 'undefined', "Loopback set");
			deepEqual(
				dstmp.multiget('...1'),
				[{}, "hello", "two", "test"],
				"Loopbacks don't affect result");
		});
		
		test("Indexes", function () {
			var dstmp = flock();

			// sets string for full text search
			function set(name) {
				dstmp.set(name.split(''), {name: name});
			}

			// gets hits matching start of word
			function get(name) {
				return dstmp.multiget(name.split('').concat(['.', 'name']));
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
			deepEqual([
				get("wo"),
				get("her"),
				get("w"),
				get("h")
			], [[
				"world",
				"worn",
				"wounded"
			], [
				"hero",
				"hers"
			], [
				"world",
				"worn",
				"wounded",
				"wedding"
			], [
				"hello",
				"hero",
				"hers"
			]] , "Start of string search");
		});		
	};
	
	return test;
}(test || {});

