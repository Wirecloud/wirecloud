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

import sys
import os
from shutil import rmtree
import re
import settings

from urllib import url2pathname

from django.contrib.auth.models import User
from django.http import HttpResponse, HttpResponseServerError, HttpResponseForbidden, HttpResponseBadRequest
from django.shortcuts import get_object_or_404, get_list_or_404
from django.db import transaction
from django.db import IntegrityError
from django.db.models import Q
from django.utils import simplejson

from django.utils.translation import ugettext as _

from commons.resource import Resource

from xml.sax import make_parser
from xml.sax.xmlreader import InputSource

from catalogue.models import *
from catalogue.templateParser import TemplateParser
from catalogue.tagsParser import TagsXMLHandler
from catalogue.catalogue_utils import *
from catalogue.get_json_catalogue_data import get_available_apps_info

from commons.authentication import user_authentication, Http403
from commons.exceptions import TemplateParseException
from commons.logs import log
from commons.logs_exception import TracedServerError
from commons.utils import get_xml_error, json_encode
from commons.http_utils import PUT_parameter
from commons.user_utils import get_verified_certification_group

from django.contrib.auth.decorators import login_required
    
class GadgetsCollection(Resource):

    @transaction.commit_manually
    def create(self, request, user_name, fromWGT = False):
		
        user = user_authentication(request, user_name)
        if not request.POST.has_key('template_uri'):
            msg = _("template_uri param expected")
            json = {"message": msg, "result": "error"}
            return HttpResponseBadRequest(json_encode(json), mimetype='application/json; charset=UTF-8')        template_uri = request.REQUEST.__getitem__('template_uri')
        templateParser = None

        try:
            templateParser = TemplateParser(template_uri, user, fromWGT=fromWGT)
            templateParser.parse()
            transaction.commit()

        except IntegrityError, e:
            # Gadget already exists. Rollback transaction
            transaction.rollback()    
            #This is not an error! It returns the same as a successfull request!

        except TemplateParseException, e:
            transaction.rollback()
            msg = _("Problem parsing template xml: %(errorMsg)s") %{'errorMsg':e.msg}
            raise TracedServerError(e, {'template_uri': template_uri}, request, msg)

        except Exception, e:
            # Internal error
            transaction.rollback()
            msg = _("Problem parsing template xml: %(errorMsg)s") % {'errorMsg': str(e)}
            raise TracedServerError(e, {'template_uri': template_uri}, request, msg)

        #Returning info to the catalogue of the created gadget!
        contratable = str(templateParser.is_contratable()).lower()
        
        gadget = templateParser.get_gadget()
        
        gadgetName = gadget.short_name
        version = gadget.version
        vendor = gadget.vendor
        gadgetId = gadget.id
        mashupId = ""
        if gadget.mashup_id:
            mashupId = gadget.mashup_id
        
        #Managing available Applications
        availableApps = simplejson.dumps(get_available_apps_info())
        
        #Inform about the last version of the gadget.
        last_version = get_last_gadget_version(gadget.short_name, gadget.vendor)

        json_ok = '{"result": "ok", "contratable": %s, "availableApps": %s, "templateUrl": "%s", "gadgetName": "%s", "gadgetId": %s, "vendor": "%s", "version": "%s", "last_version": "%s", "mashupId": "%s"}' \
            % (contratable, availableApps, template_uri, gadgetName, gadgetId, vendor, version, last_version, mashupId)
        
        return HttpResponse(json_ok,mimetype='application/json; charset=UTF-8')


    def read(self, request, user_name, pag=0, offset=0):
        user = user_authentication(request, user_name)

        try:
            format = request.GET.__getitem__('format')
        except:
            format = 'default'

        try:
            orderby = request.GET.__getitem__('orderby')
        except:
            orderby = '-creation_date'
        
        try:
            scope = request.GET.__getitem__('scope')
        except:
            scope = 'all'

        #paginate
        a= int(pag)
        b= int(offset)

        # Get all the gadgets in the catalogue
        gadgetlist = get_resources_that_must_be_shown(user=user).order_by(orderby)
        gadgetlist = filter_gadgets_by_organization(user, gadgetlist, user.groups.all(), scope)
        items = len(gadgetlist)
        
        if not(a == 0 or b == 0):
        # Get the requested gadgets
            c=((a-1)*b)
            d= (b*a)

            if a==1:
                c=0
            gadgetlist = gadgetlist[c:d]
            
        return get_resource_response(gadgetlist, format, items, user)

    def delete(self, request, user_name, vendor, name, version=None):

        user = user_authentication(request, user_name)
        
        if version != None:
            #Delete only the specified version of the gadget 
            resource=get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version)
            deleteOneGadget(resource, user, request)
        else:
            #Delete all versions of the gadget
            resources=get_list_or_404(GadgetResource, short_name=name,vendor=vendor)
            for resource in resources:
                deleteOneGadget(resource, user, request)
        
        json_ok = '{"result":"ok"}'
        return HttpResponse(json_ok, mimetype='application/json; charset=UTF-8')
    
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

@transaction.commit_on_success
def deleteOneGadget(resource, user, request):
    try:
        #Delete data from Application model         
        apps = Application.objects.filter(resources=resource)
            
        for app in apps:
            app.remove_resource(resource)
        
        # Delete the gadget only if this user is the owner
        userRelated = UserRelatedToGadgetResource.objects.get(gadget=resource, user=user, added_by=True)
        # Delete the related user information to that gadget
        userRelated.delete()
        # Delete the related wiring information for that gadget
        GadgetWiring.objects.filter(idResource=resource.id).delete()
        
        # Delete the related tags for that gadget
        
        #if there is no more gadgets tagged with these tags, delete the Tag
        resourceTags = UserTag.objects.filter(idResource=resource.id)
        for t in resourceTags:
            #if UserTag.objects.filter(tag = t.tag).count() == 1:
            #    t.tag.delete()
            t.delete()
        
        # Delete the related votes for that gadget
        UserVote.objects.filter(idResource=resource.id).delete()
        # Delete the gadget if it is saved in the platform 
        if resource.fromWGT:
            # pattern /deployment/gadgets/(username)/(vendor)/(name)/(version)/...
            exp = re.compile('[/]?(?P<path>.+/.+/.+/.+/.+/.+/).*$')
            if exp.search(resource.template_uri):
                v = exp.search(resource.template_uri)
                path = url2pathname(v.group('path'))
                path = os.path.join(settings.BASEDIR, path).encode("utf8")
                if os.path.isdir(path):
                    rmtree(path)
        
        # Delete the object
        resource.delete()
        
    except UserRelatedToGadgetResource.DoesNotExist, e:
        #the user is not the owner
        msg = _("user %(username)s is not the owner of the resource %(resource_id)s") %{'username':user.username, 'resource_id':resource.id}

        raise TracedServerError(e, {'resource_id': resource.id, 'username': user.username}, request, msg)


class GadgetsCollectionBySimpleSearch(Resource):

    def read(self, request, user_name,criteria, pag=0, offset=0):

        user = user_authentication(request, user_name)

        try:
            orderby = request.GET.__getitem__('orderby')
        except:
            orderby = '-creation_date'

        try:
            format = request.GET.__getitem__('format')
        except:
            format = 'default'
        
        try:
            scope = request.GET.__getitem__('scope')
        except:
            scope = 'all'

        if criteria == 'connectEventSlot':
            search_criteria = request.GET.getlist('search_criteria')
        else:
            search_criteria = request.GET.__getitem__('search_criteria')

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
                gadgetlist += get_resources_that_must_be_shown(user=user).filter(usertag__tag__name__icontains = e)

        elif criteria == 'connectSlot':
            #get all the gadgets compatible with the given events
            search_criteria = search_criteria.split()
            for e in search_criteria:
                gadgetlist += get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode = e), Q(gadgetwiring__wiring = 'out'))

        elif criteria == 'connectEvent':
            #get all the gadgets compatible with the given slots
            search_criteria = search_criteria.split()
            for e in search_criteria:
                gadgetlist += get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode = e), Q(gadgetwiring__wiring = 'in'))

        elif criteria == 'connectEventSlot':
            #get all the gadgets compatible with the given slots
            search_criteria[0] = search_criteria[0].split()
            for e in search_criteria[0]:
                gadgetlist += get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode = e), Q(gadgetwiring__wiring = 'in'))
            #get all the gadgets compatible with the given events
            search_criteria[1] = search_criteria[1].split()
            for e in search_criteria[1]:
                gadgetlist += get_resources_that_must_be_shown(user=user).filter(Q(gadgetwiring__friendcode = e), Q(gadgetwiring__wiring = 'out'))

        gadgetlist = get_uniquelist(gadgetlist)
        
        gadgetlist = filter_gadgets_by_organization(user, gadgetlist, user.groups.all(), scope)
        
        items = len(gadgetlist)
        gadgetlist = get_sortedlist(gadgetlist, orderby)
        gadgetlist = get_paginatedlist(gadgetlist, pag, offset)

        return get_resource_response(gadgetlist, format, items, user)


class GadgetsCollectionByGlobalSearch(Resource):

    def read(self, request, user_name, pag=0, offset=0):

        user = user_authentication(request, user_name)

        try:
            orderby = request.GET.__getitem__('orderby')
        except:
            orderby = '-creation_date'

        try:
            format = request.GET.__getitem__('format')
        except:
            format = 'default'
        
        try:
            scope = request.GET.__getitem__('scope')
        except:
            scope = 'all'

        search_criteria = request.GET.getlist('search_criteria')
        search_boolean = request.GET.__getitem__('search_boolean')

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
                taglist += get_resources_that_must_be_shown(user=user).filter(usertag__tag__name__icontains = e)
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
        if search_boolean=="AND":
            gadgetlist = get_uniquelist(gadgetlist,fields)
        else:
            gadgetlist = get_uniquelist(gadgetlist)
        
        gadgetlist = filter_gadgets_by_organization(user, gadgetlist, user.groups.all(), scope)
        items = len(gadgetlist)
        
        gadgetlist = get_sortedlist(gadgetlist, orderby)
        gadgetlist = get_paginatedlist(gadgetlist, pag, offset)

        return get_resource_response(gadgetlist, format, items, user)


class GadgetTagsCollection(Resource):
    
    def create(self,request, user_name, vendor, name, version):

        try:
            format = request.POST.__getitem__('format')
        except:
            format = 'default'
        
        user = user_authentication(request, user_name)
        
        # Get the xml containing the tags from the request
        tags_xml = request.POST.__getitem__('tags_xml')

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
                tag, created = Tag.objects.get_or_create(name=e)
                UserTag.objects.get_or_create(tag=tag, idUser=user, idResource=gadget)
            except Exception, ex:
                transaction.rollback()
                msg = _("Error tagging resource!!") 
                
                raise TracedServerError(ex, {'resource': vendor + name + version, 'tags': tags_xml}, request, msg)

        return get_tag_response(gadget,user, format)


    def read(self,request,user_name,vendor,name,version):

        try:
            format = request.GET.__getitem__('format')
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
            format = request.GET.__getitem__('format')
        except:
            format = 'default'

        gadget = get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version).id
        userTag = get_object_or_404(UserTag, id=tag)

        #if there is no more gadgets tagged by an user with this tag, delete the Tag
        if UserTag.objects.filter(tag = userTag.tag).count() == 1:
            userTag.tag.delete()
            
        userTag.delete()
        
        return get_tag_response(gadget,user, format)


class GadgetVotesCollection(Resource):

    def create(self,request, user_name, vendor, name, version):

        try:
            format = request.GET.__getitem__('format')
        except:
            format = 'default'

        user = user_authentication(request, user_name)

        # Get the vote from the request
        vote = request.POST.__getitem__('vote')

        # Get the gadget's id for those vendor, name and version
        gadget = get_object_or_404(GadgetResource, short_name=name,vendor=vendor,version=version)

        # Insert the vote for these resource and user in the database
        try:
            UserVote.objects.create(vote=vote, idUser=user, idResource=gadget)
        except Exception, ex:
            log (ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)), mimetype='application/xml; charset=UTF-8')

        try:
            update_gadget_popularity(gadget)
        except Exception, ex:
            log (ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)), mimetype='application/xml; charset=UTF-8')

        return get_vote_response(gadget,user, format)


    def read(self,request,user_name,vendor,name,version):

        try:
            format = request.GET.__getitem__('format')
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
            update_gadget_popularity(gadget)
        except Exception, ex:
            log (ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)), mimetype='application/xml; charset=UTF-8')

        return get_vote_response(gadget,user, format)

class GadgetVersionsCollection(Resource):
    def create(self, request, user_name):
        gadgets = simplejson.loads(request.POST["gadgets"]);
        result = []
        for g in gadgets:
            version = get_last_gadget_version(g["name"], g["vendor"])
            if version: #the gadget is still in the catalogue
                g["lastVersion"] = version
                url = GadgetResource.objects.get(short_name=g["name"], vendor=g["vendor"], version=version).template_uri
                g["lastVersionURL"] = url
                result.append(g)
        json_result = {'gadgets': result}
        return HttpResponse (json_encode(json_result), mimetype='application/json; charset=UTF-8')
        
class ResourceEnabler(Resource):
    def read(self, request, resource_id):
        resource = get_object_or_404(GadgetResource, id=resource_id)
        
        resource.certification = get_verified_certification_group()
        
        resource.save()
        
        return HttpResponse('{"result": "ok"}', mimetype='application/json; charset=UTF-8')

class ApplicationManager(Resource):
    def read(self, request, user_name, application_id, resource_id):
        pass
    
    def create(self, request, user_name, application_id, resource_id):
        try:
            application = Application.objects.get(app_code=application_id)
            resource = GadgetResource.objects.get(id=resource_id)
            application.add_resource(resource)
            
            return HttpResponse('{"result": "ok"}', mimetype='application/json; charset=UTF-8')
        except Application.DoesNotExist, GadgetResource.DoesNotExist:
            return HttpResponseServerError('{"result": "error"}', mimetype='application/json; charset=UTF-8')
