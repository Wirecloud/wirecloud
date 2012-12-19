# Copyright 2011 Yaco Sistemas <lgs@yaco.es>
#
# This file is part of EzWeb.

# EzWeb is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# EzWeb is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with EzWeb.  If not, see <http://www.gnu.org/licenses/>.

# This code is inspired/stolen from the Merengue
# project (www.merengueproject.org)

import os

from django.conf import settings
from django.contrib.staticfiles.finders import BaseFinder
from django.contrib.staticfiles import utils
from django.core.files.storage import FileSystemStorage
from django.template import TemplateDoesNotExist
from django.utils.importlib import import_module
from django.utils._os import safe_join

DEFAULT_THEME = 'wirecloud.defaulttheme'


def get_active_theme_name():
    try:
        return settings.THEME_ACTIVE
    except AttributeError:
        return DEFAULT_THEME


def active_theme_context_processor(request):
    return {'THEME_ACTIVE': get_active_theme_name()}


def get_theme_dir(theme_name, dir_type):
    try:
        active_theme_module = import_module(theme_name)
    except ImportError:
        return

    active_theme_file = active_theme_module.__file__
    active_theme_dir = os.path.dirname(os.path.abspath(active_theme_file))
    return safe_join(active_theme_dir, dir_type)


def get_template_sources(template_name, template_dirs=None):
    """
    Look for template into active theme directory
    """

    def try_template(templates_dir):
        if templates_dir and os.path.isdir(templates_dir):
            try:
                return safe_join(templates_dir, template_name)
            except UnicodeDecodeError:
                raise
            except ValueError:
                pass

    active_theme_source = try_template(get_theme_dir(get_active_theme_name(), 'templates'))
    if active_theme_source:
        yield active_theme_source

    yield try_template(get_theme_dir(DEFAULT_THEME, 'templates'))


def load_template_source(template_name, template_dirs=None):
    tried = []
    for filepath in get_template_sources(template_name, template_dirs):
        try:
            return (open(filepath).read().decode(settings.FILE_CHARSET), filepath)
        except IOError:
            tried.append(filepath)
    if tried:
        error_msg = "Tried %s" % tried
    else:
        error_msg = "Your TEMPLATE_DIRS setting is empty. Change it to point to at least one template directory."
    raise TemplateDoesNotExist(error_msg)
load_template_source.is_usable = True


class ActiveThemeFinder(BaseFinder):

    def __init__(self, apps=None, *args, **kwargs):
        self.active_theme = get_active_theme_name()
        self.active_theme_location = get_theme_dir(self.active_theme, 'static')
        self.default_theme_location = get_theme_dir(DEFAULT_THEME, 'static')

    def find(self, path, all=False):
        matches = []
        filename = safe_join(self.active_theme_location, path)
        if os.path.exists(filename):
            if all:
                matches.append(filename)
            else:
                return filename

        new_path = path.replace(self.active_theme, DEFAULT_THEME, 1)
        filename = safe_join(self.default_theme_location, new_path)
        if os.path.exists(filename):
            if all:
                matches.append(filename)
            else:
                return filename

        return matches

    def list(self, ignore_patterns=[]):
        for location in (self.active_theme_location,
                         self.default_theme_location):
            storage = FileSystemStorage(location=location)
            for path in utils.get_files(storage, ignore_patterns):
                yield path, storage
