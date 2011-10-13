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
			// - value: value to be set at path
			// returns the node on the input path
			set: function (path, value) {
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
			
			// collects end nodes specified by a wildcard path
			// - path: path to end nodes, may contain wildcards "*"
			// - options:
			//	 - limit: max number of entries to retrieve, default: unlimited
			//	 - mode: type of return value is Object or Array (flock.lookup/flock.array), default: flock.array
			//	 - loopback: whether to traverse loopbacks, default: false
			//	 - undef: whether to collect undefined entries, default: false
			multiget: function (path, options) {
				options = options || {};
				
				var tpath = typeof path === 'object' ? path.concat([]) : flock.resolve(path),
						last = tpath.length - 1,
						limit = options.limit || 0,
						loopback = options.loopback || false,
						result = options.mode === flock.lookup ? {} : [],
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
						var value = obj[key];
						if (i < last) {
							walk(value, i + 1, depth + 1);
						} else if (options.undef || typeof value !== 'undefined') {
							if (result instanceof Array) {
								result.push(value);
							} else {
								result[key] = value;
							}
							if (--limit === 0) {
								return true;
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
					} else if ((key === '' || key === '.' || key === null) && typeof obj === 'object') {
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
						if (!obj.hasOwnProperty(key) || node(key)) {
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

	flock.array = 0;
	flock.lookup = 1;

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

