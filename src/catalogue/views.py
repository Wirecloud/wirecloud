
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

import os
from cStringIO import StringIO
from xml.sax import make_parser
from xml.sax.xmlreader import InputSource

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse, HttpResponseNotAllowed
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, get_list_or_404
from django.utils import simplejson
from django.utils.decorators import method_decorator
from django.utils.encoding import smart_str
from django.utils.http import urlquote_plus
from django.utils.translation import ugettext as _
from django.views.static import serve

from catalogue.models import CatalogueResource
from catalogue.models import UserTag, UserVote
from catalogue.tagsParser import TagsXMLHandler
from catalogue.catalogue_utils import get_latest_resource_version
from catalogue.catalogue_utils import get_resource_response, filter_resources_by_organization
from catalogue.catalogue_utils import filter_resources_by_scope
from catalogue.catalogue_utils import get_and_filter, get_or_filter, get_not_filter
from catalogue.catalogue_utils import get_tag_filter, get_event_filter, get_slot_filter, get_paginatedlist
from catalogue.catalogue_utils import get_tag_response, update_resource_popularity
from catalogue.catalogue_utils import get_vote_response, group_resources
import catalogue.utils as catalogue_utils
from catalogue.utils import add_widget_from_wgt, add_resource_from_template, delete_resource
from catalogue.utils import tag_resource
from commons.cache import no_cache
from commons import http_utils
from commons.logs_exception import TracedServerError
from commons.resource import Resource
from commons.user_utils import get_verified_certification_group
from commons.utils import json_encode
from wirecloudcommons.utils.http import build_error_response, get_content_type, supported_request_mime_types
from wirecloudcommons.utils.template import TemplateParseException
from wirecloudcommons.utils.transaction import commit_on_http_success


def serve_catalogue_media(request, vendor, name, version, file_path):

    if request.method != 'GET':
        return HttpResponseNotAllowed(('GET',))

    base_dir = catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version)
    local_path = os.path.normpath(os.path.join(base_dir, file_path))

    if not os.path.isfile(local_path):
        return HttpResponse(status=404)

    if not getattr(settings, 'USE_XSENDFILE', False):
        return serve(request, local_path, document_root='/')
    else:
        response = HttpResponse()
        response['X-Sendfile'] = smart_str(local_path)
        return response


def iframe_error(func):

    def wrapper(self, request, *args, **kwargs):
        if not request.REQUEST.get('iframe', False):
            return func(self, request, *args, **kwargs)

        request.META['HTTP_ACCEPT'] = 'text/plain'
        error_msg = response = None
        try:
            response = func(self, request, *args, **kwargs)
        except Exception, e:
            error_msg = unicode(e)

        if response is not None and (response.status_code >= 300 or response.status_code < 200):
            error_msg = response.content

        if error_msg:
            return HttpResponseRedirect(reverse('iframe_error') + '?msg=' + urlquote_plus(str(error_msg)) + '#error')
        else:
            return response

    return wrapper


@no_cache
def error(request):
    msg = request.GET.get('msg', 'Widget could not be added')
    return HttpResponse(msg, mimetype='text/plain; charset=utf-8')


class ResourceCollection(Resource):

    @method_decorator(login_required)
    @iframe_error
    @commit_on_http_success
    @supported_request_mime_types(('application/x-www-form-urlencoded', 'multipart/form-data'))
    def create(self, request, fromWGT=False):

        overrides = None

        try:
            if 'file' in request.FILES:

                request_file = request.FILES['file']
                resource = add_widget_from_wgt(request_file, request.user)

            elif 'template_uri' in request.POST:

                template_uri = request.POST['template_uri']
                template = http_utils.download_http_content(template_uri, user=request.user)
                resource = add_resource_from_template(template_uri, template, request.user, overrides=overrides)

            else:

                return build_error_response(request, 400, _("Missing parameter: template_uri or file"))

        except TemplateParseException, e:

            return build_error_response(request, 400, unicode(e.msg))

        except IntegrityError:

            return build_error_response(request, 409, _('Resource already exists'))

        return HttpResponse(resource.json_description, mimetype='application/json; charset=UTF-8')

    @no_cache
    def read(self, request, pag=0, offset=0):

        format = request.GET.get('format', 'default')
        orderby = request.GET.get('orderby', '-creation_date')
        scope = request.GET.get('scope', 'all')

        # Get all resource in the catalogue
        resources = filter_resources_by_scope(CatalogueResource.objects.all(), scope)
        resources = resources.order_by(orderby)
        resources = group_resources(resources)
        resources = filter_resources_by_organization(request.user, resources, request.user.groups.all())
        items = len(resources)

        resources = get_paginatedlist(resources, int(pag), int(offset))

        return get_resource_response(resources, format, items, request.user, request)

    @method_decorator(login_required)
    @commit_on_http_success
    def delete(self, request, vendor, name, version=None):

        response_json = {'result': 'ok', 'removedIWidgets': []}
        if version is not None:
            #Delete only the specified version of the widget
            resource = get_object_or_404(CatalogueResource, short_name=name,
                                         vendor=vendor, version=version)
            result = delete_resource(resource, request.user)
            response_json['removedIWidgets'] = result['removedIWidgets']
        else:
            #Delete all versions of the widget
            resources = get_list_or_404(CatalogueResource, short_name=name, vendor=vendor)
            for resource in resources:
                result = delete_resource(resource, request.user)
                response_json['removedIWidgets'] += result['removedIWidgets']

        return HttpResponse(simplejson.dumps(response_json),
                            mimetype='application/json; charset=UTF-8')


class ResourceCollectionBySimpleSearch(Resource):

    @no_cache
    def read(self, request, criteria, pag=0, offset=0):

        orderby = request.GET.get('orderby', '-creation_date')
        format = request.GET.get('format', 'default')
        scope = request.GET.get('scope', 'all')

        if criteria == 'connectEventSlot':
            search_criteria = request.GET.getlist('search_criteria')
        else:
            search_criteria = request.GET.get('search_criteria')

        resources = CatalogueResource.objects.none()

        if criteria == 'and':
            filters = get_and_filter(search_criteria, request.user)
        elif criteria == 'or' or criteria == 'simple_or':
            filters = get_or_filter(search_criteria, request.user)
        elif criteria == 'not':
            filters = get_not_filter(search_criteria, request.user)
        elif criteria == 'event':
            filters = get_event_filter(search_criteria)
        elif criteria == 'slot':
            filters = get_slot_filter(search_criteria)
        elif criteria == 'tag':
            filters = get_tag_filter(search_criteria)
        elif criteria == 'connectSlot':
            # get all resource compatible with the given events
            search_criteria = search_criteria.split()
            for e in search_criteria:
                resources = CatalogueResource.objects.filter(
                    Q(widgetwiring__friendcode=e),
                    Q(widgetwiring__wiring='out'))

        elif criteria == 'connectEvent':
            # get all resource compatible with the given slots
            search_criteria = search_criteria.split()
            filters = Q()
            for e in search_criteria:
                filters = filters | Q(widgetwiring__friendcode=e)
            filters = filters & Q(widgetwiring__wiring='out')

        resources = CatalogueResource.objects.filter(filters)
        resources = filter_resources_by_scope(resources, scope)
        resources = resources.order_by(orderby)
        resources = group_resources(resources)
        resources = filter_resources_by_organization(request.user, resources, request.user.groups.all())

        items = len(resources)
        resources = get_paginatedlist(resources, pag, offset)

        return get_resource_response(resources, format, items, request.user, request)


class ResourceCollectionByGlobalSearch(Resource):

    @no_cache
    def read(self, request, pag=0, offset=0):

        orderby = request.GET.get('orderby', '-creation_date')
        format = request.GET.get('format', 'default')
        scope = request.GET.get('scope', 'all')
        search_criteria = request.GET.getlist('search_criteria')
        search_boolean = request.GET.get('search_boolean')

        if search_boolean == 'AND':
            join_filters = lambda x, y: x & y
        else:
            join_filters = lambda x, y: x | y

        filters = Q()
        if search_criteria[0] != "":
            filters = get_and_filter(search_criteria[0], request.user)
        if search_criteria[1] != "":
            filters = join_filters(filters, get_or_filter(search_criteria[1], request.user))
        if search_criteria[2] != "":
            filters = join_filters(filters, get_not_filter(search_criteria[2], request.user))
        if search_criteria[3] != "":
            filters = join_filters(filters, get_tag_filter(search_criteria[3]))
        if search_criteria[4] != "":
            filters = join_filters(filters, get_event_filter(search_criteria[4]))
        if search_criteria[5] != "":
            filters = join_filters(filters, get_slot_filter(search_criteria[5]))

        resources = CatalogueResource.objects.filter(filters)
        resources = filter_resources_by_scope(resources, scope).distinct()
        resources = resources.order_by(orderby)
        resources = group_resources(resources)
        resources = filter_resources_by_organization(request.user, resources, request.user.groups.all())
        items = len(resources)

        resources = get_paginatedlist(resources, pag, offset)

        return get_resource_response(resources, format, items, request.user, request)


class ResourceTagCollection(Resource):

    @method_decorator(login_required)
    @commit_on_http_success
    def create(self, request, vendor, name, version):
        format = request.POST.get('format', 'default')

        # Get the xml containing the tags from the request
        tags_xml = request.POST.get('tags_xml')
        tags_xml = tags_xml.encode("utf-8")

        # Parse the xml containing the tags
        parser = make_parser()
        handler = TagsXMLHandler()

        # Tell the parser to use our handler
        parser.setContentHandler(handler)

        # Parse the input
        inpsrc = InputSource()
        inpsrc.setByteStream(StringIO(tags_xml))
        parser.parse(inpsrc)

        # Get the resource's id for those vendor, name and version
        resource = get_object_or_404(CatalogueResource, short_name=name,
                                   vendor=vendor, version=version)

        # Insert the tags for these resource and user in the database
        for e in handler._tags:
            try:
                tag_resource(request.user, e, resource)
            except Exception, ex:
                msg = _("Error tagging resource!!")

                raise TracedServerError(ex, {'resource': vendor + name + version, 'tags': tags_xml},
                                        request, msg)

        return get_tag_response(resource, request.user, format)

    @no_cache
    def read(self, request, vendor, name, version):
        format = request.GET.get('format', 'default')

        # Get the resource's id for those vendor, name and version
        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version).id

        return get_tag_response(resource, request.user, format)

    @method_decorator(login_required)
    @commit_on_http_success
    def delete(self, request, vendor, name, version, tag):

        format = request.GET.get('format', 'default')

        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version).id
        userTag = get_object_or_404(UserTag, id=tag)

        #if there is no more resources tagged by an user with this tag, delete the Tag
        if UserTag.objects.filter(tag=userTag.tag).count() == 1:
            userTag.tag.delete()

        userTag.delete()

        return get_tag_response(resource, request.user, format)


class ResourceVoteCollection(Resource):

    @method_decorator(login_required)
    @commit_on_http_success
    @supported_request_mime_types(('application/x-www-form-urlencoded', 'application/json'))
    def create(self, request, vendor, name, version):
        format = request.GET.get('format', 'default')

        # Get the vote from the request
        content_type = get_content_type(request)[0]
        if content_type == 'application/json':
            try:
                vote = simplejson.loads(request.raw_post_data)['vote']
            except Exception, e:
                msg = _("malformed json data: %s") % unicode(e)
                return build_error_response(request, 400, msg)
        else:
            vote = request.POST.get('vote')

        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version)

        # Insert the vote for these resource and user in the database
        UserVote.objects.create(vote=vote, idUser=request.user, idResource=resource)
        update_resource_popularity(resource)

        return get_vote_response(resource, request.user, format)

    @no_cache
    def read(self, request, vendor, name, version):
        format = request.GET.get('format', 'default')

        # Get the resource's id for those vendor, name and version
        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version)

        return get_vote_response(resource, request.user, format)

    @method_decorator(login_required)
    @commit_on_http_success
    def update(self, request, vendor, name, version):

        try:
            format = http_utils.PUT_parameter(request, 'format')
        except KeyError:
            format = 'default'

        # Get the vote from the request
        vote = http_utils.PUT_parameter(request, 'vote')

        # Get the resource's id for those vendor, name and version
        resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version)

        # Insert the vote for these resource and user in the database
        userVote = get_object_or_404(UserVote, idUser=request.user, idResource=resource)
        userVote.vote = vote
        userVote.save()

        update_resource_popularity(resource)

        return get_vote_response(resource, request.user, format)


class ResourceVersionCollection(Resource):

    @supported_request_mime_types(('application/json',))
    def create(self, request):

        try:
            resources = simplejson.loads(request.raw_post_data)
        except simplejson.JSONDecodeError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

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

    @no_cache
    def read(self, request, resource_id):
        resource = get_object_or_404(CatalogueResource, id=resource_id)

        resource.certification = get_verified_certification_group()

        resource.save()

        return HttpResponse('{"result": "ok"}', mimetype='application/json; charset=UTF-8')
