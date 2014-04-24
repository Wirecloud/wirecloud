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
import time
from urlparse import urljoin, urlparse

from wirecloud.catalogue.models import WidgetWiring
from wirecloud.commons.utils.http import get_absolute_reverse_url


def get_event_data(widget_id):
    """Gets the events of the given widget."""
    all_events = []
    events = WidgetWiring.objects.filter(idResource=widget_id, wiring='out')
    for e in events:
        event_data = {}
        event_data['friendcode'] = e.friendcode
        all_events.append(event_data)
    return all_events


def get_slot_data(widget_id):
    """Gets the slots of the given widget."""
    all_slots = []
    slots = WidgetWiring.objects.filter(idResource=widget_id, wiring='in')
    for s in slots:
        slot_data = {}
        slot_data['friendcode'] = s.friendcode
        all_slots.append(slot_data)
    return all_slots


def get_resource_data(untranslated_resource, user, request=None):
    """Gets all the information related to the given widget."""
    resource = untranslated_resource.get_translated_model()
    resource_info = untranslated_resource.get_processed_info(request)

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

    data_events = get_event_data(widget_id=resource.pk)
    data_slots = get_slot_data(widget_id=resource.pk)

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
        'outputs': [d for d in data_events],
        'inputs': [d for d in data_slots],
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
