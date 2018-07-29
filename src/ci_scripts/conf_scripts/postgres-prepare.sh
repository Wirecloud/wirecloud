pip install psycopg2

createdb -U postgres -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -O ${DB_USER:-postgres} ${DB_NAME:-wirecloud}

cat ${WORKSPACE}/src/ci_scripts/templates/postgres-conf.template >> ${WC_INSTANCE_NAME}/settings.py
