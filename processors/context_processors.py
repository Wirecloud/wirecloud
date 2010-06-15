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
from django.db.models import Q
from commons.utils import json_encode
from catalogue.models import Category, Tag
#from preferences.views import get_user_theme
from django.contrib.auth.models import Group
from layout.models import Skin, SkinOrganization, TYPES

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
def _get_Category_Info(cat, userOrgs):
    catObject = {}
    
    if cat:
        #get the related tag names
        catObject['tags'] = [t.name for t in cat.tags.all()]
        
    #get its category children filtering by both the user orgs and the general categories
    #categories with no organizations are general and every user have to see them
    children = Category.objects.filter(Q(organizations__in=list(userOrgs)) | Q(organizations=None), parent=cat).distinct()
    catObject['children'] = {}
    for catChild in children:
        #make the same with all its children
        catObject['children'][catChild.name]= _get_Category_Info(catChild, userOrgs)

    return catObject

# tag categories from the catalogue specified by db admin
def tag_categories(request):
    try:
        userOrgs = request.user.groups.exclude(name__startswith="cert__")
    except:
        userOrgs={}
        
    #Categories whose parent is None are root categories
    root = _get_Category_Info(None, userOrgs)
    categories = root['children']
    
    return {'tag_categories': json_encode(categories)}     
    
def policy_lists(request):
    user_policies = request.session.get("policies")
    
    return { 'policies': user_policies }  

    
# workspace skins
def skins(request):
    catalogue_type = TYPES[0][0]
    ws_type = TYPES[1][0]

    layout_name = settings.LAYOUT
    skins = Skin.objects.filter(skin_template__type=ws_type, layout__name=layout_name)
    skins = [skin.name for skin in skins.order_by('name')]

    default_ws_skin = None
    default_cat_skin = None
    try:
        orgs = Group.objects.filter(user=request.user)
        #search the default skin in the user organizations
        for org in orgs:
            #workspace skin
            try:
               default_ws_skin  = SkinOrganization.objects.filter(type=ws_type, organization=org, skin__layout__name=layout_name)[0].skin.name
               break
            except:
                pass
            
        for org in orgs:
            #catalogue skin
            try:
               default_cat_skin  = SkinOrganization.objects.filter(type=catalogue_type, organization=org, skin__layout__name=layout_name)[0].skin.name
               break
            except:
                pass
    except Exception, e:
        pass;
    #if it is not related to an organization - > return the default skins
    if (not default_ws_skin):
        default_ws_skin = Skin.objects.get(layout__name=layout_name, skin_template__type=ws_type, default=True).name
    if (not default_cat_skin):
        #default_cat_skin = Skin.objects.get(layout__name=layout_name, skin_template__type=catalogue_type, default=True).name
        default_cat_skin = "default"
    
    return {'SKINS': json_encode(skins), 'DEFAULT_SKIN': default_ws_skin, 'CATALOGUE_SKIN': default_cat_skin}


def installed_apps(request):
    if hasattr(settings, 'INSTALLED_APPS'):
       return {'installed_apps': settings.INSTALLED_APPS}
    else:
        return {'installed_apps': None}
    
# Organizations available in EzWeb
def ezweb_organizations(request):
    queryGroups = Group.objects.exclude(name__startswith="cert__").order_by('name')   
    return {'ezweb_organizations': json_encode([g.name for g in queryGroups])}
