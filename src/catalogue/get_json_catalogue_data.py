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
from urlparse import urljoin

from django.shortcuts import get_object_or_404

from catalogue.models import GadgetWiring, UserTag, UserVote, Capability


def get_vote_data(gadget, user):
    """Gets the vote for a given user and gadget.

    It also gets the number of votes and the popularity of the gadget (average).
    """

    vote_data = {}
    try:
        vote_value = get_object_or_404(UserVote, idResource=gadget.id, idUser=user.id).vote
    except:
        vote_value = 0
    votes_number = UserVote.objects.filter(idResource=gadget).count()
    vote_data['user_vote'] = vote_value
    vote_data['votes_number'] = votes_number
    # Decimal data loses precision when converted to float
    vote_data['popularity'] = str(gadget.popularity)

    return vote_data


def get_tag_data(gadget_id, user_id):
    """Gets the non-repeated tags for a given gadget and a logged user.

    It also gets the number of appareances of every tag and if one of those
    appareances has been added by the logged user.
    """

    all_tags = []
    tags_by_name = {}
    # Get the user's tags
    tags = UserTag.objects.filter(idResource=gadget_id)
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


def get_event_data(gadget_id):
    """Gets the events of the given gadget."""
    all_events = []
    events = GadgetWiring.objects.filter(idResource=gadget_id, wiring='out')
    for e in events:
        event_data = {}
        event_data['friendcode'] = e.friendcode
        all_events.append(event_data)
    return all_events


def get_slot_data(gadget_id):
    """Gets the slots of the given gadget."""
    all_slots = []
    slots = GadgetWiring.objects.filter(idResource=gadget_id, wiring='in')
    for s in slots:
        slot_data = {}
        slot_data['friendcode'] = s.friendcode
        all_slots.append(slot_data)
    return all_slots


def get_gadget_capabilities(gadget_id, user):
    data_ret = []
    capabilities = Capability.objects.filter(resource__id=gadget_id)

    for capability in capabilities:
        data_ret.append({
            'name': capability.name,
            'value': capability.value,
        })

    return data_ret


def get_resource_data(untranslated_resource, user):
    """Gets all the information related to the given gadget."""
    resource = untranslated_resource.get_translated_model()

    if resource.display_name and resource.display_name != "":
        displayName = resource.display_name
    else:
        displayName = resource.short_name

    data_tags = get_tag_data(gadget_id=resource.pk, user_id=user.id)
    data_events = get_event_data(gadget_id=resource.pk)
    data_slots = get_slot_data(gadget_id=resource.pk)

    return {
        'vendor': resource.vendor,
        'id': resource.pk,
        'name': resource.short_name,
        'displayName': displayName,
        'version': resource.version,
        'author': resource.author,
        'mail': resource.mail,
        'description': resource.description,
        'uriImage': urljoin(resource.template_uri, resource.image_uri),
        'uriWiki': urljoin(resource.template_uri, resource.wiki_page_uri),
        'type': resource.resource_type(),
        'uriTemplate': resource.template_uri,
        'ieCompatible': resource.ie_compatible,
        'capabilities': get_gadget_capabilities(gadget_id=resource.pk, user=user),
        'added_by_user': resource.creator == user,
        'tags': [d for d in data_tags],
        'events': [d for d in data_events],
        'slots': [d for d in data_slots],
        'votes': get_vote_data(gadget=resource, user=user),
    }


def get_resource_group_data(resource_group, user):

    data = {
        'vendor': resource_group['vendor'],
        'name': resource_group['short_name'],
        'type': resource_group['type'],
        'versions': [],
    }
    for resource in resource_group['variants']:
        current_resource_data = get_resource_data(resource, user)
        del current_resource_data['vendor']
        del current_resource_data['name']
        del current_resource_data['type']
        data['versions'].append(current_resource_data)

    return data
