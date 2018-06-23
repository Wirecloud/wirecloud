#!/usr/bin/env bash

if [ "${TEST_SUITE}" == "js_unittests" ]; then
    cd $TRAVIS_BUILD_DIR/src
    grunt ci
    exit
fi


export WC_INSTANCE_NAME=test_instance
[ -n "${IP_ADDR}" ] || IP_ADDR="localhost"

WORKSPACE=${TRAVIS_BUILD_DIR}
PYTHON_VERSION=`python -c "import sys; print('%s.%s.%s' % sys.version_info[:3])"`
COVERAGE_CMD=coverage
RADON_CMD=radon

# Prepip scripts
for conf in $*
do
    file="${TRAVIS_BUILD_DIR}/src/ci_scripts/conf_scripts/${conf}-prepip.sh"
    if [[ -x "$file" ]]
    then
       . $file
    fi
done

# Build and install WireCloud
cd src; ./setup.py bdist_wheel &> /dev/null; cd ..
pip install ${TRAVIS_BUILD_DIR}/src/dist/wirecloud*.whl

# Install the required testing tools
pip install django-nose mock radon

DJANGO_VERSION=`django-admin.py --version`
DJANGO_VERSION="${DJANGO_VERSION%.*}"

# Create a WireCloud instance
~/virtualenv/python$PYTHON_VERSION/bin/wirecloud-admin startproject ${WC_INSTANCE_NAME}
cd ${WC_INSTANCE_NAME}

# And configure it
cat ${TRAVIS_BUILD_DIR}/src/ci_scripts/base_settings.py >> ${WC_INSTANCE_NAME}/settings.py
for conf in $*
do
    file="${TRAVIS_BUILD_DIR}/src/ci_scripts/conf_scripts/${conf}-prepare.sh"
    if [[ -x "$file" ]]
    then
        . $file
    fi
done

python manage.py migrate --noinput
python manage.py collectstatic -v 0 --noinput

# Pass the tests
cd ${TRAVIS_BUILD_DIR}/src
DJANGO_LIVE_TEST_SERVER_ADDRESS="${IP_ADDR}:28081"    # Used by Django 1.8-1.10
DJANGO_LIVE_TEST_SERVER_HOST="${IP_ADDR}"             # Custom env variable used on Django 1.11
${COVERAGE_CMD} run -a --branch --source=wirecloud --omit="*/wirecloud/fp74caast/*,*/wirecloud/semanticwiring/*,*/wirecloud/guidebuilder/*,*/tests/*,*/tests.py" manage.py test --noinput --nologcapture -v 2 ${TESTS}
