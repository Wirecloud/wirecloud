DB_USER=wirecloud-pip-develop-python2.7-postgres
export PGPASSWORD=wirecloud

pip install psycopg2

dropdb -U ${DB_USER} ${DB_USER} --if-exist
createdb -U ${DB_USER} ${DB_USER}

cat ${WORKSPACE}/src/ci-scripts/db/postgres-conf.template >> $1/settings.py
