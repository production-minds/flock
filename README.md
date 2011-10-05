Flock
=====

JavaScript key-value cache for use in the browser or with Node.js.

Getting started
---------------

	var cache = flock();
	
	cache.set('contacts.doe.john', {age: 34, height: 5.3});
	cache.set('contacts.smith.joe', {age: 26, height: 6.0});
	cache.set('contacts.miller.john', {age: 40, height: 5.1});
	
	console.log(cache.get('contacts.doe.john.height').toString());  // 5.3
	console.log(cache.multiget('contacts.*.john.age').toString());  // [34, 40]
	console.log(cache.multiget('contacts...height').toString());    // [5.3, 6, 5.1]

