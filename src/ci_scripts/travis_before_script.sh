if [ "${TEST_SUITE}" == "js_unittests" ]; then
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start
    sleep 3 # give xvfb some time to start
fi
