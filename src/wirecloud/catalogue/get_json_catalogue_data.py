# -*- coding: utf-8 -*-

# Copyright (c) 2011-2014 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import time
from urlparse import urljoin, urlparse

from wirecloud.commons.utils.http import get_absolute_reverse_url


def get_resource_data(resource, user, request=None):
    """Gets all the information related to the given resource."""
    resource_info = resource.get_processed_info(request)

    if urlparse(resource.template_uri).scheme == '':
        template_uri = get_absolute_reverse_url('wirecloud_catalogue.media', kwargs={
            'vendor': resource.vendor,
            'name': resource.short_name,
            'version': resource.version,
            'file_path': resource.template_uri
        }, request=request)
    else:
        template_uri = resource.template_uri

    if resource.display_name and resource.display_name != "":
        displayName = resource.display_name
    else:
        displayName = resource.short_name

    uploader = None
    if resource.creator is not None:
        uploader = resource.creator.get_full_name()
        if uploader.strip() == '':
            uploader = resource.creator.username

    cdate = resource.creation_date
    creation_timestamp = time.mktime(cdate.timetuple()) * 1e3 + cdate.microsecond / 1e3

    return {
        'id': resource.pk,
        'vendor': resource.vendor,
        'name': resource.short_name,
        'version': resource.version,
        'type': resource.resource_type(),
        'packaged': resource.fromWGT,
        'date': creation_timestamp,
        'uploader': uploader,
        'permissions' : {
            'uninstall': resource.public is False and resource.users.filter(pk=user.pk).exists(),
        },
        'authors': resource.author,
        'displayName': displayName,
        'description': resource.description,
        'mail': resource.mail,
        'uriImage': urljoin(template_uri, resource.image_uri),
        'uriWiki': urljoin(template_uri, resource.wiki_page_uri),
        'uriTemplate': template_uri,
        'license': resource_info['license'],
        'licenseurl': resource_info['licenseurl'],
    }


def get_resource_group_data(resource_group, user, request=None):

    data = {
        'vendor': resource_group['vendor'],
        'name': resource_group['short_name'],
        'type': resource_group['type'],
        'versions': [],
    }
    for resource in resource_group['variants']:
        current_resource_data = get_resource_data(resource, user, request)
        del current_resource_data['vendor']
        del current_resource_data['name']
        del current_resource_data['type']
        data['versions'].append(current_resource_data)

    return data
