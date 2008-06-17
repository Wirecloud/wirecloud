# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telef�nica Investigaci�n y Desarrollo 
#     S.A.Unipersonal (Telef�nica I+D) 
# 
# Info about members and contributors of the MORFEO project 
# is available at: 
# 
#   http://morfeo-project.org/
# 
# This program is free software; you can redistribute it and/or modify 
# it under the terms of the GNU General Public License as published by 
# the Free Software Foundation; either version 2 of the License, or 
# (at your option) any later version. 
# 
# This program is distributed in the hope that it will be useful, 
# but WITHOUT ANY WARRANTY; without even the implied warranty of 
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
# GNU General Public License for more details. 
# 
# You should have received a copy of the GNU General Public License 
# along with this program; if not, write to the Free Software 
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
# 
# If you want to use this software an plan to distribute a 
# proprietary application in any way, and you are not licensing and 
# distributing your source code under GPL, you probably need to 
# purchase a commercial license of the product.  More info about 
# licensing options is available at: 
# 
#   http://morfeo-project.org/
#
from django.shortcuts import get_object_or_404

from catalogue.models import GadgetWiring, GadgetResource, UserRelatedToGadgetResource, UserTag, UserVote


# This function gets the vote for a given user and gadget. 
# It also gets the number of votes and the popularity of the gadget (average).

def get_vote_data(gadget, user):
    vote_data = {}
    try:
        vote_value = get_object_or_404(UserVote,idResource=gadget.id,idUser=user.id).vote
    except:
        vote_value = 0
    votes_number =  UserVote.objects.filter(idResource=gadget).count()
    popularity_value = gadget.popularity
    vote_data['user_vote']= vote_value
    vote_data['votes_number']= votes_number
    vote_data['popularity']= popularity_value
    vote = []
    vote.append(vote_data)

    return vote


# This function gets the non-repeated tags for a given gadget and a logged user. 
# It also gets the number of appareances of every tag and if one of those 
# appareances has been added by the logged user.

def get_tag_data(gadget_id, user_id):
    all_tags = []
    # Get the user's tags
    tags = UserTag.objects.filter(idResource=gadget_id,idUser=user_id)
    for t in tags:
        tag_data = {}
        tag_data['value'] = t.tag
        tag_data['appearances'] = tags.filter(tag=t.tag).count()
        tag_data['added_by'] = 'Yes'
        all_tags.append(tag_data)
    # Get other users' tags
    tags = UserTag.objects.filter(idResource=gadget_id).exclude(idUser=user_id)
    for t in tags:
        is_in_list = False
        for e in all_tags:
            if t.tag==e['value']:
                is_in_list= True
        if not is_in_list:
            tag_data = {}
	    tag_data['value'] = t.tag
            tag_data['appearances'] = tags.filter(tag=t.tag).count()
            tag_data['added_by'] = 'No'
            all_tags.append(tag_data)

    return all_tags


# This function gets the events of the given gadget.

def get_event_data (gadget_id):
    all_events = []
    events = GadgetWiring.objects.filter(idResource=gadget_id, wiring='out')    
    for e in events:
        event_data = {}
        event_data['friendcode'] = e.friendcode
        all_events.append(event_data)
    return all_events


# This function gets the slots of the given gadget.

def get_slot_data (gadget_id):
    all_slots = []
    slots = GadgetWiring.objects.filter(idResource=gadget_id, wiring='in') 
    for s in slots:
        slot_data = {}
        slot_data['friendcode'] = s.friendcode
        all_slots.append(slot_data)
    return all_slots

# This function gets data associated with the relationship between user and gadget

def get_related_user_data(gadget_id, user_id):
    data_ret = {}
    
    try:
        user_related_data_list = UserRelatedToGadgetResource.objects.filter(gadget__id=gadget_id, user__id=user_id)
        
        if len(user_related_data_list) == 0:
            data_ret['added_by_user'] = 'No'
            return data_ret
        
        user_related_data = user_related_data_list[0]
        if user_related_data.added_by:
            data_ret['added_by_user'] = 'Yes'
        else:
            data_ret['added_by_user'] = 'No'
    
    except UserRelatedToGadgetResource.DoesNotExist:
        data_ret['added_by_user'] = 'No'
        
    return data_ret
    
    
# This function gets all the information related to the given gadget.

def get_gadgetresource_data(data, user):
    data_ret = {}
    data_fields = data['fields']
    data_ret['vendor'] = data_fields['vendor']
    data_ret['name'] = data_fields['short_name']
    data_ret['version'] = data_fields['version']
    data_ret['author'] = data_fields['author']
    data_ret['mail'] = data_fields['mail']
    data_ret['description'] = data_fields['description']
    data_ret['uriImage'] = data_fields['image_uri']
    data_ret['uriWiki'] = data_fields['wiki_page_uri']
    data_ret['uriTemplate'] = data_fields['template_uri']

    user_related_data = get_related_user_data (gadget_id=data['pk'], user_id=user.id)
    data_ret['added_by_user'] = user_related_data['added_by_user'] 

    versions_data = GadgetResource.objects.filter(vendor=data_fields['vendor'], short_name=data_fields['short_name']).values('version')
    data_ret['versions'] = ["%s" % (v['version']) for v in versions_data]    
    
    data_tags = get_tag_data(gadget_id=data['pk'], user_id=user.id)
    data_ret['tags'] = [d for d in data_tags]

    data_events = get_event_data(gadget_id=data['pk'])
    data_ret['events'] = [d for d in data_events]
    
    data_slots = get_slot_data(gadget_id=data['pk'])
    data_ret['slots'] = [d for d in data_slots]
    
    resource = get_object_or_404(GadgetResource, id=data['pk'])
    data_ret['votes'] = get_vote_data(gadget=resource,user=user)
        
    return data_ret