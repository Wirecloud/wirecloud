pip install psycopg2

createdb -U postgres -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -O ${DB_USER:-postgres} ${DB_NAME:-wirecloud}

cat ${TRAVIS_BUILD_DIR}/src/ci_scripts/templates/postgres-conf.template >> settings.py
