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
from django.contrib.auth.models import Group
from django.utils import simplejson

from wirecloud.catalogue.models import Category


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

    return {'tag_categories': simplejson.dumps(categories)}
