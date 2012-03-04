cat \
src/flock.js \
src/utils.js \
src/core.js \
src/live.js \
src/event.js \
src/constants.js \
src/query.js \
> build/flock-latest.js

jsmin < build/flock-latest.js > build/flock-latest-min.js

