# -*- coding: utf-8 -*-

# Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from importlib import import_module
import errno
import io
import os

import django
from django.conf import settings
from django.contrib.staticfiles.finders import BaseFinder
from django.contrib.staticfiles import utils
from django.core.files.storage import FileSystemStorage
from django.template import TemplateDoesNotExist
from django.template.base import Origin
from django.utils._os import safe_join
try:
    # Django 1.8+
    from django.template.loaders.base import Loader
except:
    # Django 1.7 and below
    from django.template.loader import BaseLoader as Loader
try:
    # Django 1.6+
    from django.core.exceptions import SuspiciousFileOperation
except:
    # Django 1.5 and below
    SuspiciousFileOperation = ValueError


DEFAULT_THEME = 'wirecloud.defaulttheme'


def get_active_theme_name():
    return getattr(settings, "THEME_ACTIVE", DEFAULT_THEME)


def active_theme_context_processor(request):
    return {'THEME_ACTIVE': get_active_theme_name()}


def get_theme_dir(theme, dir_type):
    active_theme_dir = os.path.dirname(os.path.abspath(theme.__file__))
    return safe_join(active_theme_dir, dir_type)


def get_theme_chain(theme_name=None):

    if theme_name is None:
        theme_name = get_active_theme_name()

    theme_chain = []
    while theme_name is not None:
        try:
            theme = import_module(theme_name)
        except ImportError:
            raise ValueError("%s is not a valid WireCloud theme" % theme_name)

        theme_chain.append(theme)

        # Next theme: theme parent
        theme_name = getattr(theme, "parent", DEFAULT_THEME)

    return theme_chain


class TemplateLoader(Loader):

    is_usable = True

    def __init__(self, *args, **kwargs):
        super(TemplateLoader, self).__init__(*args, **kwargs)

        self.theme_chain = get_theme_chain()
        self.template_dirs = [get_theme_dir(theme, 'templates') for theme in self.theme_chain]

    def get_contents(self, origin):

        try:
            with io.open(origin.name, encoding=settings.FILE_CHARSET) as fp:
                return fp.read()
        except IOError as e:
            if e.errno == errno.ENOENT:
                raise TemplateDoesNotExist(origin)
            raise

    def get_template_sources(self, template_name, template_dirs=None):
        for template_dir in self.template_dirs:
            try:
                filepath = safe_join(template_dir, template_name)
            except (SuspiciousFileOperation, ValueError):
                # The joined path was located outside of this template_dir
                # (it might be inside another one, so this isn't fatal).
                continue

            if django.VERSION[1] >= 9:
                yield Origin(
                    name=filepath,
                    template_name=template_name,
                    loader=self,
                )
            else:
                yield Origin(name=filepath)

    def load_template_source(self, template_name, template_dirs=None):
        for origin in self.get_template_sources(template_name):
            try:
                return self.get_contents(origin), origin.name
            except TemplateDoesNotExist:
                pass

        raise TemplateDoesNotExist(template_name)


class ActiveThemeFinder(BaseFinder):

    def __init__(self, apps=None, *args, **kwargs):
        self.theme_chain = get_theme_chain()
        self.staticfiles_dirs = [get_theme_dir(theme, 'static') for theme in self.theme_chain]

    def find(self, path, all=False):
        for staticfiles_dir in self.staticfiles_dirs:
            filename = safe_join(staticfiles_dir, path)
            if os.path.exists(filename):
                if all:
                    return [filename]
                else:
                    return filename

    def list(self, ignore_patterns=[]):
        for location in self.staticfiles_dirs:
            storage = FileSystemStorage(location=location)
            for path in utils.get_files(storage, ignore_patterns):
                yield path, storage
