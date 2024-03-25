#!/bin/bash

set -e

# allow the container to be started with `--user`
if [ "$(id -u)" = '0' ]; then
	chown -R wirecloud data
	chown -R wirecloud /var/www/static
fi

# Real entry point
case "$1" in
    initdb)
        manage.py migrate --fake-initial
        manage.py populate
        ;;
    createdefaultsuperuser)
        echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', 'admin')" | manage.py shell > /dev/null
        ;;
    createsuperuser)
        manage.py createsuperuser
        ;;
    gunicorn)
        manage.py collectstatic --noinput
        manage.py migrate --fake-initial
        manage.py populate

        # allow the container to be started with `--user`
        if [ "$(id -u)" = '0' ]; then
            exec gosu wirecloud /usr/local/bin/gunicorn wirecloud_instance.wsgi:application \
                --forwarded-allow-ips "${FORWARDED_ALLOW_IPS}" \
                --workers ${WORKERS} \
                --threads ${THREADS} \
                --bind 0.0.0.0:8000 \
                --log-file - \
                --logger-class wirecloud.glogger.GunicornLogger
        else
            exec /usr/local/bin/gunicorn wirecloud_instance.wsgi:application \
                --forwarded-allow-ips "${FORWARDED_ALLOW_IPS}" \
                --workers ${WORKERS} \
                --threads ${THREADS} \
                --bind 0.0.0.0:8000 \
                --log-file - \
                --logger-class wirecloud.glogger.GunicornLogger
        fi
        ;;
    *)
        exec $1
        ;;
esac
