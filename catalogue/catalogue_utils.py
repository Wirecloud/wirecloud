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

from django.core import serializers
from django.http import HttpResponse, HttpResponseServerError
from django.db.models import Q
from django.conf import settings

from commons.utils import get_xml_error, json_encode
from commons.user_utils import CERTIFICATION_VERIFIED

from catalogue.get_json_catalogue_data import get_gadgetresource_data, get_tag_data, get_vote_data
from catalogue.get_xml_catalogue_data import get_xml_description, get_tags_by_resource, get_vote_by_resource
from catalogue.models import GadgetResource, UserTag, UserVote, UserRelatedToGadgetResource

from django.utils.translation import ugettext as _

# This function returns a list with non-repeated elements.
# The second parameter indicates the minimum number of repetions of the elements
# in the original list to be part of the result list.
def get_uniquelist(list, value = None):

    uniquelist = []

    if value==None or value == 1:
        [uniquelist.append(x) for x in list if x not in uniquelist]
    else:
        for x in list:
            if x not in uniquelist and list.count(x) >= value:
                uniquelist.append(x)

    return uniquelist

# Filter gadgets that don't belong to given organization
# Also filter gadgets that are not certificated!
def filter_gadgets_by_organization(user, gadget_list, organization_list):  
    final_list = []
     
    for gadget in gadget_list:
        if (settings.CERTIFICATION_ENABLED):
            certification_status = gadget.certification
        
            #Checking certification status!
            if (certification_status and certification_status.name != CERTIFICATION_VERIFIED and user != gadget.creator):
                continue
        
        #Checking organizations!
        gadget_organizations = gadget.organization.all()
        
        if (len(gadget_organizations) == 0):
            #There is no organization => always returned to client app!
            final_list.append(gadget)
            continue
        
        #There are organizations, if a gadget organization corresponds to a user organization
        for gadget_organization in gadget_organizations:           
            for user_organization in organization_list:
                if gadget_organization == user_organization:
                    final_list.append(gadget)
                    continue
                    
    return final_list

# This function returns a list ordered by the criteria passed as parameter.
def get_sortedlist(list, orderby):
    if orderby=='-creation_date':
        list.sort(lambda x,y: cmp(y.creation_date,x.creation_date))
    elif orderby=='short_name':
        list.sort(lambda x,y: cmp(x.short_name.lower(),y.short_name.lower()))
    elif orderby=='vendor':
        list.sort(lambda x,y: cmp(x.vendor.lower(),y.vendor.lower()))
    elif orderby=='author':
        list.sort(lambda x,y: cmp(x.author.lower(),y.author.lower()))
    elif orderby=='-popularity':
        list.sort(lambda x,y: cmp(y.popularity,x.popularity))
    return list

# This function returns a list paginated with the parameters pag and offset.
def get_paginatedlist(gadgetlist, pag, offset):
    a= int(pag)
    b= int(offset)
    if a != 0 and b != 0:
        c=((a-1)*b)
        d= (b*a)
        if a==1:
            c=0
        gadgetlist = gadgetlist[c:d]

    return gadgetlist

# This function returns a list of gadgets that match all the criteria in the list passed as parameter.
def get_and_list(criterialist, user):
    #List of the gadgets that match the criteria in the database table GadgetResource
    gadgetlist = []
    #List of the gadgets that match the criteria in the database table UserTag
    taglist = []
    result = []
    is_first_element = True

    criterialist = criterialist.split()
    # This loop gets a result list of the gadgets that match any of the criteria
    for e in criterialist:
        # Get a list of elements that match the given criteria
        gadgetlist = get_resources_that_must_be_shown(user=user).filter(Q(short_name__icontains = e) | Q(vendor__icontains = e) | Q(author__icontains = e) | Q(mail__icontains = e) | Q(description__icontains = e) | Q(version__icontains = e))
        taglist = get_resources_that_must_be_shown(user=user).filter(usertag__tag__name__icontains = e)
        if taglist:
            gadgetlist = gadgetlist | taglist
        gadgetlist = get_uniquelist(gadgetlist)
        result.append(gadgetlist)
    # This loop gets the gadgets that match all the criteria
    for j in result:
        if is_first_element:
            gadgetlist = j
            is_first_element = False
        else:
            gadgetlist = get_uniquelist(gadgetlist+j, 2)
    return gadgetlist

# This function returns a list of gadgets that match any of the criteria in the list passed as parameter.
def get_or_list(criterialist, user):

    gadgetlist = []
    taglist = []
    criterialist = criterialist.split()

    for e in criterialist:
        # Get a list of elements that match the given value
        gadgetlist += get_resources_that_must_be_shown(user=user).filter(Q(short_name__icontains = e) |  Q(vendor__icontains = e) | Q(author__icontains = e) | Q(mail__icontains = e) | Q(description__icontains = e) | Q(version__icontains = e))
        taglist += get_resources_that_must_be_shown(user=user).filter(usertag__tag__name__icontains = e)
    gadgetlist += taglist
    gadgetlist = get_uniquelist(gadgetlist)
    return gadgetlist

# This function returns a list of gadgets that don't match any of the criteria in the list passed as parameter.
def get_not_list(criterialist, user):

    gadgetlist = []
    taglist = []
    is_first_element = True
    criterialist = criterialist.split()

    for e in criterialist:
        # Get the list of elements that don't match the given criteria in the GadgetResource table
        if is_first_element:
            gadgetlist = get_resources_that_must_be_shown(user=user).exclude(Q(short_name__icontains = e) |  Q(vendor__icontains = e) | Q(author__icontains = e) | Q(mail__icontains = e) | Q(description__icontains = e) | Q(version__icontains = e))
            is_first_element = False
        else:
            gadgetlist = gadgetlist.exclude(Q(short_name__icontains = e) |  Q(vendor__icontains = e) | Q(author__icontains = e) | Q(mail__icontains = e) | Q(description__icontains = e) | Q(version__icontains = e))
        #Get the list of gadgets that match any of the criteria in the UserTag database table
        taglist += get_resources_that_must_be_shown(user=user).filter(usertag__tag__name__icontains = e)
    gadgetlist = list(gadgetlist)
    # Remove the gadgets in taglist of gadgetlist
    for b in taglist:
        if (b in gadgetlist):
            gadgetlist.remove(b)
    gadgetlist = get_uniquelist(gadgetlist)
    return gadgetlist

# This function obtains all the information related to a gadget encoded in
# the properly format (json or xml)
def get_resource_response(gadgetlist, format, items, user):

    if format == 'json' or format=='default':
        gadgetresource = {}
        resource_data = serializers.serialize('python', gadgetlist, ensure_ascii=False)
        resource_data_list = [get_gadgetresource_data(d, user) for d in resource_data]
        gadgetresource['resourceList'] = resource_data_list
        response = HttpResponse(json_encode(gadgetresource), mimetype='application/json; charset=UTF-8')
        response.__setitem__('items', items)
        return response
    elif format == 'xml':
        response = get_xml_description(gadgetlist, user)
        response = HttpResponse(response,mimetype='text/xml; charset=UTF-8')
        response.__setitem__('items', items)
        return response
    else:
        return HttpResponseServerError(get_xml_error(_("Invalid format. Format must be either xml or json")), mimetype='application/xml; charset=UTF-8')

# This function obtains the all the tags related to a gadget encoded in
# the properly format (json or xml)
def get_tag_response(gadget, user, format):

    if format == 'json' or format == 'default':
        tag = {}
        tag_data_list = get_tag_data(gadget, user.id)
        tag['tagList'] = tag_data_list
        return HttpResponse(json_encode(tag), mimetype='application/json; charset=UTF-8')
    elif format == 'xml':
        response = '<?xml version="1.0" encoding="UTF-8" ?>\n'
        response += get_tags_by_resource(gadget, user)
        return HttpResponse(response,mimetype='text/xml; charset=UTF-8')
    else:
        return HttpResponseServerError(get_xml_error(_("Invalid format. Format must be either xml or json")), mimetype='application/xml; charset=UTF-8')

# This function obtains the vote related to a gadget and a user encoded in
# the properly format (json or xml)
def get_vote_response(gadget, user, format):
    if format == 'json' or format == 'default':
        vote = {}
        vote_data = get_vote_data(gadget, user)
        vote['voteData'] = vote_data
        return HttpResponse(json_encode(vote), mimetype='application/json; charset=UTF-8')
    elif format == 'xml':
        response = '<?xml version="1.0" encoding="UTF-8" ?>\n'
        response += get_vote_by_resource(gadget, user)
        return HttpResponse(response,mimetype='text/xml; charset=UTF-8')
    else:
        return HttpResponseServerError(get_xml_error(_("Invalid format. Format must be either xml or json")), mimetype='application/xml; charset=UTF-8')
    
# This function returns all the versions of a specified gadget name (formed by vendor and name)
def get_all_gadget_versions (vendor, name):
    versions = GadgetResource.objects.filter(vendor=vendor, short_name=name).values('version')
    return ["%s" % (v['version']) for v in versions]
    

# This function obtains all the resources that the catalog must show to the user.
# "The resources that must be shown" are the preferred version, which was selected by the user, or
# the latest version of the resource
def get_resources_that_must_be_shown (user):
    # Gets the names (without version) of all gadget from catalog
    gadget_names_without_version = [(gn['vendor'], gn['short_name']) for gn in GadgetResource.objects.values('vendor', 'short_name').distinct()]

    # Gets the gadget with preferred version what were selected by the user
    preferred_gadgets = GadgetResource.objects.filter(
            userrelatedtogadgetresource__user=user, 
            userrelatedtogadgetresource__preferred_by=True
        ).values('id', 'vendor', 'short_name')
    
    # The preferred version of the gadgets will be shown in the catalog
    shown_gadget_ids = [pg['id'] for pg in preferred_gadgets]
    
    # Remove all gadget with preferred version from 'gadget names without version' list 
    for pref_gadget in preferred_gadgets:
        gadget_with_preferred_version = (pref_gadget['vendor'], pref_gadget['short_name'])
        gadget_names_without_version.remove(gadget_with_preferred_version)  
    
    # All gadget in 'gadget names without version' list have not preferred version. Latest version is the preferred version by default
    for gadget_name in gadget_names_without_version:
        versions_list = get_all_gadget_versions(vendor=gadget_name[0], name=gadget_name[1])
        gadget_max_version = GadgetResource.objects.get(vendor=gadget_name[0], short_name=gadget_name[1], version=max(versions_list))
        # Adds the identifier of the latest version of the current gadget to the list of the gadgets that will be displayed in the catalog
        shown_gadget_ids.append(gadget_max_version.id)
    
    # Gets all the gadgets that will appear in the catalog (preferred and latest version)
    if len(shown_gadget_ids) > 0:
      return GadgetResource.objects.extra(where=['catalogue_gadgetresource.id IN (%s)' % ",".join(["%s" % (id) for id in shown_gadget_ids])])
    else:
      return GadgetResource.objects.none()

def get_last_gadget_version(name, vendor):
    version_list = get_all_gadget_versions(vendor, name)
    if version_list:
        version = max(version_list)
        return version
    return None

def get_gadget_popularity(votes_sum, votes_number):
    floor = votes_sum//votes_number
    mod = votes_sum % votes_number
    mod = mod/votes_number

    if mod <= 0.25:
        mod = 0.0
    elif mod > 0.75:
        mod = 1.0
    else:
        mod = 0.5
    result = floor + mod
    return result

def update_gadget_popularity(gadget):
    #Get all the votes on this gadget
    votes = UserVote.objects.filter(idResource=gadget)
    #Get the number of votes
    votes_number = UserVote.objects.filter(idResource=gadget).count()
    #Sum all the votes
    votes_sum = 0.0
    for e in votes:
        votes_sum = votes_sum + e.vote
    #Calculate the gadget popularity
    popularity = get_gadget_popularity(votes_sum,votes_number)
    #Update the gadget in the database
    gadget.popularity = unicode(popularity)
    gadget.save()
