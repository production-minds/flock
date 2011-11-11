////////////////////////////////////////////////////////////////////////////////
// Flock - JavaScript Key-Value Cache
//
// In-memory key-value store. Stores entire tree structure in memory.
// Use for complex lookups, as memcache on top of a persistence layer,
// or as an in-memory DHT node.
//
// https://github.com/wwidd/flock
////////////////////////////////////////////////////////////////////////////////
var	exports,

flock = function () {
	var RE_PATH_VALIDATOR = /^(\.{3})*([^\.,]+(\.{1,3}|,))*[^\.,]+$/,
			RE_PATH_SKIPPER = /\.{2,}/,
	
	// - root: root object for datastore
	flock = function (root) {
		// creating default root object
		if (typeof root === 'undefined') {
			root = {};
		}
		
		var self = {
			//////////////////////////////
			// Getters, setters

			root: function () {
				return root;
			},
			
			//////////////////////////////
			// Control
			
			// retrieves node at the given path
			// - path: string or array representing path
			// returns node on path
			// raises TypeError on invalid path 
			get: function (path) {
				var tpath = typeof path === 'object' ? path : flock.resolve(path),
						tmp = root,
						i;
				
				// walking nodes along path
				for (i = 0; i < tpath.length; i++) {
					tmp = tmp[tpath[i]];
				}
				
				// returning value on end node
				return tmp;
			},
			
			// sets node at the given path
			// - path: array representing path
			// - value: value to be set on path. default: {}
			// returns the node on the input path
			set: function (path, value) {
				value = value || {};
				
				var tpath = typeof path === 'object' ? path : flock.resolve(path),
						last = tpath.length - 1,
						key, node, child,
						i;
				
				if (!tpath.length) {
					throw "flock.set: empty path '" + path + "'";
				}
						
				// walking nodes along path
				for (i = 0, node = root; i < last; i++) {
					key = tpath[i];
					child = node[key];
					if (typeof child === 'undefined') {
						// creating node
						child = node[key] = {};
					}
					node = child;
				}
	
				// setting value on end node
				node[tpath[i]] = value;
				
				return node;
			},
			
			// removes a datastore element from the given path
			// - path: array representing element path
			// returns
			// - true: elem was present and deleted
			// - false: elem was not present
			unset: function (path) {
				var tpath = typeof path === 'object' ? path.concat([]) : flock.resolve(path),
						key = tpath.pop(),
						parent = self.get(tpath);
				
				// deleting node when exists
				if (parent && parent.hasOwnProperty(key)) {
					delete parent[key];
					return true;
				} else {
					return false;
				}
			},
			
			// retrieves multiple nodes
			// - path: pattern describing nodes
			// - options: see self.many()
			// returns an object or array of found nodes
			mget: function (path, options) {
				return self.many(path, options);
			},
			
			// sets multiple nodes
			// - path: pattern describing target nodes
			// 	 leaf node does not have to exist
			// - value: value to set, or callback to call on each leaf node
			// - options: see self.many()
			mset: function (path, value, options) {
				options = options || {};
				options.value = value || {};
				delete options.mode;
				self.many(path, options);
				return self;
			},
			
			// removes multiple nodes
			// - path: pattern describing target nodes
			// - options: see self.many()
			munset: function (path, options) {
				options = options || {};
				options.mode = flock.del;
				self.many(path, options);
				return self;
			},

			// collects or modifies end nodes specified by a wildcard path
			// - path: path to end nodes, may contain wildcards "*"
			// - options:
			//	 - limit: max number of entries to retrieve, default: unlimited
			//	 - mode: type of return value is Object or Array (flock.key/flock.values/flock.both/flock.del), default: flock.array
			//	 - loopback: whether to traverse loopbacks, default: false
			//	 - undef: whether to collect undefined entries, default: false
			//	 - value: value to set, or callback function to execute on nodes
			//		 when undefined, function returns collected values
			many: function (path, options) {
				options = options || {};
				
				// setting defaults
				if (typeof options.value === 'undefined' &&
					typeof options.mode === 'undefined') {
					options.mode = flock.values;
				}
				
				var tpath = typeof path === 'object' ? path.concat([]) : flock.resolve(path),
						last = tpath.length - 1,
						limit = options.limit || 0,
						loopback = options.loopback || false,
						result = {2: {}, 4: 0}[options.mode] || [],
						stack = options.loopback ? null : [];
				
				// default case
				if (!tpath.length) {
					return root;
				}
						
				// collects end nodes
				// must be class level, creating a function on each call
				// to .multiget() may impact performance significantly
				// - obj: node data
				// - i: current position in path
				// - depth: current depth in tree
				(function walk(obj, i, depth) {
					var key, j;
					
					// detecting loopback
					if (!loopback) {
						for (j = 0; j < depth; j++) {
							if (obj === stack[j]) {
								return;
							}
						}
						// putting current object on the stack
						stack[depth] = obj;
					}
					
					// processes one node				
					// - key: key in object to proceed to
					// returns flag whether to terminate traversal
					function node(key) {
						var value;
						if (i < last) {
							// current node has children, burrowing one level deeper
							if (obj.hasOwnProperty(key)) {
								walk(obj[key], i + 1, depth + 1);
							}
						} else {
							// leaf node reached
							if (typeof options.mode !== 'undefined') {
								// when querying or deleting
								value = obj[key];
								if (options.undef || typeof value !== 'undefined') {
									switch (options.mode) {
									case flock.values:
										// collecting value from nodes
										result.push(value);
										break;
									case flock.keys:
										// collecting key from node
										result.push(key);
										break;
									case flock.both:
										// collecting key AND value from node
										// WARNING: new values with same key overwrite old
										result[key] = value;
										break;
									case flock.del:
										// deleting node
										delete obj[key];
										break;
									case flock.count:
										// counting node
										result++;
										break;
									}
									if (--limit === 0) {
										return true;
									}
								}
							} else {
								// when updating
								if (typeof options.value === 'function') {
									// calling custom handler on node
									value = options.value(obj[key]);
									if (typeof value !== 'undefined') {
										obj[key] = value;
									}
								} else {
									// assigning custom value to key
									obj[key] = options.value;
								}
								if (--limit === 0) {
									return true;
								}
							}
						}
						return false;
					}
					
					// processing next key in path
					key = tpath[i];
					if (key === '*') {
						// processing wildcard node
						for (key in obj) {
							if (obj.hasOwnProperty(key)) {
								if (node(key)) {
									return;
								}
							}
						}
					} else if ((key === '' || key === null) && typeof obj === 'object') {
						// processing skipper node
						// must be object type as strings have indexes, too
						for (key in obj) {
							if (obj.hasOwnProperty(key)) {
								if (key === tpath[i + 1]) {
									// current key matches next key in path
									// re-walking current object but leving skipper key
									walk(obj, i + 1, depth);
								} else {
									// current key doesn't match next key in path
									// walking next level, but staying on skipper key
									walk(obj[key], i, depth + 1);
								}
							}
						}
					} else if (key instanceof Array) {
						// processing list of nodes
						for (j = 0; j < key.length; j++) {
							if (node(key[j])) {
								return;
							}
						}
					} else {
						// processing single node
						key = tpath[i];
						if (node(key)) {
							return;
						}
					}
				}(root, 0, 0));
				
				return result;
			}
		};
		
		return self;
	};

	//////////////////////////////
	// Static variables

	// these constants tell the traversal process to...
	flock.keys = 0;			// collect leaf keys
	flock.values = 1;		// collect leaf values
	flock.both = 2;			// collect key:value pairs of leaf nodes
	flock.del = 3;			// delete leaf nodes
	flock.count = 4;		// count leaf nodes

	//////////////////////////////
	// Static methods

	// returns an array representation of the passed string
	// path format is: keys separated with dots
	// wildcards:
	// - '*': for one level
	// - '.' or '': until the adjacent key in path matches
	// example: 'contacts.smith.*.ancestors...name'
	// 					will get the names of all ancestor names for contacts w/ last name 'smith'
	flock.resolve = function (path) {
		// processing path
		if (typeof path === 'string') {
			// validating path
			if (path.length && !RE_PATH_VALIDATOR.test(path)) {
				throw "flock.resolve: invalid path";
			}
			
			var keys,
					i, key;
			
			// splitting along dots
			keys = path.length ? path.replace(RE_PATH_SKIPPER, function (match, offset) {
				return offset ? '..' : '.';
			}).split('.') : [];
			
			// splitting along commas to form multiple choice keys 
			for (i = 0; i < keys.length; i++) {
				key = keys[i];
				if (key.indexOf(',') > -1) {
					keys[i] = key.split(',');
				}
			}
			
			return keys;
		} else {
			throw "flock.resolve: invalid argument";
		}
	};
	
	return flock;
}();

(exports || {}).flock = flock;

