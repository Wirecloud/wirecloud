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

from catalogue.models import CatalogueResource, WidgetWiring, UserTag, UserVote


def get_xml_description(widgetlist, user):

    xml_resource = ''
    xml_tag = ''
    xml_event = ''
    xml_slot = ''
    xml_vote = ''

    for e in widgetlist:

        xml_tag = get_tags_by_resource(e.id, user.id)
        xml_event = get_events_by_resource(e.id)
        xml_slot = get_slots_by_resource(e.id)
        xml_vote = get_vote_by_resource(e, user)
        xml_user_data = get_related_user_by_resource(e, user)

        xml_resource += "\n".join(['<resource>',
            '<vendor>%s</vendor>' % e.vendor,
            '<name>%s</name>' % e.short_name,
            '<version>%s</version>' % e.version,
            '<Author>%s</Author>' % e.author,
            '<Mail>%s</Mail>' % e.mail,
            '<description>%s</description>' % e.description,
            '<uriImage>%s</uriImage>' % e.image_uri,
            '<uriWiki>%s</uriWiki>' % e.wiki_page_uri,
            '<type>%s</type>' % str(e.resource_type()),
            '<uriTemplate>%s</uriTemplate>' % e.template_uri,
            xml_user_data, xml_tag, xml_event, xml_slot, xml_vote,
            '</resource>'])

    response = "".join(['<?xml version="1.0" encoding="UTF-8" ?>',
        '<resources>%s</resources>' % xml_resource])
    return response


def get_events_by_resource(widget_id):

    xml_event = ''

    for e in WidgetWiring.objects.filter(idResource=widget_id, wiring='out'):
        xml_event += '<Event>' + e.friendcode + '</Event>'

    response = '<Events>' + xml_event + '</Events>'
    return response


def get_slots_by_resource(widget_id):

    xml_slot = ''

    for e in WidgetWiring.objects.filter(idResource=widget_id, wiring='in'):
        xml_slot += '<Slot>' + e.friendcode + '</Slot>'

    response = '<Slots>' + xml_slot + '</Slots>'
    return response


def get_related_user_by_resource(resource, user):

    added_by_user = 'No'
    if resource.creator == user:
        added_by_user = 'Yes'

    return "<Added_by_User>%s</Added_by_User>" % added_by_user


def get_all_versions(vendor, name):
    versions_data = CatalogueResource.objects.filter(vendor=vendor, short_name=name).values('version')
    return '\n'.join(["<version>%s</version>" % v['version'] for v in versions_data])


def get_tags_by_resource(widget_id, user_id):

    xml_tag = ''

    for e in UserTag.objects.filter(idResource=widget_id, idUser=user_id):
        xml_tag += "".join(['<Tag>\n'
                            '<Identifier>' + str(e.id) + '</Identifier>\n',
                            '<Value>' + e.tag.name + '</Value>\n',
                            '<Added_by>Yes</Added_by>\n',
                            '</Tag>'])

    for e in UserTag.objects.filter(idResource=widget_id).exclude(idUser=user_id):
        xml_tag += "".join(['<Tag>\n',
                            '<Identifier>' + str(e.id) + '</Identifier>\n',
                            '<Value>' + e.tag.name + '</Value>\n',
                            '<Added_by>No</Added_by>\n',
                            '</Tag>'])

    response = '<Tags>' + xml_tag + '</Tags>'
    return response


def get_vote_by_resource(widget, user):

    xml_vote = ''

    try:
        vote_value = get_object_or_404(UserVote, idResource=widget.id, idUser=user.id).vote
    except:
        vote_value = 0
    votes_number = UserVote.objects.filter(idResource=widget).count()
    popularity = widget.popularity

    xml_vote += "".join(['<User_Vote>' + str(vote_value) + '</User_Vote>\n',
                         '<Popularity>' + str(popularity) + '</Popularity>\n',
                         '<Votes_Number>' + str(votes_number) + '</Votes_Number>'])

    response = '<Vote_Info>' + xml_vote + '</Vote_Info>'
    return response
