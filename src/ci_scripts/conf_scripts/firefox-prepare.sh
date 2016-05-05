export BROWSER_TYPE="FIREFOX"

cat ${WORKSPACE}/src/ci_scripts/templates/selenium-remote-conf.template >> ${WC_INSTANCE_NAME}/settings.py
