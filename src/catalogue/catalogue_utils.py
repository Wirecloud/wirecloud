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

from django.http import HttpResponse, HttpResponseServerError
from django.db.models import Q
from django.conf import settings
from django.utils.translation import ugettext as _

from catalogue.get_json_catalogue_data import get_resource_group_data, get_tag_data, get_vote_data
from catalogue.get_xml_catalogue_data import get_xml_description, get_tags_by_resource, get_vote_by_resource
from catalogue.models import CatalogueResource, UserVote
from commons.utils import get_xml_error, json_encode
from commons.user_utils import CERTIFICATION_VERIFIED


def get_uniquelist(list, value=None):
    """Returns a list with non-repeated elements.

    The second parameter indicates the minimum number of repetions of the elements
    in the original list to be part of the result list.
    """
    uniquelist = []

    if value == None or value == 1:
        [uniquelist.append(x) for x in list if x not in uniquelist]
    else:
        for x in list:
            if x not in uniquelist and list.count(x) >= value:
                uniquelist.append(x)

    return uniquelist


def group_resources(resources):

    ordered_list = []
    grouped_resources = {}

    for resource in resources:
        key = resource.short_name + '/' + resource.vendor
        if key not in grouped_resources:
            entry = {
                'short_name': resource.short_name,
                'vendor': resource.vendor,
                'variants': [],
            }
            grouped_resources[key] = entry
            ordered_list.append(entry)
        else:
            entry = grouped_resources[key]

        entry['variants'].append(resource)

    return ordered_list


def _valid_resource(resource, user, organization_list, scope):

    if settings.CERTIFICATION_ENABLED:
        certification_status = resource.certification

        # Checking certification status!
        if certification_status and certification_status.name != CERTIFICATION_VERIFIED and user != resource.creator:
            return False

    # checking the scope of the query
    if scope == "mashup" and not resource.mashup_id:
        return False
    elif scope == "gadget" and resource.mashup_id:
        return False

    # Checking organizations!
    resource_organizations = resource.organization.all()

    if len(resource_organizations) == 0:
        # There is no organization => always returned to client app!
        return True

    # There are organizations, if a gadget organization corresponds to a user organization
    return len(set(resource_organizations) & set(organization_list)) > 0


def _filter_resource_by_organization(entry, user, organization_list, scope):

    entry['variants'] = [r for r in entry['variants'] if _valid_resource(r, user, organization_list, scope)]
    return len(entry['variants']) > 0


def filter_resources_by_organization(user, resources, organization_list, scope):
    """
    Filter gadgets that don't belong to given organization.
    Also filter gadgets that are not certificated!
    Also filters depending on the scope of the search (it could be mashup, gadget, all, ...)
    """

    return [r for r in resources if _filter_resource_by_organization(r, user, organization_list, scope)]


def get_sortedlist(list, orderby):
    """Returns a list ordered by the criteria passed as parameter."""
    if orderby == '-creation_date':
        list.sort(lambda x, y: cmp(y.creation_date, x.creation_date))
    elif orderby == 'short_name':
        list.sort(lambda x, y: cmp(x.short_name.lower(), y.short_name.lower()))
    elif orderby == 'vendor':
        list.sort(lambda x, y: cmp(x.vendor.lower(), y.vendor.lower()))
    elif orderby == 'author':
        list.sort(lambda x, y: cmp(x.author.lower(), y.author.lower()))
    elif orderby == '-popularity':
        list.sort(lambda x, y: cmp(y.popularity, x.popularity))
    return list


def get_paginatedlist(gadgetlist, pag, offset):
    """Returns a list paginated with the parameters pag and offset."""
    a = int(pag)
    b = int(offset)
    if a != 0 and b != 0:
        c = ((a - 1) * b)
        d = (b * a)
        if a == 1:
            c = 0
        gadgetlist = gadgetlist[c:d]

    return gadgetlist


def get_and_list(criterialist, user):
    """Returns a list of gadgets that match all the criteria in the list passed as parameter."""

    # List of the gadgets that match the criteria in the database table CatalogueResource
    criteria_filter = Q()

    criterialist = criterialist.split()
    for e in criterialist:
        criteria_filter = criteria_filter & (Q(short_name__icontains=e) | Q(vendor__icontains=e) | Q(author__icontains=e) | Q(mail__icontains=e) | Q(description__icontains=e) | Q(version__icontains=e) | Q(usertag__tag__name__icontains=e))

    return CatalogueResource.objects.filter(criteria_filter)


def get_or_list(criterialist, user):
    """Returns a list of gadgets that match any of the criteria in the list passed as parameter."""
    criteria_filter = Q()

    criterialist = criterialist.split()

    for e in criterialist:
        criteria_filter = criteria_filter | (Q(short_name__icontains=e) | Q(vendor__icontains=e) | Q(author__icontains=e) | Q(mail__icontains=e) | Q(description__icontains=e) | Q(version__icontains=e) | Q(usertag__tag__name__icontains=e))

    return CatalogueResource.objects.filter(criteria_filter)


def get_not_list(criterialist, user):
    """Returns a list of gadgets that don't match any of the criteria in the list passed as parameter."""
    criteria_filter = Q()

    criterialist = criterialist.split()

    for e in criterialist:
        criteria_filter = criteria_filter & ~(Q(short_name__icontains=e) | Q(vendor__icontains=e) | Q(author__icontains=e) | Q(mail__icontains=e) | Q(description__icontains=e) | Q(version__icontains=e) | Q(usertag__tag__name__icontains=e))

    return CatalogueResource.objects.filter(criteria_filter)


def get_resource_response(resources, format, items, user):
    """Obtains all the information related to a gadget encoded in the properly format (json or xml)."""

    if format == 'json' or format == 'default':
        data = {'resources': [get_resource_group_data(group, user) for group in resources]}
        response = HttpResponse(json_encode(data), mimetype='application/json; charset=UTF-8')
        response.__setitem__('items', items)
        return response
    elif format == 'xml':
        response = get_xml_description(resources, user)
        response = HttpResponse(response, mimetype='text/xml; charset=UTF-8')
        response.__setitem__('items', items)
        return response
    else:
        return HttpResponseServerError(get_xml_error(_("Invalid format. Format must be either xml or json")), mimetype='application/xml; charset=UTF-8')


def get_tag_response(gadget, user, format):
    """Obtains the all the tags related to a gadget encoded in
    the properly format (json or xml).
    """
    if format == 'json' or format == 'default':
        tag = {}
        tag_data_list = get_tag_data(gadget, user.id)
        tag['tagList'] = tag_data_list
        return HttpResponse(json_encode(tag), mimetype='application/json; charset=UTF-8')
    elif format == 'xml':
        response = '<?xml version="1.0" encoding="UTF-8" ?>\n'
        response += get_tags_by_resource(gadget, user)
        return HttpResponse(response, mimetype='text/xml; charset=UTF-8')
    else:
        return HttpResponseServerError(get_xml_error(_("Invalid format. Format must be either xml or json")), mimetype='application/xml; charset=UTF-8')


def get_vote_response(gadget, user, format):
    """Obtains the vote related to a gadget and a user encoded in the properly format (json or xml)."""

    if format == 'json' or format == 'default':
        vote = {}
        vote_data = get_vote_data(gadget, user)
        vote['voteData'] = vote_data
        return HttpResponse(json_encode(vote), mimetype='application/json; charset=UTF-8')
    elif format == 'xml':
        response = '<?xml version="1.0" encoding="UTF-8" ?>\n'
        response += get_vote_by_resource(gadget, user)
        return HttpResponse(response, mimetype='text/xml; charset=UTF-8')
    else:
        return HttpResponseServerError(get_xml_error(_("Invalid format. Format must be either xml or json")), mimetype='application/xml; charset=UTF-8')


def get_all_resource_versions(vendor, name):
    """Returns all the versions of a specified resource name (formed by vendor and name)."""

    versions = CatalogueResource.objects.filter(vendor=vendor, short_name=name).values_list('version', flat=True)

    # convert from ["1.9", "1.10", "1.9.1"] to [[1,9], [1,10], [1,9,1]] to
    # allow comparing integers
    return [map(int, v.split('.')) for v in versions]


def get_latest_resource_version(name, vendor):

    resource_versions = CatalogueResource.objects.filter(vendor=vendor, short_name=name)
    if resource_versions.count() > 0:
        # convert from ["1.9", "1.10", "1.9.1"] to [[1,9], [1,10], [1,9,1]] to
        # allow comparing integers
        versions = [map(int, r.version.split(".")) for r in resource_versions]

        index = 0
        for k in range(len(versions)):
            if max(versions[index], versions[k]) == versions[k]:
                index = k

        return resource_versions[index]

    return None


def get_gadget_popularity(votes_sum, votes_number):
    if votes_number == 0:
        return 0

    floor = votes_sum // votes_number
    mod = votes_sum % votes_number
    mod = mod / votes_number

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
    popularity = get_gadget_popularity(votes_sum, votes_number)
    #Update the gadget in the database
    gadget.popularity = unicode(popularity)
    gadget.save()
