# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#

# Django settings for mymem project.
from os import path
from django.core.urlresolvers import reverse_lazy
from django.utils.translation import ugettext_lazy as _

DEBUG = False
TEMPLATE_DEBUG = DEBUG
COMPRESS = not DEBUG
COMPRESS_OFFLINE = not DEBUG
USE_XSENDFILE = False

BASEDIR = path.dirname(path.abspath(__file__))
APPEND_SLASH = False

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

MANAGERS = ADMINS


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',  # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': path.join(BASEDIR, 'ezweb.db'),  # Or path to database file if using sqlite3.
        'USER': '',                              # Not used with sqlite3.
        'PASSWORD': '',                          # Not used with sqlite3.
        'HOST': '',                              # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                              # Set to empty string for default. Not used with sqlite3.
    },
}


#################################################################
# LOGGING
#################################################################
# 0 => no logging
# 1 => only access and errors
# 2 => access and arguments when exception
# 3 => access and arguments in every call
LOGGING_LEVEL = 2
#################################################################

THEME_ACTIVE = "defaulttheme"

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
    ('es', _('Spanish')),
    ('en', _('English')),
    ('pt', _('Portuguese')),
)

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = path.join(BASEDIR, 'media')

STATIC_URL = '/static/'
STATIC_ROOT = path.join(BASEDIR, 'static')
COMPRESS_ROOT = STATIC_ROOT
COMPRESS_OUTPUT_DIR = ''
COMPRESS_JS_FILTERS = (
    'compressor.filters.jsmin.JSMinFilter',
    'ezweb.compressor_filters.JSUseStrictFilter',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = '15=7f)g=)&spodi3bg8%&4fqt%f3rpg%b$-aer5*#a*(rqm79e'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'ezweb.themes.load_template_source',
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.gzip.GZipMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
#    'middleware.session_middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'middleware.http.ConditionalGetMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
#    'middleware.auth_middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.doc.XViewMiddleware',
    'middleware.console_middleware.ConsoleExceptionMiddleware',
 #   'middleware.cookie_redirect_middleware.CookieRedirectMiddleware',
)

ROOT_URLCONF = 'urls'

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'wirecloud',
    'ezweb',
    'gadget',
    'workspace',
    'igadget',
    'connectable',
    'catalogue',
    'context',
    'preferences',
    'translator',
    'user',
    'API',
    'uploader',
    'south',
    'compressor',
    'marketAdaptor',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.media',
    'django.core.context_processors.request',
    'django.core.context_processors.static',
    'ezweb.themes.active_theme_context_processor',
    'processors.context_processors.server_url',
    'processors.context_processors.is_anonymous',
    'processors.context_processors.tag_categories',
    'processors.context_processors.ezweb_organizations',
    'processors.context_processors.policy_lists',
)

STATICFILES_FINDERS = (
    'ezweb.themes.ActiveThemeFinder',
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',
)

SESSION_COOKIE_AGE = 5184000  # 2 months

SESSION_EXPIRE_AT_BROWSER_CLOSE = False

AUTH_PROFILE_MODULE = 'user.UserProfile'

# Login/logout URLs
LOGIN_URL = reverse_lazy('login')
LOGOUT_URL = reverse_lazy('wirecloud.root')
LOGIN_REDIRECT_URL = reverse_lazy('wirecloud.root')

FIXTURE_DIRS = (
    path.join(BASEDIR, 'fixtures', 'django.contrib.auth'),
    path.join(BASEDIR, 'fixtures', 'django.contrib.sites'),
)

# Set the log path
# When empty, defaults to MEDIA_ROOT/logs
#LOG_PATH='/var/log/ezweb'

#Authentication
AUTHENTICATION_BACKENDS = (
    #'authentication.tcloud_access.TCloudBackend',
    'authentication.public_access.PublicBackend',
    #'authentication.anonymousaccess.AnonymousBackend',
    #'authentication.ldapaccess.LDAPBackend',
    #'authentication.ezsteroidsaccess.EzSteroidsBackend',
    'django.contrib.auth.backends.ModelBackend',
)

#LDAP Backend
#AD_LDAP_URL = 'ldap://host:port'
#AD_SEARCH_DN = 'uid=%s,ou=OUExample,o=OExample'

# Authentication Server URL. This URL is only needed to allow the authentication against
# third parties. It must be used along with the corresponding authentication backend
#AUTHENTICATION_SERVER_URL = 'http://localhost:8001'


# Absolute path to the directory that holds in development gadgets.
GADGETS_ROOT = path.join(BASEDIR, 'media', 'gadgets')

# WGT deployment dirs
CATALOGUE_MEDIA_ROOT = path.join(BASEDIR, 'catalogue', 'media')
GADGETS_DEPLOYMENT_DIR = path.join(BASEDIR, 'deployment', 'gadgets')
GADGETS_DEPLOYMENT_TMPDIR = path.join(BASEDIR, 'deployment', 'tmp')

# URL prefix in order to complete gadget relative URL
#DOMAIN_FOR_GADGETS_LINKED_WITH_RELATIVE_URLS = 'http://mac.hi.inet'

CERTIFICATION_ENABLED = False

#SESSION_COOKIE_DOMAIN = '.domain'

# Cache settings
CACHES = {
    'default': {
        'BACKEND': 'wirecloud.cache.backends.locmem.LocMemCache',
        'OPTIONS': {
            'MAX_ENTRIES': 3000,
        },
    }
}
JOHNNY_MIDDLEWARE_KEY_PREFIX = '%s-cache' % DATABASES['default']['NAME']

WORKSPACE_MANAGERS = (
    'workspace.workspace_managers.OrganizationWorkspaceManager',
)

# Template Generator URL. This URL is only needed to allow publishing
# a Workspace when Wirecloud is running with the develop server (manage.py)
# PLEASE DON'T SET ITS VALUE IN ANY OTHER CASE.

#TEMPLATE_GENERATOR_URL = 'http://localhost:8001'


# Gadget Template Generator URL. This URL is only needed to allow creating
# a Gadget when Wirecloud is running with the develop server (manage.py)
# or if this application is moved to another server
# PLEASE DON'T SET ITS VALUE IN ANY OTHER CASE.
#GADGET_GENERATOR_URL = 'http://localhost:9001'

FORCE_SCRIPT_NAME = ""

NOT_PROXY_FOR = ['localhost', '127.0.0.1']

PROXY_PROCESSORS = (
#    'proxy.processors.FixServletBugsProcessor',
    'proxy.processors.SecureDataProcessor',
)

# External settings configuration
try:
    from local_settings import *  # pyflakes:ignore
except ImportError:
    pass
