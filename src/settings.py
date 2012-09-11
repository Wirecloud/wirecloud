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
from commons.urlresolvers import reverse_lazy
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
        'ENGINE': 'django.db.backends.sqlite3',      # Add 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': path.join(BASEDIR, 'wirecloud.db'),  # Or path to database file if using sqlite3.
        'TEST_NAME': path.join(BASEDIR, 'test_wirecloud.db'),
        'USER': '',                                  # Not used with sqlite3.
        'PASSWORD': '',                              # Not used with sqlite3.
        'HOST': '',                                  # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                                  # Set to empty string for default. Not used with sqlite3.
    },
}

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

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

STATIC_URL = '/static/'
STATIC_ROOT = path.join(BASEDIR, 'static')
COMPRESS_ROOT = STATIC_ROOT
COMPRESS_OUTPUT_DIR = 'cache'
COMPRESS_JS_FILTERS = (
    'compressor.filters.jsmin.JSMinFilter',
    'wirecloud.compressor_filters.JSUseStrictFilter',
)

# Make this unique, and don't share it with anybody.
SECRET_KEY = '15=7f)g=)&spodi3bg8%&4fqt%f3rpg%b$-aer5*#a*(rqm79e'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'wirecloud.themes.load_template_source',
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.gzip.GZipMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'middleware.http.ConditionalGetMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.doc.XViewMiddleware',
)

ROOT_URLCONF = 'urls'

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.admin',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'wirecloudcommons',
    'wirecloud',
    'catalogue',
    'south',
    'compressor',
    'marketAdaptor',
    'wirecloud_fiware',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.contrib.auth.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.media',
    'django.core.context_processors.request',
    'django.core.context_processors.static',
    'wirecloud.themes.active_theme_context_processor',
    'wirecloudcommons.context_processors.is_anonymous',
    'wirecloudcommons.context_processors.tag_categories',
    'wirecloudcommons.context_processors.ezweb_organizations',
)

STATICFILES_FINDERS = (
    'wirecloud.themes.ActiveThemeFinder',
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',
)

SESSION_COOKIE_AGE = 5184000  # 2 months

SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Login/logout URLs
LOGIN_URL = reverse_lazy('login')
LOGOUT_URL = reverse_lazy('wirecloud.root')
LOGIN_REDIRECT_URL = reverse_lazy('wirecloud.root')

# Set the log path
# When empty, defaults to MEDIA_ROOT/logs
#LOG_PATH='/var/log/ezweb'

#Authentication
AUTHENTICATION_BACKENDS = (
    'django.contrib.auth.backends.ModelBackend',
)

# WGT deployment dirs
CATALOGUE_MEDIA_ROOT = path.join(BASEDIR, 'catalogue', 'media')
GADGETS_DEPLOYMENT_DIR = path.join(BASEDIR, 'deployment', 'widgets')
GADGETS_DEPLOYMENT_TMPDIR = path.join(BASEDIR, 'deployment', 'tmp')

# URL prefix in order to complete widget relative URL
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
    'wirecloud.workspace.workspace_managers.OrganizationWorkspaceManager',
)

WIRECLOUD_PLUGINS = (
    'wirecloud_fiware.plugins.FiWarePlugin',
)

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
