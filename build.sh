echo Usage: build.sh [version]

if [ $# -eq 0 ]
then
    VERSION="latest"
else
    VERSION=$1
fi

NAME="flock-$VERSION"
NAMEMIN="flock-$VERSION-min"

if [ ! -d build ]
then
    mkdir build
fi

cat \
src/license.js \
src/flock.js \
src/utils.js \
src/core.js \
src/live.js \
src/event.js \
src/constants.js \
src/query.js \
> "build/$NAME.js"

if type jsmin >/dev/null 2>&1
then
    jsmin < "build/$NAME.js" > build/tmp.js
    cat src/license.js build/tmp.js > "build/$NAMEMIN.js"
    rm build/tmp.js
else
    echo Jsmin not found. Skipping minification.
fi

echo Done.
