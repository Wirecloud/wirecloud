FROM python:3.6-stretch

MAINTAINER WireCloud Team <wirecloud@conwet.com>

ENV LOGLEVEL=info
ENV DEFAULT_THEME=wirecloud.defaulttheme
ENV FORWARDED_ALLOW_IPS=*
ENV DB_HOST=
ENV DB_PORT=5432

RUN apt-get update && \
    apt-get install -y libmemcached-dev gosu && \
    pip install --no-cache-dir social-auth-app-django "gunicorn==19.9.0" "psycopg2==2.6" pylibmc pysolr "elasticsearch==2.4.1" && \
    rm -rf /var/lib/apt/lists/* && \
    gosu nobody true

# Install WireCloud & dependencies
COPY . /wirecloud
RUN apt-get update && apt-get install -y gettext && \
    pip install "django<=1.11" && \
    cd wirecloud/src && \
    python setup.py bdist_wheel && \
    pip install --no-cache-dir "regex==2019.02.18" dist/*.whl && \
    cd / && \
    rm -rf /wirecloud && \
    apt-get remove -y gettext && \
    rm -rf /var/lib/apt/lists/*

COPY docker-catalogue/docker-entrypoint.sh /
COPY docker-catalogue/manage.py /usr/local/bin/

RUN adduser --system --group --shell /bin/bash wirecloud && \
    pip install --no-cache-dir channels asgi_ipc asgi_redis asgi_rabbitmq && \
    mkdir -p /opt/wirecloud_instance /var/www/static && \
    cd /opt && \
    wirecloud-admin startproject wirecloud_instance wirecloud_instance && \
    chown -R wirecloud:wirecloud wirecloud_instance /var/www/static && \
    chmod a+x wirecloud_instance/manage.py

COPY docker-catalogue/settings.py docker-catalogue/urls.py /opt/wirecloud_instance/wirecloud_instance/

WORKDIR /opt/wirecloud_instance

# volumes must be created after running the collectstatic command
VOLUME /var/www/static
VOLUME /opt/wirecloud_instance/data

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
