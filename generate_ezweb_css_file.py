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

from processors.context_processors import ezweb_release
from layout.models import Layout
from django.conf import settings
from django.utils import simplejson

base_dir = 'media/' 
layout = Layout.objects.get(name=settings.LAYOUT)

layout_css = simplejson.loads(layout.layout_css)
files_css_normal = [base_dir+layout_css["general"],
                    base_dir+layout_css["dragboard"],
                    base_dir+layout_css["wiring"],
                    base_dir+layout_css["catalogue"]
                    ]

theme_css = simplejson.loads(layout.theme.theme_css)
files_css_theme = [base_dir+theme_css["general"],
                    base_dir+theme_css["dragboard"],
                    base_dir+theme_css["wiring"],
                    base_dir+theme_css["catalogue"]
                    ]


def write_file(final_file_name, file_list):
    try:
        res = open(final_file_name, 'w')
        
        header = open('morfeo_header.txt', 'r')
        
        res.write(header.read())
        
        header.close()
        
        for file_name in file_list:
           file = open(file_name,'r')
        
           #copying real js code to the resulting unique source file!
           res.write(file.read())
        
           file.close()

        res.close()
    except Exception, e:
        print e

#Main

write_file('media/css/ezweb_' + ezweb_release(None)['ezweb_release'] + '.css', files_css_normal)
write_file('media/themes/' + layout.theme.name + '/css/ezweb_theme_' + ezweb_release(None)['ezweb_release'] + '.css', files_css_theme)