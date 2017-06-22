#!/usr/bin/env bash

export WC_INSTANCE_NAME=virtenv_test
[ -n "${IP_ADDR}" ] || IP_ADDR="localhost"

set -ex
virtualenv -p $1 ${WORKSPACE}/virtenv

# Discard the python interpreter parameter
shift

source ${WORKSPACE}/virtenv/bin/activate
PY_VERSION=`python -c "import sys; print('%s.%s' % sys.version_info[:2])"`
COVERAGE_CMD=${WORKSPACE}/virtenv/bin/coverage
RADON_CMD=${WORKSPACE}/virtenv/bin/radon

# Prepip scripts
for conf in $*
do
    file="${WORKSPACE}/src/ci_scripts/conf_scripts/${conf}-prepip.sh"
    if [[ -x "$file" ]]
    then
       . $file
    fi
done

# Build and install WireCloud
pip install -U setuptools wheel
cd ${WORKSPACE}/src; ./setup.py bdist_wheel; cd ..
pip install ${WORKSPACE}/src/dist/wirecloud*-py2.py3-none-any.whl

# Force selenium < 3 for now
pip install "selenium<3"

# Install the required testing tools
pip install coverage django-nose mock radon

DJANGO_VERSION=`django-admin.py --version`
DJANGO_VERSION="${DJANGO_VERSION%.*}"

# Create a WireCloud instance
${COVERAGE_CMD} run --branch --source=wirecloud ${WORKSPACE}/virtenv/bin/wirecloud-admin startproject ${WC_INSTANCE_NAME}
mv .coverage ${WC_INSTANCE_NAME}
cd ${WC_INSTANCE_NAME}

# And configure it
cat ${WORKSPACE}/src/ci_scripts/base_settings.py >> ${WC_INSTANCE_NAME}/settings.py
for conf in $*
do
    file="${WORKSPACE}/src/ci_scripts/conf_scripts/${conf}-prepare.sh"
    if [[ -x "$file" ]]
    then
        . $file
    fi
done

python manage.py migrate --noinput
python manage.py collectstatic -v 0 --noinput

# Pass the tests
DJANGO_LIVE_TEST_SERVER_ADDRESS="${IP_ADDR}:28081"    # Used by Django 1.8-1.10
DJANGO_LIVE_TEST_SERVER_HOST="${IP_ADDR}"             # Custom env variable used on Django 1.11
${COVERAGE_CMD} run -a --branch --source=wirecloud --omit="*/wirecloud/fp74caast/*,*/wirecloud/semanticwiring/*,*/tests/*,*/tests.py" manage.py test --noinput --with-xunit --nologcapture -v 2 ${TESTS}

mv .coverage ../virtenv/lib/python${PY_VERSION}/site-packages; cd ../virtenv/lib/python${PY_VERSION}/site-packages; ${WORKSPACE}/virtenv/bin/coverage xml; mv coverage.xml ${WORKSPACE}; cd ${WORKSPACE}
sed -i 's/<source>.*<\/source>/<source>src<\/source>/' coverage.xml

# Ciclomatic complexity
cd ${WORKSPACE}/src; ${RADON_CMD} cc -a wirecloud --show-closures --xml > ccm.xml
sed -i 's/<file>\([^<]*\)<\/file>/<file>src\/\1<\/file>/g' ccm.xml
