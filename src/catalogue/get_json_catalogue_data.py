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
from django.shortcuts import get_object_or_404

from catalogue.models import GadgetWiring, GadgetResource, UserTag, UserVote, Capability
from resourceSubscription.models import Contract, Application
#if the catalogue and the platform are separated we should make a request instead of using this:
from workspace.utils import get_mashup_gadgets


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
    popularity_value = gadget.popularity
    vote_data['user_vote'] = vote_value
    vote_data['votes_number'] = votes_number
    vote_data['popularity'] = popularity_value

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


def get_apps_info(apps):
    data_ret = []

    for app in apps:
        data_ret.append(app.get_info())

    return data_ret


def get_available_apps_info():
    data_ret = []
    apps = Application.objects.all().order_by('tag__name')

    for app in apps:
        data_ret.append(app.get_info())

    return data_ret


def get_apps_by_gadget_resource(gadget_id):
    return Application.objects.filter(resources__id=gadget_id).order_by('tag__name')


def contains(app, resources):
    """Check if the set of gadgets of an app contains the given resources."""
    return app['gadgets'] >= resources


def get_sets(base_app, gadgets_by_apps, mashup_resources):
    apps = []
    if contains(base_app, mashup_resources):
        apps.append(base_app)
    else:
        #try with a bigger set: compound a new one
        for index, new_app in enumerate(gadgets_by_apps):
            app = {}
            #register the involved apps
            app['apps'] = base_app['apps'] + new_app['apps']
            #merge both gadget sets
            app['gadgets'] = base_app['gadgets'].union(new_app['gadgets'])

            #recursion
            apps = apps + get_sets(app, gadgets_by_apps[index + 1::], mashup_resources)

    return apps


def get_best_set(app_sets, user):
    #PROVISIONAL: return the first one by now
    #return app_sets[0]
    best_set = None
    best_set_count = None
    for app_set in app_sets:
        not_bought_count = 0
        for app in app_set['apps']:
            try:
                Contract.objects.get(user=user, application=app)
            except Contract.DoesNotExist:
                not_bought_count += 1

        if (best_set_count == None) or (not_bought_count < best_set_count):
            best_set_count = not_bought_count
            best_set = app_set

    return best_set


def get_min_set_to_cover_gadgets(mashup_resources, gadgets_by_apps, user):
    """Calculate the min set of apps a user needs to buy to use a mashup."""
    app = {'apps': [], 'gadgets': set([])}
    app_sets = get_sets(app, gadgets_by_apps, mashup_resources)
    #choose one of the sets
    return get_best_set(app_sets, user)


def get_apps_by_mashup_resource(mashup_id, user):
    """Checks which is the set of applications that contains
    all the contratable gadgets in a mashup.
    """
    resources = []
    gadgets = get_mashup_gadgets(mashup_id)

    #get the related resources
    for gadget in gadgets:
        resource = GadgetResource.objects.get(short_name=gadget.name, vendor=gadget.vendor, version=gadget.version)
        try:
            resource.capability_set.get(name='contratable', value='true')
            resources.append(resource)
        except:
            #not contratable
            pass

    #get all the applications related to these resources
    all_apps = Application.objects.filter(resources__in=resources).distinct()
    gadgets_by_apps = [{'apps':[app], 'gadgets':set(app.resources.all())} for app in all_apps]

    #get the minimun set of apps that covers the gadget set
    #param1: set of mashup's gadgets
    #param2: list of all possible apps
    apps_set = get_min_set_to_cover_gadgets(set(resources), gadgets_by_apps, user)
    if apps_set:
        return apps_set['apps']
    else:
        return []


def get_gadget_capabilities(gadget_id, user):
    data_ret = []
    try:
        capability_list = Capability.objects.filter(resource__id=gadget_id)

        for capability in capability_list:
            cap = {}

            if capability.name.lower() == 'contratable':

                contract = None

                mashup_id = GadgetResource.objects.get(id=gadget_id).mashup_id
                if mashup_id:
                    applications = get_apps_by_mashup_resource(mashup_id, user)

                else:
                    applications = get_apps_by_gadget_resource(gadget_id)

                apps_info = get_apps_info(applications)

                #check which applications are already bought
                contracts = []
                for index, application in enumerate(applications):
                    try:
                        contract = Contract.objects.get(user=user, application=application)
                        apps_info[index]['has_contract'] = True
                        contracts.append(contract.get_info())

                    except Contract.DoesNotExist:
                        apps_info[index]['has_contract'] = False

                cap['applications'] = apps_info

                if contracts:
                    cap['contract'] = contracts

            cap['name'] = capability.name
            cap['value'] = capability.value

            data_ret.append(cap)
    except Capability.DoesNotExist:
        data_ret = {}

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
        'uriImage': resource.image_uri,
        'uriWiki': resource.wiki_page_uri,
        'mashupId': resource.mashup_id,
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

    return [get_resource_data(resource, user) for resource in resource_group['variants']]
