# -*- coding: utf-8 -*-

# Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import os
import sys

from django.core.urlresolvers import reverse_lazy


BASE_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin',
    'wirecloud.commons',
    'compressor',
)


class NoseArgs(object):

    def __init__(self, instance_type):
        self._instance_type = instance_type

    def __iter__(self):

        import wirecloud.catalogue
        import wirecloud.commons
        import wirecloud.platform
        from wirecloud.platform.plugins import get_plugins

        NOSE_ARGS = [os.getcwd()]
        NOSE_ARGS.append(os.path.dirname(wirecloud.commons.__file__))
        if self._instance_type == 'platform':
            NOSE_ARGS.append(os.path.dirname(wirecloud.catalogue.__file__))
            NOSE_ARGS.append(os.path.dirname(wirecloud.platform.__file__))
        elif self._instance_type == 'catalogue':
            NOSE_ARGS.append(os.path.dirname(wirecloud.catalogue.__file__))

        for plugin in get_plugins():
            plugin_path = os.path.dirname(sys.modules[plugin.__module__].__file__)
            NOSE_ARGS.append(plugin_path)

        return NOSE_ARGS.__iter__()


def load_default_wirecloud_conf(settings, instance_type='platform'):

    if 'DEBUG' not in settings:
        settings['DEBUG'] = False

    settings['APPEND_SLASH'] = False

    settings['COMPRESS_ENABLED'] = not settings['DEBUG']
    settings['COMPRESS_OFFLINE'] = False
    settings['COMPRESS_OUTPUT_DIR'] = 'cache'
    settings['COMPRESS_PRECOMPILERS'] = (
        ('text/x-scss', 'wirecloud.commons.compressor_precompilers.SCSSPrecompiler'),
    )
    settings['ALLOW_ANONYMOUS_ACCESS'] = True
    settings['WIRECLOUD_HTTPS_VERIFY'] = True
    settings['WIRECLOUD_REMOVE_UNSUPPORTED_RESOURCES_MIGRATION'] = False

    settings['USE_TZ'] = True

    settings['INSTALLED_APPS'] = BASE_APPS

    if instance_type == 'catalogue':
        settings['INSTALLED_APPS'] += (
            'wirecloud.catalogue',
        )
    elif instance_type == 'platform':
        settings['INSTALLED_APPS'] += (
            'wirecloud.catalogue',
            'wirecloud.platform',
        )

    settings['TEMPLATES'] = [
        {
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'OPTIONS': {
                'context_processors': (
                    'django.contrib.auth.context_processors.auth',
                    'django.template.context_processors.debug',
                    'django.template.context_processors.i18n',
                    'django.template.context_processors.request',
                    'django.template.context_processors.static',
                    'django.template.context_processors.tz',
                    'django.contrib.messages.context_processors.messages',
                    'wirecloud.platform.context_processors.plugins',
                    'wirecloud.platform.context_processors.active_theme',
                ),
                'debug': settings['DEBUG'],
                'loaders': (
                    'wirecloud.platform.themes.TemplateLoader',
                    'django.template.loaders.app_directories.Loader',
                )
            }
        }
    ]

    settings['MIDDLEWARE_CLASSES'] = (
        'wirecloud.commons.middleware.URLMiddleware',
    )

    settings['URL_MIDDLEWARE_CLASSES'] = {
        'default': (
            'django.middleware.security.SecurityMiddleware',
            'django.contrib.sessions.middleware.SessionMiddleware',
            'wirecloud.commons.middleware.ConditionalGetMiddleware',
            'django.middleware.common.CommonMiddleware',
            'django.middleware.gzip.GZipMiddleware',
            'django.middleware.locale.LocaleMiddleware',
            'django.contrib.auth.middleware.AuthenticationMiddleware',
            'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
            'django.contrib.messages.middleware.MessageMiddleware',
        ),
        'api': (
            'django.middleware.security.SecurityMiddleware',
            'django.contrib.sessions.middleware.SessionMiddleware',
            'wirecloud.commons.middleware.ConditionalGetMiddleware',
            'django.middleware.common.CommonMiddleware',
            'django.middleware.gzip.GZipMiddleware',
            'django.middleware.locale.LocaleMiddleware',
            'wirecloud.commons.middleware.AuthenticationMiddleware',
            'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
        ),
        'proxy': (
            'django.middleware.security.SecurityMiddleware',
            'django.contrib.sessions.middleware.SessionMiddleware',
            'django.contrib.auth.middleware.AuthenticationMiddleware',
            'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
        )
    }

    settings['STATICFILES_FINDERS'] = (
        'wirecloud.platform.themes.ActiveThemeFinder',
        'django.contrib.staticfiles.finders.AppDirectoriesFinder',
        'compressor.finders.CompressorFinder',
    )

    settings['LOGGING'] = {
        'version': 1,
        'disable_existing_loggers': True,
        'filters': {
            'require_debug_false': {
                '()': 'django.utils.log.RequireDebugFalse'
            },
            'require_debug_true': {
                '()': 'wirecloud.commons.utils.log.RequireDebugTrue'
            },
            'skip_unreadable_posts': {
                '()': 'wirecloud.commons.utils.log.SkipUnreadablePosts',
            }
        },
        'handlers': {
            'console': {
                'level': 'INFO',
                'filters': ['require_debug_true'],
                'class': 'logging.StreamHandler',
            },
            'null': {
                'class': 'logging.NullHandler',
            },
            'mail_admins': {
                'level': 'ERROR',
                'filters': ['require_debug_false', 'skip_unreadable_posts'],
                'class': 'django.utils.log.AdminEmailHandler'
            }
        },
        'loggers': {
            '': {
                'handlers': ['console'],
            },
            'django.request': {
                'handlers': ['console', 'mail_admins'],
                'level': 'ERROR',
                'propagate': False,
            },
        }
    }

    settings['LOGIN_REDIRECT_URL'] = reverse_lazy('wirecloud.root')
    settings['LOGOUT_REDIRECT_URL'] = reverse_lazy('wirecloud.root')

    # Haystack
    settings['HAYSTACK_CONNECTIONS'] = {
        'default': {
            'ENGINE': 'wirecloud.commons.haystack_backends.whoosh_backend.WhooshEngine',
            'PATH': os.path.join(settings['BASEDIR'], 'index'),
        },
    }
    settings['HAYSTACK_SIGNAL_PROCESSOR'] = 'wirecloud.commons.signals.WirecloudSignalProcessor'

    # Component storage
    settings['CATALOGUE_MEDIA_ROOT'] = os.path.join(settings['BASEDIR'], 'catalogue', 'media')
    settings['GADGETS_DEPLOYMENT_DIR'] = os.path.join(settings['BASEDIR'], 'deployment', 'widgets')

    # Testing
    settings['NOSE_ARGS'] = NoseArgs(instance_type)
