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
	var walk,
	
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
			get: function (path) {
				var tpath = flock.resolve(path),
						tmp = root;
				
				// walking nodes along path
				while (tpath.length > 1) {
					tmp = tmp[tpath.shift()];
					if (typeof tmp === 'undefined') {
						throw "flock.get: invalid datastore path '" + path.toString() + "'";
					}
				}
				
				// returning value on end node
				return tmp[tpath[0]];
			},
			
			// sets node at the given path
			// - path: array representing path
			// - value: value to be set at path
			set: function (path, value) {
				var tpath = flock.resolve(path),
						last = tpath.length - 1,
						key, node, child,
						i;
				
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
				
				return true;
			},
			
			// removes a datastore element from the given path
			// - path: array representing element path
			// returns
			// - true: elem was present and deleted
			// - false: elem was not present
			unset: function (path) {
				var tpath = flock.resolve(path),
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
			// - limit: max number of entries to retrieve
			// - loopback: traverses loopbacks
			multiget: function (path, limit, loopback) {
				limit = limit || 0;
				loopback = loopback || false;
				
				var result = [];
				
				// collecting end nodes
				walk(root, 0, 0,
					flock.resolve(path),
					limit,
					loopback ? null : [],
					result);
				
				return result;
			}
		};
		
		return self;
	};

	//////////////////////////////
	// Utility functions

	// collects end nodes
	// must be class level, creating a function on each call
	// to .multiget() may impact performance significantly
	// - obj: node data
	// - i: current position in path
	// - depth: current depth in tree
	// - tpath: resolved query path
	// - limit: max number of nodes to return
	// - stack: stack buffer (tracks traversed nodes)
	// - result: resut buffer
	walk = function (obj, i, depth, tpath, limit, stack, result) {
		var last = tpath.length - 1,
				key, j;
		
		// detecting loopback
		if (stack) {
			for (j = 0; j < depth; j++) {
				if (obj === stack[j]) {
					return;
				}
			}
			// putting current object on the stack
			stack[depth] = obj;
		}
		
		switch (tpath[i]) {
		case '*':
		case '?':
			// processing wildcard node
			if (i < last) {
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						walk(obj[key], i + 1, depth + 1,
							tpath, limit, stack, result);
					}
				}
			} else {
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {					
						result.push(obj[key]);
						if (--limit === 0) {
							return result;
						}
					}
				}
			}
			break;
			
		case '':
		case '.':
			// processing skiper node
			if (typeof obj === 'object') {
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						if (key === tpath[i + 1]) {
							result.push(obj[key]);
						} else {
							walk(obj[key], i, depth + 1,
								tpath, limit, stack, result);
						}
					}
				}
			}
			break;
			
		default:
			// processing explicit node
			key = tpath[i];
			if (!obj.hasOwnProperty(key)) {
				// no such node
				return;
			} else {
				if (i < last) {
					walk(obj[key], i + 1, depth + 1,
						tpath, limit, stack, result);
				} else {
					result.push(obj[key]);
					if (--limit === 0) {
						return result;
					}
				}
			}
			break;
		}
	};

	//////////////////////////////
	// Static methods

	// returns an array representation of the passed string or array
	// path format is: keys separated with dots
	// wildcards:
	// - '*': for one level
	// - '.' or '': until the adjacent key in path matches
	// example: 'contacts.smith.*.ancestors...name'
	// 					will get the names of all ancestor names for contacts w/ last name 'smith'
	flock.resolve = function (path) {
		// raising error if path ends in dot
		if (path[path.length - 1] === '.') {
			throw "flock.resolve: path can't end in dot";
		}

		// processing path
		if (path instanceof Array) {
			// returning shallow copy of array
			return path.concat([]);
		} else if (typeof path === 'string') {
			// returning string split along dots
			return path.length ? path.replace(/\.{2,}/, function (match, offset) {
				return offset ? '..' : '.';
			}).split('.') : [];
		} else {
			throw "flock.resolve: invalid argument";
		}
	};
	
	return flock;
}();

(exports || {}).flock = flock;

