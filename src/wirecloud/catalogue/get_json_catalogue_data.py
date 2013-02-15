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

from django.shortcuts import get_object_or_404

from wirecloud.catalogue.models import WidgetWiring, UserTag, UserVote
from wirecloud.commons.utils.http import get_absolute_reverse_url


def get_vote_data(widget, user):
    """Gets the vote for a given user and widget.

    It also gets the number of votes and the popularity of the widget (average).
    """

    vote_data = {}
    try:
        vote_value = get_object_or_404(UserVote, idResource=widget.id, idUser=user.id).vote
    except:
        vote_value = 0
    votes_number = UserVote.objects.filter(idResource=widget).count()
    vote_data['user_vote'] = vote_value
    vote_data['votes_number'] = votes_number
    # Decimal data loses precision when converted to float
    vote_data['popularity'] = str(widget.popularity)

    return vote_data


def get_tag_data(widget_id, user_id):
    """Gets the non-repeated tags for a given widget and a logged user.

    It also gets the number of appareances of every tag and if one of those
    appareances has been added by the logged user.
    """

    all_tags = []
    tags_by_name = {}
    # Get the user's tags
    tags = UserTag.objects.filter(idResource=widget_id)
    for t in tags:
        if t.tag.name in tags_by_name:
            if t.idUser.id == user_id:
                tags_by_name[t.tag.name]['added_by'] = 'Yes'

            continue

        tag_data = {}
        tag_data['id'] = t.id
        tag_data['value'] = t.tag.name
        tag_data['appearances'] = tags.filter(tag=t.tag).count()

        if t.idUser.id == user_id:
            tag_data['added_by'] = 'Yes'
        else:
            tag_data['added_by'] = 'No'

        all_tags.append(tag_data)
        tags_by_name[t.tag.name] = tag_data

    return all_tags


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

    data_tags = get_tag_data(widget_id=resource.pk, user_id=user.id)
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
        'added_by_user': user.is_superuser or resource.creator == user,
        'author': resource.author,
        'displayName': displayName,
        'description': resource.description,
        'mail': resource.mail,
        'uriImage': urljoin(template_uri, resource.image_uri),
        'uriWiki': urljoin(template_uri, resource.wiki_page_uri),
        'uriTemplate': template_uri,
        'ieCompatible': resource.ie_compatible,
        'tags': [d for d in data_tags],
        'outputs': [d for d in data_events],
        'inputs': [d for d in data_slots],
        'votes': get_vote_data(widget=resource, user=user),
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
