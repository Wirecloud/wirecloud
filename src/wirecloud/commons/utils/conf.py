# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

    settings['TEMPLATE_DEBUG'] = settings['DEBUG']
    settings['COMPRESS'] = not settings['DEBUG']
    settings['COMPRESS_OFFLINE'] = True
    settings['APPEND_SLASH'] = False
    settings['COMPRESS_OUTPUT_DIR'] = 'cache'

    settings['USE_TZ'] = True

    settings['INSTALLED_APPS'] = (
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'django.contrib.admin',
        'wirecloud.commons',
        'south',
        'compressor',
    )

    if instance_type == 'catalogue':
        settings['INSTALLED_APPS'] += (
            'wirecloud.catalogue',
        )
    elif instance_type == 'platform':
        settings['INSTALLED_APPS'] += (
            'wirecloud.catalogue',
            'wirecloud.platform',
        )

    settings['TEMPLATE_LOADERS'] = (
        'wirecloud.platform.themes.load_template_source',
        'django.template.loaders.app_directories.Loader',
    )

    settings['MIDDLEWARE_CLASSES'] = (
        'wirecloud.commons.middleware.URLMiddleware',
    )

    settings['URL_MIDDLEWARE_CLASSES'] = {
        'default': (
            'django.middleware.gzip.GZipMiddleware',
            'django.middleware.common.CommonMiddleware',
            'django.contrib.sessions.middleware.SessionMiddleware',
            'django.middleware.locale.LocaleMiddleware',
            'wirecloud.commons.middleware.ConditionalGetMiddleware',
            'django.contrib.auth.middleware.AuthenticationMiddleware',
            'django.contrib.messages.middleware.MessageMiddleware',
        ),
        'api': (
            'django.middleware.gzip.GZipMiddleware',
            'django.middleware.common.CommonMiddleware',
            'django.contrib.sessions.middleware.SessionMiddleware',
            'django.middleware.locale.LocaleMiddleware',
            'wirecloud.commons.middleware.ConditionalGetMiddleware',
            'wirecloud.commons.middleware.AuthenticationMiddleware',
        ),
        'proxy': (
            'django.contrib.sessions.middleware.SessionMiddleware',
            'django.contrib.auth.middleware.AuthenticationMiddleware',
        )
    }

    settings['STATICFILES_FINDERS'] = (
        'wirecloud.platform.themes.ActiveThemeFinder',
        'django.contrib.staticfiles.finders.AppDirectoriesFinder',
        'compressor.finders.CompressorFinder',
    )

    settings['TEMPLATE_CONTEXT_PROCESSORS'] = (
        'django.contrib.auth.context_processors.auth',
        'django.core.context_processors.debug',
        'django.core.context_processors.i18n',
        'django.core.context_processors.media',
        'django.core.context_processors.request',
        'django.core.context_processors.static',
        'django.core.context_processors.tz',
        'django.contrib.messages.context_processors.messages',
        'wirecloud.platform.themes.active_theme_context_processor',
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
            }
        },
        'handlers': {
            'console':{
                'level': 'INFO',
                'filters': ['require_debug_true'],
                'class': 'logging.StreamHandler',
            },
            'null': {
                'class': 'django.utils.log.NullHandler',
            },
            'mail_admins': {
                'level': 'ERROR',
                'filters': ['require_debug_false'],
                'class': 'django.utils.log.AdminEmailHandler'
            }
        },
        'loggers': {
            'django': {
                'handlers': ['console'],
            },
            'django.request': {
                'handlers': ['console', 'mail_admins'],
                'level': 'ERROR',
                'propagate': False,
            },
            'py.warnings': {
                'handlers': ['console'],
            },
            'rdflib': {
                'handlers': ['console'],
            },
        }
    }

    settings['NOSE_ARGS'] = NoseArgs(instance_type)
