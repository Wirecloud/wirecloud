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



import stat, os
from django.conf import settings
from commons.utils import json_encode
from catalogue.models import Category, Tag
from preferences.views import get_user_theme
from django.contrib.auth.models import Group

def server_url(request):
    ret = {}
    # add the Authentication Server (EzSteroids)
    if hasattr(settings, 'AUTHENTICATION_SERVER_URL'):
        ret['AUTHENTICATION_SERVER_URL']= settings.AUTHENTICATION_SERVER_URL
    else:
        ret['AUTHENTICATION_SERVER_URL']= None
    
    # add the Gadget Template Generator URL (or nothing if it is in the same server)
    if hasattr(settings, 'GADGET_GENERATOR_URL'):
        ret['GADGET_GENERATOR_URL']= settings.GADGET_GENERATOR_URL
    else:
        ret['GADGET_GENERATOR_URL']= ""
    
    return ret

def is_anonymous(request):
    is_anonymous = False
    if hasattr(request, 'anonymous_id') and request.anonymous_id and request.anonymous_id==request.user.username:
        is_anonymous = True
    return {'is_anonymous': is_anonymous }

def home_gateway_url(request):
    if hasattr(settings, 'HOME_GATEWAY_DISPATCHER_URL'):
       return {'home_gateway_dispatcher_url': settings.HOME_GATEWAY_DISPATCHER_URL}
    else:
        return {'home_gateway_dispatcher_url': None}

def only_one_js_file(request):
    if hasattr(settings, 'ONLY_ONE_JS_FILE'):
       return {'only_one_js_file': settings.ONLY_ONE_JS_FILE}
    else:
        return {'only_one_js_file': None}

def only_one_css_file(request):
    if hasattr(settings, 'ONLY_ONE_CSS_FILE'):
       return {'only_one_css_file': settings.ONLY_ONE_CSS_FILE}
    else:
        return {'only_one_css_file': False}
    
def remote_channels_enabled(request):
    return {'remote_channels_enabled': hasattr(settings, 'REMOTE_CHANNEL_NOTIFIER_URL') }

    
def ezweb_release(request):
    if hasattr(settings, 'EZWEB_RELEASE'):
       return {'ezweb_release': settings.EZWEB_RELEASE}
    else:
        return {'ezweb_release': 'default'}
    

#private method: gets the tags and category children from an specific category (Category model)
def _get_Category_Info(cat):
    catObject = {}
    #get the related tag names
    catObject['tags'] = [t.name for t in cat.tags.all()]
    #get its category children
    children = Category.objects.filter(parent = cat)
    catObject['children'] = {}
    for catChild in children:
        #make the same with all its children
        catObject['children'][catChild.name]= _get_Category_Info(catChild)

    return catObject

# tag categories from the catalogue specified by db admin
def tag_categories(request):
    categories = {}
    catQuerySet = Category.objects.filter(parent = None)
    for cat in catQuerySet:
        categories[cat.name] =_get_Category_Info(cat)

    return {'tag_categories': json_encode(categories)}

# themes url
def theme_url(request):

    # Default theme
    if not hasattr(settings, "DEFAULT_THEME") or settings.DEFAULT_THEME == None:
        settings.DEFAULT_THEME = "default"

    # Theme cache
    if not hasattr(settings, "CACHED_THEMES"):
        themes_dir = os.path.join(settings.BASEDIR, 'media', 'themes')

        themes = []
        for filename in os.listdir(themes_dir):
            if filename.startswith('.'):
                continue

            pathname = os.path.join(themes_dir, filename)
            mode = os.stat(pathname)[stat.ST_MODE]
            if stat.S_ISDIR(mode):
                themes.append(filename)

        themes.sort(key=str.lower)

        settings.CACHED_THEMES = themes
        settings.CACHED_THEMES_JSON = json_encode(themes)

    # Process current theme
    theme = get_user_theme(request.user, settings.DEFAULT_THEME)
    if not (theme in settings.CACHED_THEMES):
      theme = settings.DEFAULT_THEME

    theme_url = settings.MEDIA_URL + "themes/" + theme

    return {'THEMES': settings.CACHED_THEMES_JSON, 'DEFAULT_THEME': settings.DEFAULT_THEME, 'INITIAL_THEME': theme, 'THEME_URL': theme_url}

def installed_apps(request):
    if hasattr(settings, 'INSTALLED_APPS'):
       return {'installed_apps': settings.INSTALLED_APPS}
    else:
        return {'installed_apps': None}
    
# Organizations available in EzWeb
def ezweb_organizations(request):
    queryGroups = Group.objects.exclude(name__startswith="cert__").order_by('name')   
    return {'ezweb_organizations': json_encode([g.name for g in queryGroups])}
