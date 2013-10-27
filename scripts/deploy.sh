GIT_BRANCH=dev
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PACKAGE_FOLDER=/tmp/geopuzzle-$GIT_BRANCH
PACKAGE_GZIP_FILENAME=geopuzzle-$GIT_BRANCH.tar.gz
PACKAGE_GZIP_PATH=$SCRIPT_DIR/$PACKAGE_GZIP_FILENAME

mkdir -p $PACKAGE_FOLDER
git archive $GIT_BRANCH | tar -x -C $PACKAGE_FOLDER

rm -rf $PACKAGE_GZIP_PATH
cd /tmp && tar -czf $PACKAGE_GZIP_PATH geopuzzle-$GIT_BRANCH

scp $PACKAGE_GZIP_PATH vasilech@vasile.ch:/home6/vasilech/public_html/tmp

ssh vasilech@vasile.ch "cd /home6/vasilech/public_html/tmp/ && tar --preserve-permissions -xf $PACKAGE_GZIP_FILENAME && rm -rf ../_ch_vasile_maps/geopuzzle/ && mv geopuzzle-$GIT_BRANCH ../_ch_vasile_maps/geopuzzle/"

rm -rf $PACKAGE_GZIP_PATH