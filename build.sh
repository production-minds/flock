cat \
src/license.js \
src/flock.js \
src/utils.js \
src/core.js \
src/live.js \
src/event.js \
src/constants.js \
src/query.js \
> build/flock-latest.js

jsmin < build/flock-latest.js > build/tmp.js

cat src/license.js build/tmp.js > build/flock-latest-min.js

rm build/tmp.js
