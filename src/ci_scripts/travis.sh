#!/usr/bin/env bash

set -e

cd $TRAVIS_BUILD_DIR/src

if [ "${TEST_SUITE}" == "js_unittests" ]; then
    grunt ci
    exit
elif [ "${TEST_SUITE}" == "elasticsearch" ]; then
    FLAGS="postgres django${DJANGO_VERSION} elasticsearch search-api"
elif [ "${TEST_SUITE}" == "solr" ]; then
    FLAGS="postgres django${DJANGO_VERSION} solr search-api"
elif [ "${TEST_SUITE}" == "selenium" ]; then
    FLAGS="postgres django${DJANGO_VERSION} firefox-local elasticsearch selenium"
else
    FLAGS="sqlite3 django${DJANGO_VERSION} unittest"
fi


[ -n "${IP_ADDR}" ] || IP_ADDR="localhost"

WORKSPACE=${TRAVIS_BUILD_DIR}
COVERAGE_CMD=coverage
RADON_CMD=radon

# Prepip scripts
for conf in $FLAGS
do
    file="${TRAVIS_BUILD_DIR}/src/ci_scripts/conf_scripts/${conf}-prepip.sh"
    if [[ -x "$file" ]]
    then
       . $file
    fi
done

# Build and install WireCloud
./setup.py bdist_wheel &> /dev/null
pip install ${TRAVIS_BUILD_DIR}/src/dist/wirecloud*.whl

# Install the required testing tools
pip install django-nose mock radon

# Configure WireCloud
cat ${TRAVIS_BUILD_DIR}/src/ci_scripts/base_settings.py > settings.py
for conf in $FLAGS
do
    file="${TRAVIS_BUILD_DIR}/src/ci_scripts/conf_scripts/${conf}-prepare.sh"
    if [[ -x "$file" ]]
    then
        . $file
    fi
done

python manage.py migrate --noinput
python manage.py collectstatic -v 0 -c --noinput

# Pass the tests
DJANGO_LIVE_TEST_SERVER_ADDRESS="${IP_ADDR}:28081"    # Used by Django 1.8-1.10
DJANGO_LIVE_TEST_SERVER_HOST="${IP_ADDR}"             # Custom env variable used on Django 1.11
${COVERAGE_CMD} run -a --branch --source=wirecloud --omit="*/wirecloud/fp74caast/*,*/wirecloud/semanticwiring/*,*/wirecloud/guidebuilder/*,*/tests/*,*/tests.py" manage.py test --noinput --nologcapture -v 2 ${TESTS}
