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

from django.conf import settings
from django.template import TemplateDoesNotExist
from django.utils._os import safe_join


def load_template_source(template_name, template_dirs=None):
    tried = []

    allowed_templates = getattr(settings, "ALLOWED_TEMPLATES_IN_THEMES", None)
    if not isinstance(allowed_templates, (tuple, list)):
        allowed_templates = ["index.html", "500.html", "400.html",
                             "registration/login.html"]
    if template_name in allowed_templates:
        # Theme templates
        filepath = safe_join(settings.BASEDIR, 'media', 'themes', settings.DEFAULT_THEME, 'templates', template_name)
        try:
            return (open(filepath).read().decode(settings.FILE_CHARSET), filepath)
        except IOError:
            tried.append(filepath)

    # Default EzWeb templates
    filepath = safe_join(settings.BASEDIR, 'ezweb', 'templates', template_name)
    try:
        return (open(filepath).read().decode(settings.FILE_CHARSET), filepath)
    except IOError:
        tried.append(filepath)

    error_msg = "Tried %s" % tried
    raise TemplateDoesNotExist(error_msg)
load_template_source.is_usable = True
