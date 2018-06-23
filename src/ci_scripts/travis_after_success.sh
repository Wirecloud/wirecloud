if [ "${TEST_SUITE}" != "js_unittests" ]; then
    cd src
    coveralls
fi
