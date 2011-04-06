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


#

from django.contrib.auth.models import Group

CERTIFICATION_PREFIX = 'cert__'
ORGANIZATION_PREFIX = 'org__'

CERTIFICATION_DEFAULT = CERTIFICATION_PREFIX + 'not_verified'
CERTIFICATION_VERIFIED = CERTIFICATION_PREFIX + 'verified'


def get_certification_status(user):
    certification_groups = user.groups.filter(name__contains=CERTIFICATION_PREFIX)

    if (len(certification_groups) == 0):
        default = get_default_certification_group()
        return default

    return certification_groups[0]


def get_default_certification_group():
    default, created = Group.objects.get_or_create(name=CERTIFICATION_DEFAULT)

    return default


def get_verified_certification_group():
    verified, created = Group.objects.get_or_create(name=CERTIFICATION_VERIFIED)

    return verified
