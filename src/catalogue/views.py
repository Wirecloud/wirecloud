
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

from xml.sax import make_parser
from xml.sax.xmlreader import InputSource

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import HttpResponse, HttpResponseForbidden
from django.http import  HttpResponseBadRequest, HttpResponseServerError
from django.shortcuts import get_object_or_404, get_list_or_404
from django.utils import simplejson
from django.utils.translation import ugettext as _

from catalogue.models import CatalogueResource
from catalogue.models import Tag, UserTag, UserVote
from catalogue.tagsParser import TagsXMLHandler
from catalogue.catalogue_utils import get_latest_resource_version
from catalogue.catalogue_utils import get_resource_response, filter_resources_by_organization
from catalogue.catalogue_utils import get_and_list, get_or_list, get_not_list
from catalogue.catalogue_utils import get_uniquelist, get_sortedlist, get_paginatedlist
from catalogue.catalogue_utils import get_tag_response, update_resource_popularity
from catalogue.catalogue_utils import get_vote_response, group_resources
from catalogue.utils import add_resource_from_template_uri, delete_resource, get_added_resource_info
from commons.authentication import user_authentication, Http403
from commons.exceptions import TemplateParseException
from commons.http_utils import PUT_parameter
from commons.logs import log
from commons.logs_exception import TracedServerError
from commons.resource import Resource
from commons.user_utils import get_verified_certification_group
from commons.utils import get_xml_error, json_encode


class ResourceCollection(Resource):

    @transaction.commit_manually
    def create(self, request, user_name, fromWGT=False):
        user = user_authentication(request, user_name)
        if 'template_uri' not in request.POST:
            msg = _("template_uri param expected")
            json = {"message": msg, "result": "error"}
            return HttpResponseBadRequest(json_encode(json), mimetype='application/json; charset=UTF-8')
        template_uri = request.POST['template_uri']
        templateParser = None

        try:
            templateParser, resource = add_resource_from_template_uri(template_uri, user, fromWGT=fromWGT)

        except IntegrityError, e:
            # Resource already exists. Rollback transaction
            transaction.rollback()
            json_response = {
                "result": "error",
                "message": _('Gadget already exists!'),
            }
            return HttpResponseBadRequest(simplejson.dumps(json_response),
                                          mimetype='application/json; charset=UTF-8')

        except TemplateParseException, e:
            transaction.rollback()
            msg = _("Problem parsing template xml: %(errorMsg)s") % {'errorMsg': e.msg}
            raise TracedServerError(e, {'template_uri': template_uri}, request, msg)

        except Exception, e:
            # Internal error
            transaction.rollback()
            msg = _("Problem parsing template xml: %(errorMsg)s") % {'errorMsg': str(e)}
            raise TracedServerError(e, {'template_uri': template_uri}, request, msg)

        json_response = get_added_resource_info(resource, user)

        # get_added_resource_info can make changes in the db
        transaction.commit()

        return HttpResponse(simplejson.dumps(json_response),
                            mimetype='application/json; charset=UTF-8')

    def read(self, request, user_name, pag=0, offset=0):

        user = user_authentication(request, user_name)

        format = request.GET.get('format', 'default')
        orderby = request.GET.get('orderby', '-creation_date')
        scope = request.GET.get('scope', 'all')

        # Get all resource in the catalogue
        resources = CatalogueResource.objects.all().order_by(orderby)
        resources = group_resources(resources)
        resources = filter_resources_by_organization(user, resources, user.groups.all(), scope)
        items = len(resources)

        resources = get_paginatedlist(resources, int(pag), int(offset))

        return get_resource_response(resources, format, items, user)

    @transaction.commit_on_success
    def delete(self, request, user_name, vendor, name, version=None):

        user = user_authentication(request, user_name)

        response_json = {'result': 'ok', 'removedIGadgets': []}
        if version != None:
            #Delete only the specified version of the gadget
            resource = get_object_or_404(CatalogueResource, short_name=name,
                                         vendor=vendor, version=version)
            result = delete_resource(resource, user)
            response_json['removedIGadgets'] = result['removedIGadgets']
        else:
            #Delete all versions of the gadget
            resources = get_list_or_404(CatalogueResource, short_name=name, vendor=vendor)
            for resource in resources:
                result = delete_resource(resource, user)
                response_json['removedIGadgets'] += result['removedIGadgets']

        return HttpResponse(simplejson.dumps(response_json),
                            mimetype='application/json; charset=UTF-8')


class ResourceCollectionBySimpleSearch(Resource):

    def read(self, request, user_name, criteria, pag=0, offset=0):

        user = user_authentication(request, user_name)

        orderby = request.GET.get('orderby', '-creation_date')
        format = request.GET.get('format', 'default')
        scope = request.GET.get('scope', 'all')

        if criteria == 'connectEventSlot':
            search_criteria = request.GET.getlist('search_criteria')
        else:
            search_criteria = request.GET.get('search_criteria')

        resources = CatalogueResource.objects.none()

        if criteria == 'and':
            resources = get_and_list(search_criteria, user)
        elif criteria == 'or' or criteria == 'simple_or':
            resources = get_or_list(search_criteria, user)
        elif criteria == 'not':
            resources = get_not_list(search_criteria, user)
        elif criteria == 'event':
            # get all resource matching any of the given events
            search_criteria = search_criteria.split()
            for e in search_criteria:
                resources = CatalogueResource.objects.filter(
                    Q(gadgetwiring__friendcode__icontains=e),
                    Q(gadgetwiring__wiring='out'))

        elif criteria == 'slot':
            # get all resource matching any of the given slots
            search_criteria = search_criteria.split()
            for e in search_criteria:
                resources = CatalogueResource.objects.filter(
                    Q(gadgetwiring__friendcode__icontains=e),
                    Q(gadgetwiring__wiring='in'))

        elif criteria == 'tag':
            # get all resource matching any of the given tags
            search_criteria = search_criteria.split()
            for e in search_criteria:
                resources = CatalogueResource.objects.filter(
                    usertag__tag__name__icontains=e)

        elif criteria == 'connectSlot':
            # get all resource compatible with the given events
            search_criteria = search_criteria.split()
            for e in search_criteria:
                resources = CatalogueResource.objects.filter(
                    Q(gadgetwiring__friendcode=e),
                    Q(gadgetwiring__wiring='out'))

        elif criteria == 'connectEvent':
            # get all resource compatible with the given slots
            search_criteria = search_criteria.split()
            for e in search_criteria:
                resources = CatalogueResource.objects.filter(
                    Q(gadgetwiring__friendcode=e),
                    Q(gadgetwiring__wiring='in'))

        elif criteria == 'connectEventSlot':
            # TODO

            # get all resources compatible with the given slots
            search_criteria[0] = search_criteria[0].split()
            for e in search_criteria[0]:
                resources = CatalogueResource.objects.filter(
                    Q(gadgetwiring__friendcode=e),
                    Q(gadgetwiring__wiring='in'))
            # get all resources compatible with the given events
            search_criteria[1] = search_criteria[1].split()
            for e in search_criteria[1]:
                resources = CatalogueResource.objects.filter(
                    Q(gadgetwiring__friendcode=e),
                    Q(gadgetwiring__wiring='out'))

        resources = resources.order_by(orderby)
        resources = group_resources(resources)
        resources = filter_resources_by_organization(user, resources, user.groups.all(), scope)

        items = len(resources)
        resources = get_paginatedlist(resources, pag, offset)

        return get_resource_response(resources, format, items, user)


class ResourceCollectionByGlobalSearch(Resource):

    def read(self, request, user_name, pag=0, offset=0):

        user = user_authentication(request, user_name)

        orderby = request.GET.get('orderby', '-creation_date')
        format = request.GET.get('format', 'default')
        scope = request.GET.get('scope', 'all')
        search_criteria = request.GET.getlist('search_criteria')
        search_boolean = request.GET.get('search_boolean')

        andlist = []
        orlist = []
        notlist = []
        taglist = []
        eventlist = []
        slotlist = []
        # This variable counts the number of criteria for the search
        # to be passed as a parameter to the function
        # get_uniquelist in order to get the resources that match the
        # number of criteria
        fields = 0

        if (search_criteria[0] != ""):
            andlist = get_and_list(search_criteria[0], user)
            fields = fields + 1
        if (search_criteria[1] != ""):
            orlist = get_or_list(search_criteria[1], user)
            fields = fields + 1
        if (search_criteria[2] != ""):
            notlist = get_not_list(search_criteria[2], user)
            fields = fields + 1
        if (search_criteria[3] != ""):
            #get all the resources that match any of the given tags
            criteria = search_criteria[3].split()
            for e in criteria:
                taglist = CatalogueResource.objects.filter(
                    usertag__tag__name__icontains=e)
            taglist = get_uniquelist(taglist)
            fields = fields + 1
        if (search_criteria[4] != ""):
            #get all the resources that match any of the given events
            criteria = search_criteria[4].split()
            for e in criteria:
                eventlist = CatalogueResource.objects.filter(
                    Q(gadgetwiring__friendcode__icontains=e),
                    Q(gadgetwiring__wiring='out'))
            eventlist = get_uniquelist(eventlist)
            fields = fields + 1
        if (search_criteria[5] != ""):
            #get all the resources that match any of the given slots
            criteria = search_criteria[5].split()
            for e in criteria:
                slotlist = CatalogueResource.objects.filter(
                    Q(gadgetwiring__friendcode__icontains=e),
                    Q(gadgetwiring__wiring='in'))
            slotlist = get_uniquelist(slotlist)
            fields = fields + 1

        resources = andlist + orlist + notlist + taglist + eventlist + slotlist
        if search_boolean == "AND":
            resources = get_uniquelist(resources, fields)
        else:
            resources = get_uniquelist(resources)

        resources = filter_resources_by_organization(user, resources, user.groups.all(), scope)
        items = len(resources)

        resources = get_sortedlist(resources, orderby)
        resources = get_paginatedlist(resources, pag, offset)

        return get_resource_response(resources, format, items, user)


class ResourceTagCollection(Resource):

    def create(self, request, user_name, vendor, name, version):
        format = request.POST.get('format', 'default')

        user = user_authentication(request, user_name)

        # Get the xml containing the tags from the request
        tags_xml = request.POST.get('tags_xml')
        tags_xml = tags_xml.encode("utf-8")

        # Parse the xml containing the tags
        parser = make_parser()
        handler = TagsXMLHandler()

        # Tell the parser to use our handler
        parser.setContentHandler(handler)

        # Parse the input
        try:
            from cStringIO import StringIO  # pyflakes:ignore
        except ImportError:
            from StringIO import StringIO  # pyflakes:ignore

        inpsrc = InputSource()
        inpsrc.setByteStream(StringIO(tags_xml))
        parser.parse(inpsrc)

        # Get the resource's id for those vendor, name and version
        resource = get_object_or_404(CatalogueResource, short_name=name,
                                   vendor=vendor, version=version)

        # Insert the tags for these resource and user in the database
        for e in handler._tags:
            try:
                tag, created = Tag.objects.get_or_create(name=e)
                UserTag.objects.get_or_create(tag=tag, idUser=user, idResource=resource)
            except Exception, ex:
                transaction.rollback()
                msg = _("Error tagging resource!!")

                raise TracedServerError(ex, {'resource': vendor + name + version, 'tags': tags_xml},
                                        request, msg)

        return get_tag_response(resource, user, format)

    def read(self, request, user_name, vendor, name, version):
        format = request.GET.get('format', 'default')

        # Get the resource's id for those vendor, name and version
        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version).id

        # Get the user's id for that user_name
        user = user_authentication(request, user_name)

        return get_tag_response(resource, user, format)

    def delete(self, request, user_name, vendor, name, version, tag):

        try:
            user = user_authentication(request, user_name)
        except Http403, e:
            msg = _("This tag cannot be deleted: ") + unicode(e)
            log(msg, request)
            return HttpResponseForbidden(get_xml_error(msg),
                                         mimetype='application/xml; charset=UTF-8')

        format = request.GET.get('format', 'default')

        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version).id
        userTag = get_object_or_404(UserTag, id=tag)

        #if there is no more resources tagged by an user with this tag, delete the Tag
        if UserTag.objects.filter(tag=userTag.tag).count() == 1:
            userTag.tag.delete()

        userTag.delete()

        return get_tag_response(resource, user, format)


class ResourceVoteCollection(Resource):

    def create(self, request, user_name, vendor, name, version):
        format = request.GET.get('format', 'default')

        user = user_authentication(request, user_name)

        # Get the vote from the request
        vote = request.POST.get('vote')

        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version)

        # Insert the vote for these resource and user in the database
        try:
            UserVote.objects.create(vote=vote, idUser=user, idResource=resource)
        except Exception, ex:
            log(ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)),
                                           mimetype='application/xml; charset=UTF-8')

        try:
            update_resource_popularity(resource)
        except Exception, ex:
            log(ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)),
                                           mimetype='application/xml; charset=UTF-8')

        return get_vote_response(resource, user, format)

    def read(self, request, user_name, vendor, name, version):
        format = request.GET.get('format', 'default')

        # Get the resource's id for those vendor, name and version
        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version)

        # Get the user's id for that user_name
        user = user_authentication(request, user_name)

        return get_vote_response(resource, user, format)

    def update(self, request, user_name, vendor, name, version):

        try:
            format = PUT_parameter(request, 'format')
        except KeyError:
            format = 'default'

        user = user_authentication(request, user_name)

        # Get the vote from the request
        vote = PUT_parameter(request, 'vote')

        # Get the resource's id for those vendor, name and version
        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version)

        # Insert the vote for these resource and user in the database
        try:
            userVote = get_object_or_404(UserVote, idUser=user, idResource=resource)
            userVote.vote = vote
            userVote.save()
        except Exception, ex:
            log(ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)),
                                           mimetype='application/xml; charset=UTF-8')

        try:
            update_resource_popularity(resource)
        except Exception, ex:
            log(ex, request)
            return HttpResponseServerError(get_xml_error(unicode(ex)),
                                           mimetype='application/xml; charset=UTF-8')

        return get_vote_response(resource, user, format)


class ResourceVersionCollection(Resource):

    def create(self, request, user_name):

        content_type = request.META.get('CONTENT_TYPE', '')
        if content_type == None:
            content_type = ''

        if content_type.startswith('application/json'):
            received_json = request.raw_post_data
        else:
            received_json = request.POST.get('resources', None)

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("resources JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            resources = simplejson.loads(received_json)
        except simplejson.JSONDecodeError, e:
            return HttpResponse(get_xml_error(_("malformed json data: %s") % unicode(e)), status=422, mimetype='application/xml; charset=UTF-8')

        result = []
        for g in resources:
            latest_resource_version = get_latest_resource_version(g["name"], g["vendor"])
            if latest_resource_version:
                # the resource is still in the catalogue
                g["lastVersion"] = latest_resource_version.version
                g["lastVersionURL"] = latest_resource_version.template_uri
                result.append(g)

        return HttpResponse(json_encode({'resources': result}),
                            mimetype='application/json; charset=UTF-8')


class ResourceEnabler(Resource):

    def read(self, request, resource_id):
        resource = get_object_or_404(CatalogueResource, id=resource_id)

        resource.certification = get_verified_certification_group()

        resource.save()

        return HttpResponse('{"result": "ok"}', mimetype='application/json; charset=UTF-8')
