# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telefónica Investigación y Desarrollo 
#     S.A.Unipersonal (Telefónica I+D) 
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

import sys

from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseServerError, HttpResponseForbidden
from django.shortcuts import get_object_or_404, get_list_or_404
from django.db import transaction
from django.db import IntegrityError
from django.db.models import Q

from django.utils.translation import ugettext as _

from commons.resource import Resource

from xml.sax import make_parser
from xml.sax.xmlreader import InputSource

from catalogue.models import GadgetResource, GadgetWiring, UserRelatedToGadgetResource, UserTag, UserVote
from catalogue.templateParser import TemplateParser
from catalogue.tagsParser import TagsXMLHandler
from catalogue.catalogue_utils import *
from commons.authentication import user_authentication, Http403
from commons.exceptions import TemplateParseException
from commons.logs import log
from commons.utils import get_xml_error
from commons.http_utils import PUT_parameter

class GadgetsCollection(Resource):

    @transaction.commit_manually
    def create(self,request, user_name):

        user = user_authentication(request, user_name)

        template_uri = request.__getitem__('template_uri')
        templateParser = None

        try:
            templateParser = TemplateParser(template_uri, user)
            templateParser.parse()
            transaction.commit()
        except IntegrityError, e:
            # Gadget already exists. Rollback transaction
            transaction.rollback()
            log(e, request)
            return HttpResponseServerError(get_xml_error(unicode(sys.exc_info()[1])), mimetype='application/xml; charset=UTF-8')
        except TemplateParseException, e:
            transaction.rollback()
            log(e, request)
            return HttpResponseServerError(get_xml_error(unicode(e)), mimetype='application/xml; charset=UTF-8')
        except Exception, e:
            # Internal error
            transaction.rollback()
            log(e, request)
            return HttpResponseServerError(get_xml_error(unicode(sys.exc_info()[1])), mimetype='application/xml; charset=UTF-8')

        xml_ok = '<ResponseOK>OK</ResponseOK>'
        return HttpResponse(xml_ok,mimetype='application/xml; charset=UTF-8')


    def read(self, request, user_name, pag=0, offset=0):
        user = user_authentication(request, user_name)

        try:
            format = request.__getitem__('format')
        except:
            format = 'default'

        try:
            orderby = request.__getitem__('orderby')
        except:
            orderby = '-creation_date'

        #paginate
        a= int(pag)
        b= int(offset)

        items = get_resources_that_must_be_shown(user=user).count()

        # Get all the gadgets in the catalogue
        if a == 0 or b == 0:
            gadgetlist = get_resources_that_must_be_shown(user=user).order_by(orderby)
        # Get the requested gadgets
        else:
            c=((a-1)*b)
            d= (b*a)

            if a==1:
                c=0
            gadgetlist = get_resources_that_must_be_shown(user=user).order_by(orderby)[c:d]

        return get_resource_response(gadgetlist, format, items, user)


    def delete(self, request, user_name, vendor, name, version=None):

        user = user_authentication(request, user_name)
        
        if version != None:
            #Delete only the specified version of the gadget 
            resource=get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version)
            deleteOneGadget(resource, user)
        else:
            #Delete all versions of the gadget
            resources=get_list_or_404(GadgetResource, short_name=name,vendor=vendor)
            for resource in resources:
                deleteOneGadget(resource, user)
        
        xml_ok = '<ResponseOK>OK</ResponseOK>'
        return HttpResponse(xml_ok,mimetype='text/xml; charset=UTF-8')
    
    def update(self, request, user_name, vendor, name, version):
        user = user_authentication(request, user_name)
        
        # Get the gadget data from the request
        preferred = PUT_parameter(request, 'preferred')
        
        if preferred != None:
            # Set all version of this gadget as no preferred 
            old_preferred_versions = UserRelatedToGadgetResource.objects.filter( 
                gadget__vendor=vendor, gadget__short_name=name, user=user, preferred_by=True)
            for old_version in old_preferred_versions:
                old_version.preferred_by = False
                old_version.save()
            
            new_preferred_versions = UserRelatedToGadgetResource.objects.filter(gadget__vendor=vendor, gadget__short_name=name, gadget__version=version, user=user)
            
            userRelated = None
            if len(new_preferred_versions) == 0:
                resource = get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version)
                userRelated = UserRelatedToGadgetResource ()
                userRelated.gadget = resource;
                userRelated.user = user
                userRelated.added_by = False
            else:
                userRelated = new_preferred_versions[0]
            
            userRelated.preferred_by = True
            userRelated.save()
            
            xml_ok = '<ResponseOK>OK</ResponseOK>'
            return HttpResponse(xml_ok,mimetype='text/xml; charset=UTF-8')


def deleteOneGadget(resource, user):
    try:
        # Delete the gadget only if this user is the owner
        userReleted = UserRelatedToGadgetResource.objects.get(gadget=resource, user=user, added_by=True)
        # Delete the related user information to that gadget
        userReleted.delete()
        # Delete the related wiring information for that gadget
        GadgetWiring.objects.filter(idResource=resource.id).delete()
        # Delete the related tags for that gadget
        UserTag.objects.filter(idResource=resource.id).delete()
        # Delete the related votes for that gadget
        UserVote.objects.filter(idResource=resource.id).delete()
        # Delete the object
        resource.delete()
    except UserRelatedToGadgetResource.DoesNotExist:
        #Do nothing, the user is not the owner
        pass


class GadgetsCollectionBySimpleSearch(Resource):

    def read(self, request, user_name,criteria, pag=0, offset=0):

        user = user_authentication(request, user_name)

        try:
            orderby = request.__getitem__('orderby')
        except:
            orderby = '-creation_date'

        try:
            format = request.__getitem__('format')
        except:
            format = 'default'

        search_criteria = request.__getitem__('search_criteria')

        gadgetlist = []

        if criteria == 'and':
            gadgetlist= get_and_list(search_criteria, user)
        elif (criteria == 'or' or criteria=='simple_or'):
            gadgetlist= get_or_list(search_criteria, user)
        elif criteria == 'not':
            gadgetlist= get_not_list(search_criteria, user)
        elif criteria == 'event':
            #get all the gadgets that match any of the given events
            search_criteria = search_criteria.split()
            for e in search_criteria:
                gadgetlist += get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode__icontains = e), Q(gadgetwiring__wiring = 'out'))

        elif criteria == 'slot':
            #get all the gadgets that match any of the given slots
            search_criteria = search_criteria.split()
            for e in search_criteria:
                gadgetlist += get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode__icontains = e), Q(gadgetwiring__wiring = 'in'))

        elif criteria == 'tag':
            #get all the gadgets that match any of the given tags
            search_criteria = search_criteria.split()
            for e in search_criteria:
                gadgetlist += get_resources_that_must_be_shown(user=user).filter(usertag__tag__icontains = e)

        elif criteria == 'connectSlot':
            #get all the gadgets compatible with the given event
            gadgetlist = get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode = search_criteria), Q(gadgetwiring__wiring = 'out'))

        elif criteria == 'connectEvent':
            #get all the gadgets compatible with the given slot
            gadgetlist = get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode = search_criteria), Q(gadgetwiring__wiring = 'in'))

        gadgetlist = get_uniquelist(gadgetlist)
        gadgetlist = get_sortedlist(gadgetlist, orderby)
        gadgetlist = get_paginatedlist(gadgetlist, pag, offset)
        items = len(gadgetlist)

        return get_resource_response(gadgetlist, format, items, user)


class GadgetsCollectionByGlobalSearch(Resource):

    def read(self, request, user_name, pag=0, offset=0):

        user = user_authentication(request, user_name)

        try:
            orderby = request.__getitem__('orderby')
        except:
            orderby = '-creation_date'

        try:
            format = request.__getitem__('format')
        except:
            format = 'default'

        search_criteria = request.GET.getlist('search_criteria')

        andlist = []
        orlist = []
        notlist = []
        taglist = []
        eventlist = []
        slotlist = []
        # This variable counts the number of criteria for the search to be passed as a parameter to the function
        # get_uniquelist in order to get the gadgets that match the number of criteria
        fields = 0

        if (search_criteria[0] != ""):
            andlist = get_and_list(search_criteria[0], user)
            fields = fields+1
        if (search_criteria[1] != ""):
            orlist = get_or_list(search_criteria[1], user)
            fields = fields+1
        if (search_criteria[2] != ""):
            notlist = get_not_list(search_criteria[2], user)
            fields = fields+1
        if (search_criteria[3] != ""):
            #get all the gadgets that match any of the given tags
            criteria = search_criteria[3].split()
            for e in criteria:
                taglist += get_resources_that_must_be_shown(user=user).filter(usertag__tag__icontains = e)
            taglist = get_uniquelist(taglist)
            fields = fields+1
        if (search_criteria[4] != ""):
            #get all the gadgets that match any of the given events
            criteria = search_criteria[4].split()
            for e in criteria:
                eventlist += get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode__icontains = e), Q(gadgetwiring__wiring = 'out'))
            eventlist = get_uniquelist(eventlist)
            fields = fields+1
        if (search_criteria[5] != ""):
            #get all the gadgets that match any of the given slots
            criteria = search_criteria[5].split()
            for e in criteria:
                slotlist += get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode__icontains = e), Q(gadgetwiring__wiring = 'in'))
            slotlist = get_uniquelist(slotlist)
            fields = fields+1

        gadgetlist = andlist+orlist+notlist+taglist+eventlist+slotlist
        gadgetlist = get_uniquelist(gadgetlist,fields)
        gadgetlist = get_sortedlist(gadgetlist, orderby)
        gadgetlist = get_paginatedlist(gadgetlist, pag, offset)
        items = len(gadgetlist)

        return get_resource_response(gadgetlist, format, items, user)


class GadgetTagsCollection(Resource):

    def create(self,request, user_name, vendor, name, version):

        try:
            format = request.__getitem__('format')
        except:
            format = 'default'
        
        user = user_authentication(request, user_name)
        
        # Get the xml containing the tags from the request
        tags_xml = request.__getitem__('tags_xml')

        tags_xml = tags_xml.encode("utf-8")
        # Parse the xml containing the tags
        parser = make_parser()
        handler = TagsXMLHandler()
        
        # Tell the parser to use our handler
        parser.setContentHandler(handler)

        # Parse the input
        try:
            from StringIO import StringIO
        except ImportError:
            from cStringIO import StringIO

        inpsrc = InputSource()
        inpsrc.setByteStream(StringIO(tags_xml))
        parser.parse(inpsrc)

        # Get the gadget's id for those vendor, name and version
        gadget = get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version)

        # Insert the tags for these resource and user in the database
        for e in handler._tags:
            try:
                UserTag.objects.get_or_create(tag=e, idUser=user, idResource=gadget)
            except Exception, ex:
                log (ex, request)
                return HttpResponseServerError(get_xml_error(unicode(ex)), mimetype='application/xml; charset=UTF-8')

        return get_tag_response(gadget,user, format)


    def read(self,request,user_name,vendor,name,version):

        try:
            format = request.__getitem__('format')
        except:
            format = 'default'

        # Get the gadget's id for those vendor, name and version
        gadget = get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version).id

        # Get the user's id for that user_name
        user = user_authentication(request, user_name)

        return get_tag_response(gadget,user, format)


    def delete(self,request,user_name,vendor,name,version, tag):

        try:
            user = user_authentication(request, user_name)
        except Http403, e:
            msg = _("This tag cannot be deleted: ") + unicode(e)
            log (msg, request)
            return HttpResponseForbidden(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

        try:
            format = request.__getitem__('format')
        except:
            format = 'default'

        gadget = get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version).id
        tag = get_object_or_404(UserTag, id=tag)

        tag.delete()

        return get_tag_response(gadget,user, format)


def update_popularity(gadget):
    #Get all the votes on this gadget
    votes = UserVote.objects.filter(idResource=gadget)
    #Get the number of votes
    votes_number = UserVote.objects.filter(idResource=gadget).count()
    #Sum all the votes
    votes_sum = 0.0
    for e in votes:
        votes_sum = votes_sum + e.vote
    #Calculate the gadget popularity
    popularity = get_popularity(votes_sum,votes_number)
    #Update the gadget in the database
    gadget.popularity = popularity
    gadget.save()


def get_popularity(votes_sum, votes_number):
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


class GadgetVotesCollection(Resource):

    def create(self,request, user_name, vendor, name, version):

        try:
            format = request.__getitem__('format')
        except:
            format = 'default'

        user = user_authentication(request, user_name)

        # Get the vote from the request
        vote = request.__getitem__('vote')

        # Get the gadget's id for those vendor, name and version
        gadget = get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version)

        # Insert the vote for these resource and user in the database
        try:
            UserVote.objects.create(vote=vote, idUser=user, idResource=gadget)
        except Exception, ex:
            log (ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)), mimetype='application/xml; charset=UTF-8')

        try:
            update_popularity(gadget)
        except Exception, ex:
            log (ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)), mimetype='application/xml; charset=UTF-8')

        return get_vote_response(gadget,user, format)


    def read(self,request,user_name,vendor,name,version):

        try:
            format = request.__getitem__('format')
        except:
            format = 'default'

        # Get the gadget's id for those vendor, name and version
        gadget = get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version)

        # Get the user's id for that user_name
        user = user_authentication(request, user_name)

        return get_vote_response(gadget,user, format)


    def update(self,request,user_name,vendor,name,version):

        try:
            format = PUT_parameter(request, 'format')
        except:
            format = 'default'

        user = user_authentication(request, user_name)

        # Get the vote from the request
        vote = PUT_parameter(request, 'vote') 

        # Get the gadget's id for those vendor, name and version
        gadget = get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version)

        # Insert the vote for these resource and user in the database
        try:
            userVote = get_object_or_404(UserVote, idUser=user, idResource=gadget)
            userVote.vote = vote
            userVote.save()
        except Exception, ex:
            log (ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)), mimetype='application/xml; charset=UTF-8')

        try:
            update_popularity(gadget)
        except Exception, ex:
            log (ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)), mimetype='application/xml; charset=UTF-8')

        return get_vote_response(gadget,user, format)

