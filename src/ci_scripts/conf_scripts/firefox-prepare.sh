export BROWSER_TYPE="FIREFOX"

cat ${TRAVIS_BUILD_DIR}/src/ci_scripts/templates/selenium-remote-conf.template >> settings.py
