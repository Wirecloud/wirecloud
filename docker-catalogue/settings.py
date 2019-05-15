# -*- coding: utf-8 -*-
# Django settings for wirecloud_instance project.

import os
from wirecloud.commons.utils.conf import load_default_wirecloud_conf
from django.core.urlresolvers import reverse_lazy

DEBUG = os.environ.get("DEBUG", "False").strip().lower() == "true"
BASEDIR = os.path.dirname(os.path.abspath(__file__))
DATADIR = os.path.join(BASEDIR, "..", "data")
load_default_wirecloud_conf(locals(), instance_type="catalogue")

USE_XSENDFILE = False

ADMINS = (
    # ('Your Name', 'your_email@example.com'),
)

MANAGERS = ADMINS

# We only support postgres and sqlite3 for now
if os.environ.get("DB_HOST", "").strip() != "":
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql_psycopg2',
            'NAME': os.environ.get("DB_NAME", "postgres"),
            'USER': os.environ.get("DB_USERNAME", "postgres"),
            'PASSWORD': os.environ.get("DB_PASSWORD", "postgres"),
            'HOST': os.environ["DB_HOST"],
            'PORT': os.environ.get("DB_PORT", "5432"),
        },
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(DATADIR, 'wirecloud.db'),
            'USER': '',
            'PASSWORD': '',
            'HOST': '',
            'PORT': '',
        },
    }


if "ELASTICSEARCH2_URL" in os.environ:
    HAYSTACK_CONNECTIONS = {
        'default': {
            'ENGINE': 'wirecloud.commons.haystack_backends.elasticsearch2_backend.Elasticsearch2SearchEngine',
            'URL': os.environ['ELASTICSEARCH2_URL'],
            'INDEX_NAME': 'wirecloud',
        },
    }
else:
    HAYSTACK_CONNECTIONS = {
        'default': {
            'ENGINE': 'wirecloud.commons.haystack_backends.whoosh_backend.WhooshEngine',
            'PATH': os.path.join(DATADIR, 'index'),
        },
    }

# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split()

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'America/Chicago'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# Absolute filesystem path to the directory that will hold user-uploaded files.
# Example: "/var/www/example.com/media/"
MEDIA_ROOT = ''

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash.
# Examples: "http://example.com/media/", "http://media.example.com/"
MEDIA_URL = ''

# Absolute path to the directory static files should be collected to.
# Don't put anything in this directory yourself; store your static files
# in apps' "static/" subdirectories and in STATICFILES_DIRS.
# Example: "/var/www/example.com/static/"
STATIC_ROOT = "/var/www/static"

# Controls the absolute file path that linked static will be read from and
# compressed static will be written to when using the default COMPRESS_STORAGE.
COMPRESS_ROOT = STATIC_ROOT

# URL prefix for static files.
# Example: "http://example.com/static/", "http://static.example.com/"
STATIC_URL = '/static/'

# Additional locations of static files
# STATICFILES_DIRS = (
#     # Put strings here, like "/home/html/static" or "C:/www/django/static".
#     # Always use forward slashes, even on Windows.
#     # Don't forget to use absolute paths, not relative paths.
# )

# List of finder classes that know how to find static files in
# various locations.
# STATICFILES_FINDERS += (
#     'django.contrib.staticfiles.finders.FileSystemFinder',
#     'django.contrib.staticfiles.finders.DefaultStorageFinder',
# )

# Make this unique, and don't share it with anybody.
SECRET_KEY = '4&0+qo=m4yk!7hohzh&xsw=i&g_7t88*-9_^j(xi!fzm9zz^7l'

ROOT_URLCONF = 'wirecloud_instance.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'wirecloud_instance.wsgi.application'

# FIWARE IdM configuration
FIWARE_IDM_SERVER = os.environ.get('FIWARE_IDM_SERVER', '').strip()
SOCIAL_AUTH_FIWARE_KEY = os.environ.get('SOCIAL_AUTH_FIWARE_KEY', '').strip()
SOCIAL_AUTH_FIWARE_SECRET = os.environ.get('SOCIAL_AUTH_FIWARE_SECRET', '').strip()
IDM_AUTH_ENABLED = FIWARE_IDM_SERVER and SOCIAL_AUTH_FIWARE_KEY and SOCIAL_AUTH_FIWARE_SECRET

if IDM_AUTH_ENABLED:
    INSTALLED_APPS += (
        'wirecloud.fiware',
        'social_django',
        'haystack',
    )
else:
    INSTALLED_APPS += (
        'wirecloud.oauth2provider',
        'wirecloud.fiware',
        'haystack',
    )

# Login/logout URLs
LOGIN_URL = reverse_lazy('login')
LOGOUT_URL = reverse_lazy('wirecloud.root')
LOGIN_REDIRECT_URL = reverse_lazy('wirecloud.root')

THEME_ACTIVE = os.environ.get("DEFAULT_THEME", "wirecloud.defaulttheme")
DEFAULT_LANGUAGE = 'browser'

# WGT deployment dirs
CATALOGUE_MEDIA_ROOT = os.path.join(DATADIR, 'catalogue_resources')
GADGETS_DEPLOYMENT_DIR = os.path.join(DATADIR, 'widget_files')

# Cache settings
CACHES = {
    "default": {}
}

if "MEMCACHED_LOCATION" in os.environ:
    CACHES['default'] = {
        'BACKEND': 'django.core.cache.backends.memcached.PyLibMCCache',
        'LOCATION': os.environ['MEMCACHED_LOCATION'],
    }
else:
    CACHES['default'] = {
        'BACKEND': 'wirecloud.platform.cache.backends.locmem.LocMemCache',
        'OPTIONS': {
            'MAX_ENTRIES': 3000,
        },
    }

NOT_PROXY_FOR = ['localhost', '127.0.0.1']

# Allow X-Forwarded-* headers on Django (they are filtered by gunicorn depending on the value of FORWARDED_ALLOW_IPS env var)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

# Auth configuration
if IDM_AUTH_ENABLED:
    AUTHENTICATION_BACKENDS = (
        'wirecloud.fiware.social_auth_backend.FIWAREOAuth2',
    )
else:
    AUTHENTICATION_BACKENDS = (
        'django.contrib.auth.backends.ModelBackend',
    )

DATA_UPLOAD_MAX_MEMORY_SIZE = 262144000

LOGGING['disable_existing_loggers'] = False
