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

from catalogue.models import UserTag, Tag, GadgetResource
from django.contrib.auth.models import User

mapping_file = open('mapping.txt', 'r')

mapping_text = mapping_file.read()

mapping_file.close()

tag_mapping = eval(mapping_text)

for (tag_text, user_id, resource_id) in tag_mapping:
     
     tag, created = Tag.objects.get_or_create(name=tag_text)
     
     user = User.objects.get(id=user_id)
     resource = GadgetResource.objects.get(id=resource_id)

     user_tag = UserTag(tag=tag, idUser=user, idResource=resource)
     
     user_tag.save()
     
