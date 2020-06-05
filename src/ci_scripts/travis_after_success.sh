set -e

if [ "${TEST_SUITE}" != "js_unittests" ]; then
    cd ${TRAVIS_BUILD_DIR}/src
    coveralls
fi
