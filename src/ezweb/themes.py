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
from django.template import TemplateDoesNotExist
from django.utils._os import safe_join

DEFAULT_THEME = 'defaulttheme'


def get_template_sources(template_name, template_dirs=None):
    """
    Look for template into active theme directory
    """
    try:
        active_theme = settings.THEME_ACTIVE
    except AttributeError:
        active_theme = DEFAULT_THEME

    try:
        active_theme_module = __import__(active_theme)
    except ImportError:
        return

    active_theme_file = active_theme_module.__file__
    active_theme_dir = os.path.dirname(os.path.abspath(active_theme_file))
    active_theme_templates_dir = safe_join(active_theme_dir, 'templates')

    if os.path.isdir(active_theme_templates_dir):
        try:
            yield safe_join(active_theme_templates_dir, template_name)
        except UnicodeDecodeError:
            raise
        except ValueError:
            pass


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
