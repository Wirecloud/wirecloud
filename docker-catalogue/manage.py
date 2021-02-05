#!/usr/bin/env bash
cd /opt/wirecloud_instance
if [ "$(id -u)" = '0' ]; then
    gosu wirecloud python manage.py $@
else
    python manage.py $@
fi
