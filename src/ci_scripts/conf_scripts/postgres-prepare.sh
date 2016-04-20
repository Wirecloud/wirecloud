export DB_USER=postgres
export DB_NAME=wirecloud_ci

pip install psycopg2

createdb -U postgres -h ${DB_HOST} -p ${DB_PORT} -O ${DB_USER} ${DB_NAME}

cat ${WORKSPACE}/src/ci_scripts/templates/postgres-conf.template >> $1/settings.py
