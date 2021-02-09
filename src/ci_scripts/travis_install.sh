if [ "${TEST_SUITE}" == "selenium" ]; then
    wget https://github.com/mozilla/geckodriver/releases/download/v0.20.1/geckodriver-v0.20.1-linux64.tar.gz
    mkdir geckodriver
    tar -xzf geckodriver-v0.20.1-linux64.tar.gz -C geckodriver
    export PATH=$PATH:$PWD/geckodriver
fi
