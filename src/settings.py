# -*- coding: utf-8 -*-
# Django settings used as base for developing wirecloud.

from os import path
from wirecloud.commons.utils.conf import load_default_wirecloud_conf
from wirecloud.commons.utils.urlresolvers import reverse_lazy

DEBUG = True
BASEDIR = path.dirname(path.abspath(__file__))
load_default_wirecloud_conf(locals())

USE_XSENDFILE = False


ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',      # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': path.join(BASEDIR, 'wirecloud.db'),  # Or path to database file if using sqlite3.
        'USER': '',                                  # Not used with sqlite3.
        'PASSWORD': '',                              # Not used with sqlite3.
        'HOST': '',                                  # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                                  # Set to empty string for default. Not used with sqlite3.
    },
}

# This setting has only effect in DJango 1.5+
# Hosts/domain names that are valid for this site; required if DEBUG is False
# See https://docs.djangoproject.com/en/1.5/ref/settings/#allowed-hosts
ALLOWED_HOSTS = ['*']

THEME_ACTIVE = "wirecloud.defaulttheme"

# Local time zone for this installation. Choices can be found here:
# http://www.postgresql.org/docs/8.1/static/datetime-keywords.html#DATETIME-TIMEZONE-SET-TABLE
# although not all variations may be possible on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Europe/Madrid'
DATE_FORMAT = 'd/m/Y'

# Language code for this installation. All choices can be found here:
# http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
LANGUAGE_CODE = 'en'
DEFAULT_LANGUAGE = 'browser'

LANGUAGES = (
    ('es', 'Spanish'),
    ('en', 'English'),
    ('pt', 'Portuguese'),
)

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

STATIC_URL = '/static/'
STATIC_ROOT = path.join(BASEDIR, 'static')
COMPRESS_ROOT = STATIC_ROOT
COMPRESS_OUTPUT_DIR = 'cache'
COMPRESS_JS_FILTERS = (
    'compressor.filters.jsmin.JSMinFilter',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = '15=7f)g=)&spodi3bg8%&4fqt%f3rpg%b$-aer5*#a*(rqm79e'

ROOT_URLCONF = 'urls'

INSTALLED_APPS += (
    'wirecloud.oauth2provider',
    'wirecloud.fiware',
    'django_nose',
)
TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

SESSION_COOKIE_AGE = 5184000  # 2 months

SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Login/logout URLs
LOGIN_URL = reverse_lazy('login')
LOGOUT_URL = reverse_lazy('wirecloud.root')
LOGIN_REDIRECT_URL = reverse_lazy('wirecloud.root')

#Authentication
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
)

# WGT deployment dirs
CATALOGUE_MEDIA_ROOT = path.join(BASEDIR, 'catalogue', 'media')
GADGETS_DEPLOYMENT_DIR = path.join(BASEDIR, 'deployment', 'widgets')

#SESSION_COOKIE_DOMAIN = '.domain'

# Cache settings
CACHES = {
    'default': {
        'BACKEND': 'wirecloud.platform.cache.backends.locmem.LocMemCache',
        'OPTIONS': {
            'MAX_ENTRIES': 3000,
        },
    }
}

FORCE_SCRIPT_NAME = ""
