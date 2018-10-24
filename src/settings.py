# -*- coding: utf-8 -*-
# Django settings used as base for developing wirecloud.

from os import path
import sys
from wirecloud.commons.utils.conf import load_default_wirecloud_conf
from django.core.urlresolvers import reverse_lazy

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
        'ENGINE': 'django.db.backends.sqlite3',      # Add 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
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
    'haystack',
)

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.whoosh_backend.WhooshEngine',
        'PATH': path.join(path.dirname(__file__), 'whoosh_index'),
    },
}

#HAYSTACK_CONNECTIONS = {
#    'default': {
#        'ENGINE': 'wirecloud.commons.haystack_backends.solr_backend.SolrEngine',
#        'URL': 'http://127.0.0.1:8983/solr'
#        # ...or for multicore...
#        # 'URL': 'http://127.0.0.1:8983/solr/mysite',
#    },
#}


#TEST_HAYSTACK_CONNECTIONS = {
#    'default': {
#        'ENGINE': 'wirecloud.commons.haystack_backends.elasticsearch2_backend.Elasticsearch2SearchEngine',
#        'URL': <'INDEX_URI'>,
#        'INDEX_NAME': 'wirecloud',
#    },
#}

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


#WIRECLOUD_SELENIUM_TEST_BROWSERS = {
#
#    # Old versions of Firefox can be found here:
#    # http://archive.mozilla.org/pub/mozilla.org/firefox/releases/
#
#    'Firefox': {
#        'CLASS': 'selenium.webdriver.Firefox',
#    },
#
#    # Download chrome driver from the following URL:
#    # https://sites.google.com/a/chromium.org/chromedriver/
#    # Old versions of chrome can be found here:
#    # http://google-chrome.en.uptodown.com/mac/old
#    'GoogleChrome': {
#        'CLASS': 'selenium.webdriver.Chrome',
#    },
#
#    # Download opera driver from the following URL:
#    # https://github.com/operasoftware/operachromiumdriver/releases
#    # Old versions of Opera can be found here:
#    # http://get.geo.opera.com.global.prod.fastly.net/pub/opera/
#
#    'Opera': {
#        'CLASS': 'selenium.webdriver.Opera',
#    },
#
#    # https://blog.codecentric.de/en/2015/02/selenium-webdriver-safari-8/
#    'Safari': {
#        'CLASS': 'selenium.webdriver.Safari',
#    },
#}
