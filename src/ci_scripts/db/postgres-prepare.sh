export DB_USER=wirecloud_ci
export DB_NAME=${DB_USER}

pip install psycopg2

createuser -U postgres -h ${DB_HOST_IP} -p ${DB_HOST_PORT} ${DB_USER}
createdb -U postgres -h ${DB_HOST_IP} -p ${DB_HOST_PORT} -O ${DB_USER} ${DB_NAME}
createdb -U postgres -h ${DB_HOST_IP} -p ${DB_HOST_PORT} -O ${DB_USER} test_${DB_NAME}

cat ${WORKSPACE}/src/ci_scripts/db/postgres-conf.template >> $1/settings.py
