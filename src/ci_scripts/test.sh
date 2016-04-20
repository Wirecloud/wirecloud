#!/usr/bin/env bash

set -ex
virtualenv -p $1 ${WORKSPACE}/virtenv

# Discard the python interpreter parameter
shift

source ${WORKSPACE}/virtenv/bin/activate
export PIP_DOWNLOAD_CACHE=~/.pip_cache
PY_VERSION=`python -c "import sys; print('%s.%s' % sys.version_info[:2])"`
COVERAGE_CMD=${WORKSPACE}/virtenv/bin/coverage
RADON_CMD=${WORKSPACE}/virtenv/bin/radon

# Prepip scripts
for conf in $*
do
    file="${WORKSPACE}/src/ci_scripts/db/${conf}-prepip.sh"
    if [[ -x "$file" ]]
    then
       . $file
    fi
done

# Build and install WireCloud
pip install -U setuptools wheel
cd ${WORKSPACE}/src; ./setup.py bdist_wheel; cd ..
pip install ${WORKSPACE}/src/dist/wirecloud*-py2.py3-none-any.whl

# Install the required testing tools
pip install coverage django-nose mock radon

DJANGO_VERSION=`django-admin.py --version`
DJANGO_VERSION="${DJANGO_VERSION%.*}"

# Create a WireCloud instance
${COVERAGE_CMD} run --branch --source=wirecloud ${WORKSPACE}/virtenv/bin/wirecloud-admin startproject virtenv_test
mv .coverage virtenv_test
cd virtenv_test

# And configure it
for conf in $*
do
file="${WORKSPACE}/src/ci_scripts/db/${conf}-prepare.sh"
if [[ -x "$file" ]]
then
    . $file virtenv_test
fi
done

if [ "${DJANGO_VERSION}" == '1.4' ] || [ "${DJANGO_VERSION}" == '1.5' ] || [ "${DJANGO_VERSION}" == '1.6' ];
then
    python manage.py syncdb --migrate --noinput
else
    python manage.py migrate --noinput
fi
python manage.py collectstatic -v 0 --noinput

# Pass the tests
# pip install ipdb
cat ${WORKSPACE}/src/ci_scripts/base_settings.py >> virtenv_test/settings.py
${COVERAGE_CMD} run -a --branch --source=wirecloud --omit="*/wirecloud/fp74caast/*,*/wirecloud/semanticwiring/*,*/tests/*,*/tests.py" manage.py test --liveserver=${IP_ADDR}:28081 --noinput --with-xunit --nologcapture -v 2 #-a tags="docker"

mv .coverage ../virtenv/lib/python${PY_VERSION}/site-packages; cd ../virtenv/lib/python${PY_VERSION}/site-packages; ${WORKSPACE}/virtenv/bin/coverage xml; mv coverage.xml ${WORKSPACE}; cd ${WORKSPACE}
sed -i 's/<source>.*<\/source>/<source>src<\/source>/' coverage.xml

# Ciclomatic complexity
cd ${WORKSPACE}/src; ${RADON_CMD} cc -a wirecloud --show-closures --xml > ccm.xml
sed -i 's/<file>\([^<]*\)<\/file>/<file>src\/\1<\/file>/g' ccm.xml
