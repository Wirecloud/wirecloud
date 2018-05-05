if [ "${TEST_SUITE}" == "js_unittests" ]; then
    cd $TRAVIS_BUILD_DIR/src
    npm install grunt-cli -g
    npm install
    cd $TRAVIS_BUILD_DIR
fi
