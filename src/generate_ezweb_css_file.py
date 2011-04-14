#!/usr/bin/env python

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

import os

from django.conf import settings


DEFAULT_THEME_BASE_DIR = os.path.join(settings.THEME_PATH, 'default')


def get_theme_css(base_dir, css_file):
    theme_css_path = os.path.join(base_dir, 'css', css_file)
    if os.path.isfile(theme_css_path):
        return theme_css_path
    else:
        return os.path.join(DEFAULT_THEME_BASE_DIR, 'css', css_file)


def compress(theme_name):
    base_dir = os.path.join(settings.THEME_PATH, theme_name)
    css_files = [
        "ezweb.css",
        "dragboard.css",
        "wiring.css",
        "catalogue.css",
    ]
    final_file_name = os.path.join(base_dir, 'css', "ezweb_compressed.css")

    try:
        res = open(final_file_name, 'w')

        header = open('morfeo_header.txt', 'r')

        res.write(header.read())

        header.close()

        for css_file in css_files:
            file = open(get_theme_css(base_dir, css_file), 'r')
            res.write(file.read())
            file.close()

        res.close()
    except Exception, e:
        print e

#Main

for filename in os.listdir(settings.THEME_PATH):
    if filename.startswith('.'):
        continue

    theme_path = os.path.join(settings.THEME_PATH, filename)
    if os.path.isdir(theme_path):
        compress(filename)
