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
        ;;
    createdefaultsuperuser)
        echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', 'admin')" | manage.py shell > /dev/null
        ;;
    createsuperuser)
        manage.py createsuperuser
        ;;
    *)
        manage.py collectstatic --noinput
        manage.py migrate --fake-initial

        # allow the container to be started with `--user`
        if [ "$(id -u)" = '0' ]; then
            gosu wirecloud /usr/local/bin/gunicorn wirecloud_instance.wsgi:application --forwarded-allow-ips "${FORWARDED_ALLOW_IPS}" -w 2 -b :8000 --log-file - --log-level ${LOGLEVEL} --capture-output
        else
            /usr/local/bin/gunicorn wirecloud_instance.wsgi:application --forwarded-allow-ips "${FORWARDED_ALLOW_IPS}" -w 2 -b :8000 --log-file - --log-level ${LOGLEVEL} --capture-output
        fi
        ;;
esac
