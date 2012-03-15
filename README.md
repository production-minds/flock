Flock
=====

Flock is a compact, evented key-value cache written in JavaScript.

Getting started
---------------

	var cache = flock();
	
	cache.set('contacts.doe.john', {age: 34, height: 5.3});
	cache.set('contacts.smith.joe', {age: 26, height: 6.0});
	cache.set('contacts.miller.john', {age: 40, height: 5.1});
	
	console.log(cache.get('contacts.doe.john.height').node().toString());   // 5.3
	console.log(cache.query('contacts.*.john.age').node().toString());      // [34, 40]
	console.log(cache.query('contacts...height').node().toString());        // [5.3, 6, 5.1]

Testing
-------

You'll need these dependencies for the tests and benchmarks to work: [flock-js-libs.zip](https://github.com/downloads/wwidd/flock/flock-js-libs.zip) 

