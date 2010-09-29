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
from django.utils.translation import ugettext_lazy as _

DEBUG = True
TEMPLATE_DEBUG = DEBUG

BASEDIR = path.dirname(path.abspath(__file__))
APPEND_SLASH = False

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

MANAGERS = ADMINS


DATABASE_ENGINE = 'sqlite3'    # 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
DATABASE_NAME = path.join(BASEDIR, 'ezweb.db')     # Or full path to database file if using sqlite3.
DATABASE_USER = ''             # Not used with sqlite3.
DATABASE_PASSWORD = ''         # Not used with sqlite3.
DATABASE_HOST = ''             # Set to empty string for localhost. Not used with sqlite3.
DATABASE_PORT = ''             # Set to empty string for default. Not used with sqlite3.


#################################################################
# LOGGING
#################################################################
# 0 => no logging
# 1 => only access and errors
# 2 => access and arguments when exception
# 3 => access and arguments in every call
LOGGING_LEVEL = 2
#################################################################

LAYOUT = "classic"

#HOME_GATEWAY_DISPATCHER_URL = "http://localhost:8001/hgwDispatcher/"

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

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/ezweb/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = '15=7f)g=)&spodi3bg8%&4fqt%f3rpg%b$-aer5*#a*(rqm79e'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.app_directories.load_template_source',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
#    'middleware.session_middleware.SessionMiddleware',
#    'facebook.djangofb.FacebookMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
#    'middleware.auth_middleware.AuthenticationMiddleware',
    'django.middleware.doc.XViewMiddleware',
    'middleware.console_middleware.ConsoleExceptionMiddleware',
 #   'middleware.cookie_redirect_middleware.CookieRedirectMiddleware',
 #   'facebookconnect.middleware.FacebookConnectMiddleware',

)

ROOT_URLCONF = 'urls'

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'ezweb',
    'gadget',
    'workspace',
    'igadget',
    'connectable',
    'catalogue',
    'context',
    'preferences',
    'translator',
    'gadgetGenerator',
    'resourceSubscription',
    'remoteChannel',
    'user',
    'API',
    'uploader',
    'layout',
    ### openid authentication ###
#    'openid_auth',
#    'openid_auth.django_openidconsumer',
    # sign in with twitter app 
#    'twitterauth',
    ### facebook applications ###
#    'facebook',
#    'facebookconnect',
#   'clms',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.media',
    'django.core.context_processors.request',
    'processors.context_processors.home_gateway_url',
    'processors.context_processors.server_url',
    'processors.context_processors.is_anonymous',
    'processors.context_processors.only_one_js_file',
    'processors.context_processors.only_one_css_file',
    'processors.context_processors.ezweb_release',
    'processors.context_processors.tag_categories',
    'processors.context_processors.skins',
    'processors.context_processors.installed_apps',
    'processors.context_processors.remote_channels_enabled',
    'processors.context_processors.ezweb_organizations',
    'processors.context_processors.policy_lists',
)

SESSION_COOKIE_AGE = 5184000    #2 months

SESSION_EXPIRE_AT_BROWSER_CLOSE = False

AUTH_PROFILE_MODULE = 'user.UserProfile'

# URLs aftetr login and logout
LOGOUT_URL = '/'
LOGIN_REDIRECT_URL = '/'

# Set the log path
# When empty, defaults to MEDIA_ROOT/logs
#LOG_PATH='/var/log/ezweb'

#Authentication
AUTHENTICATION_BACKENDS = (  
#'authentication.tcloud_access.TCloudBackend',
'authentication.public_access.PublicBackend',
#'authentication.anonymousaccess.AnonymousBackend',
#'openid_auth.models.OpenIDBackend',
#'authentication.ldapaccess.LDAPBackend',
'authentication.ezsteroidsaccess.EzSteroidsBackend',
'django.contrib.auth.backends.ModelBackend',
#'facebookconnect.models.FacebookBackend',
#'authentication.twitteroauth.TwitterBackend',
)

#LDAP Backend
#AD_LDAP_URL = 'ldap://host:port'
#AD_SEARCH_DN = 'uid=%s,ou=OUExample,o=OExample'

# Authentication Server URL. This URL is only needed to allow the authentication against
# third parties. It must be used along with the corresponding authentication backend
#AUTHENTICATION_SERVER_URL = 'http://localhost:8001'


# Absolute path to the directory that holds in development gadgets.
GADGETS_ROOT = path.join(BASEDIR, 'deployment', 'gadgets')
GADGETS_DEPLOYMENT_TMPDIR = path.join(BASEDIR, 'deployment', 'tmp')

# URL prefix in order to complete gadget relative URL
#DOMAIN_FOR_GADGETS_LINKED_WITH_RELATIVE_URLS = 'http://mac.hi.inet'

CERTIFICATION_ENABLED = False

#SESSION_COOKIE_DOMAIN = '.domain'

# Template Generator URL. This URL is only needed to allow publishing
# a Workspace when EzWeb is running with the develop server (manage.py)
# PLEASE DON'T SET ITS VALUE IN ANY OTHER CASE.

#TEMPLATE_GENERATOR_URL = 'http://localhost:8001'


# Gadget Template Generator URL. This URL is only needed to allow creating
# a Gadget when EzWeb is running with the develop server (manage.py)
# or if this application is moved to another server
# PLEASE DON'T SET ITS VALUE IN ANY OTHER CASE.
#GADGET_GENERATOR_URL = 'http://localhost:9001'

FORCE_SCRIPT_NAME=""

# Compact ezweb javascript and/or css files into one single file. If set to True,
# you must set the EZWEB_RELEASE property to generate a versioned .js file
#ONLY_ONE_JS_FILE=True
#ONLY_ONE_CSS_FILE=True
#EZWEB_RELEASE='2603'

# Remote channels notifier
#REMOTE_CHANNEL_NOTIFIER_URL = 'http://localhost:8888/notifier/channels/notify'

NOT_PROXY_FOR = ['localhost', '127.0.0.1']


#Open Id providers. Uncomment this if you only allow certain providers to authenticate users.
#OPENID_PROVIDERS = ["myopenid.com", "google.com"]


#################################
##### Facebook Connect data #####
#################################

# To enable Facebook Connect authentication in EzWeb (having your application set up in Facebook) you must:
#    1. Enable the facebook and facebookconnect applications
#    2. Enable the Middlewares (facebook.djangofb.FacebookMiddleware, facebookconnect.middleware.FacebookConnectMiddleware)
#    3. Enable the backend facebookconnect.models.FacebookBackend
#    4. Uncomment the following constants and configure the keys: FACEBOOK_API_KEY and FACEBOOK_SECRET_KEY
#    5. Uncomment the sections of the login templates (change # with %}. These sections are:
#        * {# load facebook_tags #}
#        * {# facebook_js #}
#        * {# initialize_facebook_connect #}
#        * {# show_connect_button #}
#FACEBOOK_API_KEY = "YOUR API KEY FROM FACEBOOK"
#FACEBOOK_SECRET_KEY = "YOUR SECRET KEY FROM FACEBOOK"
#FACEBOOK_INTERNAL = True
#FACEBOOK_CACHE_TIMEOUT = 1800

#################################

#Authentication against Twitter (Sign in with twitter)
#TWITTER_CONSUMER_KEY = "YOUR CONSUMER KEY FROM TWITTER"
#TWITTER_CONSUMER_SECRET = "YOUR CONSUMER SECRET FROM TWITTER"


# External settings configuration
try:
    from clms.settings import *
except ImportError:
    pass

try:
    from local_settings import *
except ImportError:
    pass
