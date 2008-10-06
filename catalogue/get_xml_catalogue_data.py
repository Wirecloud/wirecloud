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

from catalogue.models import GadgetWiring, UserTag, UserVote, UserRelatedToGadgetResource


def get_xml_description(gadgetlist, user):

    xml_resource = ''
    xml_tag=''
    xml_event=''
    xml_slot=''
    xml_vote=''

    for e in gadgetlist:

        xml_tag = get_tags_by_resource(e.id,user.id)
        xml_event = get_events_by_resource(e.id)
        xml_slot = get_slots_by_resource(e.id)
        xml_vote = get_vote_by_resource(e, user)
        xml_user_data = get_related_user_by_resource(e.id, user.id)

        xml_resource += "\n".join(['<resource>',
            '<vendor>%s</vendor>' % e.vendor,
            '<name>%s</name>' % e.short_name,
            '<version>%s</version>' % e.version,
            '<Author>%s</Author>' % e.author,
            '<Mail>%s</Mail>' % e.mail,
            '<description>%s</description>' % e.description,
            '<uriImage>%s</uriImage>' % e.image_uri,
            '<uriWiki>%s</uriWiki>' % e.wiki_page_uri,
            '<mashupId>%s</mashupId>' % str(e.mashup_id),
            '<uriTemplate>%s</uriTemplate>' % e.template_uri,
            xml_user_data, xml_tag, xml_event, xml_slot, xml_vote, 
            '</resource>'])

    response = "".join(['<?xml version="1.0" encoding="UTF-8" ?>',
        '<resources>%s</resources>' % xml_resource])
    return response


def get_events_by_resource(gadget_id):

    xml_event=''

    for e in GadgetWiring.objects.filter(idResource=gadget_id, wiring='out'):
        xml_event +='<Event>'+e.friendcode+'</Event>'

    response='<Events>'+xml_event+'</Events>'
    return response


def get_slots_by_resource(gadget_id):

    xml_slot=''

    for e in GadgetWiring.objects.filter(idResource=gadget_id, wiring='in'):
        xml_slot +='<Slot>'+e.friendcode+'</Slot>'

    response='<Slots>'+xml_slot+'</Slots>'
    return response

def get_related_user_by_resource(gadget_id, user_id):
    
    added_by_user = ''
    preferred_by_user = ''
    
    try:
        user_related_data_list = UserRelatedToGadgetResource.objects.filter(gadget__id=gadget_id, user__id=user_id)

        if len(user_related_data_list) == 0:
            added_by_user = 'No'
            return "<Added_by_User>%s</Added_by_User>" % added_by_user
        
        user_related_data = user_related_data_list[0]
        if user_related_data.added_by:
            added_by_user = 'Yes'
        else:
            added_by_user = 'No'
            
    except UserRelatedToGadgetResource.DoesNotExist:
        added_by_user = 'No'
        
    return "<Added_by_User>%s</Added_by_User>" % added_by_user

def get_all_versions(gadget_id, user_id):
    versions_data = GadgetResource.objects.filter(vendor=vendor, short_name=name).values('version')
    return '\n'.join(["<version>%s</version>" % v['version'] for v in versions_data])


def get_tags_by_resource(gadget_id, user_id):

    xml_tag=''

    for e in UserTag.objects.filter(idResource=gadget_id, idUser=user_id):
        xml_tag += "".join(['<Tag>\n'
                            '<Identifier>'+str(e.id)+'</Identifier>\n',
                            '<Value>'+e.tag+'</Value>\n',
                            '<Added_by>Yes</Added_by>\n',
                            '</Tag>'])

    for e in UserTag.objects.filter(idResource=gadget_id).exclude(idUser=user_id):
        xml_tag += "".join(['<Tag>\n',
                            '<Identifier>'+str(e.id)+'</Identifier>\n',
                            '<Value>'+e.tag+'</Value>\n',
                            '<Added_by>No</Added_by>\n',
                            '</Tag>'])

    response='<Tags>'+xml_tag+'</Tags>'
    return response


def get_vote_by_resource(gadget, user):

    xml_vote=''

    try:
        vote_value = get_object_or_404(UserVote,idResource=gadget.id,idUser=user.id).vote
    except:
        vote_value = 0
    votes_number =  UserVote.objects.filter(idResource=gadget).count()
    popularity = gadget.popularity

    xml_vote+="".join(['<User_Vote>'+str(vote_value)+'</User_Vote>\n',
                            '<Popularity>'+str(popularity)+'</Popularity>\n',
                            '<Votes_Number>'+str(votes_number)+'</Votes_Number>'])

    response='<Vote_Info>'+xml_vote+'</Vote_Info>'
    return response