export DB_USER=wirecloud_ci
export DB_NAME=${DB_USER}

pip install psycopg2

createdb -U ${DB_USER} ${DB_NAME}
createdb -U ${DB_USER} test_${DB_NAME}

cat ${WORKSPACE}/src/ci_scripts/templates/postgres-conf.template >> $1/settings.py
