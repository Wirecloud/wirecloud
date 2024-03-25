# syntax=docker/dockerfile:1
ARG WIRECLOUD_PYTHON_VERSION=3.10
ARG WIRECLOUD_DEBIAN_VERSION=bookworm

FROM python:${WIRECLOUD_PYTHON_VERSION}-${WIRECLOUD_DEBIAN_VERSION} as builder

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends gettext npm

COPY src /wirecloud/src
#README.md is needed to build the wheel
COPY README.md /wirecloud/

# Build WireCloud wheel
WORKDIR /wirecloud/src
#Build needs npm to build monaco editor
RUN --mount=type=cache,target=/root/.cache/pip,sharing=locked \
    --mount=type=cache,target=node_modules/.cache,sharing=locked \
    python3 setup.py bdist_wheel

FROM python:${WIRECLOUD_PYTHON_VERSION}-slim-${WIRECLOUD_DEBIAN_VERSION}

ARG WIRECLOUD_PYTHON_VERSION
ENV FORWARDED_ALLOW_IPS=* \
    DB_PORT=5432 \
    LOGLEVEL=info \
    LOGFORMAT=plain \
    WORKERS=2 \
    THREADS=8 \
    #PIP_NO_CACHE_DIR=off \
    DJANGO_SETTINGS_MODULE=wirecloud_instance.settings

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends libpq-dev libmemcached-dev libpcre3-dev gosu ca-certificates curl gcc && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install WireCloud & dependencies
# Mount the wheel file from the builder stage
RUN --mount=type=bind,from=builder,source=/wirecloud/src/dist/,target=/dist/ \
    --mount=type=cache,target=/root/.cache/pip,sharing=locked \
    pip install /dist/*.whl \ 
    social-auth-app-django "gunicorn==21.2" "psycopg2==2.8.6" pylibmc pysolr "elasticsearch==2.4.1" \
    "regex==2019.02.18" "channels<2.3" "channels-redis" "wirecloud-keycloak>=0.3.0" "whitenoise" && \
    pip uninstall selenium -y

RUN adduser --system --group --shell /bin/bash wirecloud && \
    mkdir -p /opt/wirecloud_instance /var/www/static

COPY docker-platform/docker-entrypoint.sh /
COPY docker-platform/manage.py /usr/local/bin/

WORKDIR /opt
RUN wirecloud-admin startproject wirecloud_instance wirecloud_instance && \
    chown -R wirecloud:wirecloud wirecloud_instance /var/www/static && \
    chmod a+x wirecloud_instance/manage.py  && \
    chmod a+x /docker-entrypoint.sh

COPY docker-platform/settings.py docker-platform/urls.py /opt/wirecloud_instance/wirecloud_instance/
COPY docker-platform/glogger.py /usr/local/lib/python${WIRECLOUD_PYTHON_VERSION}/site-packages/wirecloud/
WORKDIR /opt/wirecloud_instance

#Add whitenoise to the wsgi.py file to serve static files
RUN echo '\nfrom whitenoise import WhiteNoise\napplication = WhiteNoise(application, root = "\/var\/www\/static", prefix="static\/", autorefresh=True)' >> wirecloud_instance/wsgi.py

VOLUME /var/www/static
VOLUME /opt/wirecloud_instance/data

EXPOSE 8000

HEALTHCHECK --interval=5s \
    --start-period=120s \
    CMD curl --fail http://localhost:8000/api/features || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["gunicorn"]