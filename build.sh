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
src/path.js \
src/single.js \
src/live.js \
src/event.js \
src/constants.js \
src/query.js \
src/multi.js \
> "build/$NAME.js"

if type yui-compressor >/dev/null 2>&1
then
    echo Minifying using YUI compressor.
    yui-compressor "build/$NAME.js" > build/tmp.js
elif type jsmin >/dev/null 2>&1
then
    echo Minifying using Jsmin.
    jsmin < "build/$NAME.js" > build/tmp.js
else
    echo No minifier found, skipping minification.
fi

if [ -f build/tmp.js ]
then
    cat src/license.js build/tmp.js > "build/$NAMEMIN.js"
    rm build/tmp.js

    echo Gzipping.
    gzip --stdout "build/$NAMEMIN.js" > "build/$NAMEMIN.js.gz"
fi

echo Done.
