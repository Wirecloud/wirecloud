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


from django.db.models import Q
from django.conf import settings
from django.contrib.auth.models import Group

from catalogue.models import Category
from commons.utils import json_encode


def server_url(request):
    ret = {}
    # add the Authentication Server (EzSteroids)
    if hasattr(settings, 'AUTHENTICATION_SERVER_URL'):
        ret['AUTHENTICATION_SERVER_URL'] = settings.AUTHENTICATION_SERVER_URL
    else:
        ret['AUTHENTICATION_SERVER_URL'] = None

    # add the Gadget Template Generator URL (or nothing if it is in the same server)
    if hasattr(settings, 'GADGET_GENERATOR_URL'):
        ret['GADGET_GENERATOR_URL'] = settings.GADGET_GENERATOR_URL
    else:
        ret['GADGET_GENERATOR_URL'] = ""

    return ret


def is_anonymous(request):
    is_anonymous = False
    if hasattr(request, 'anonymous_id') and request.anonymous_id and request.anonymous_id == request.user.username:
        is_anonymous = True
    return {'is_anonymous': is_anonymous}


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
        catObject['children'][catChild.name] = _get_Category_Info(catChild, userOrgs)

    return catObject


# tag categories from the catalogue specified by db admin
def tag_categories(request):
    try:
        userOrgs = request.user.groups.exclude(name__startswith="cert__")
    except:
        userOrgs = {}

    #Categories whose parent is None are root categories
    root = _get_Category_Info(None, userOrgs)
    categories = root['children']

    return {'tag_categories': json_encode(categories)}


def policy_lists(request):
    user_policies = request.session.get("policies")

    return {'policies': user_policies}


def ezweb_organizations(request):
    """Organizations available in Wirecloud"""
    queryGroups = Group.objects.exclude(name__startswith="cert__").order_by('name')
    return {'ezweb_organizations': json_encode([g.name for g in queryGroups])}
