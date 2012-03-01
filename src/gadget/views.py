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
import time
import os

from django.conf import settings
from django.db import transaction, IntegrityError
from django.http import HttpResponse, HttpResponseServerError, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _
from django.views.static import serve

from commons.authentication import user_authentication, Http403
from commons.cache import no_cache, patch_cache_headers
from commons.utils import get_xml_error, json_encode, get_xhtml_content
from commons.exceptions import TemplateParseException
from commons.get_data import get_gadget_data
from commons.http_utils import download_http_content
from commons.logs_exception import TracedServerError
from commons.resource import Resource
from commons.template import TemplateParser
from commons.transaction import commit_on_http_success

from gadget.models import Gadget, XHTML
import gadget.utils as showcase_utils
from gadget.utils import get_or_create_gadget, create_gadget_from_template, fix_gadget_code
from igadget.models import IGadget
from igadget.utils import deleteIGadget
from workspace.utils import create_published_workspace_from_template


def parseAndCreateGadget(request, user, workspaceId):
    try:

        templateURL = None

        if 'url' in request.POST:
            templateURL = request.POST['url']
        elif 'template_uri' in request.POST:
            templateURL = request.POST['template_uri']
        else:
            msg = _("Missing template URL parameter")
            raise Exception(msg)

        if not workspaceId:
            msg = _("Missing workspaceId parameter")
            raise Exception(msg)

        #get or create the Gadget
        fromWGT = not templateURL.startswith('http') and not templateURL.startswith('https')
        return get_or_create_gadget(templateURL, user, workspaceId, request, fromWGT)

    except TemplateParseException, e:
        msg = _("Error parsing the template: %(msg)s" % {"msg": e.msg})
        raise TracedServerError(e, {'url': templateURL}, request, msg)
    except IntegrityError, e:
        msg = _("Gadget already exists")
        raise TracedServerError(e, {'url': templateURL}, request, msg)
    except IOError, e:
        msg = _("The url is not accesible")
        raise TracedServerError(e, {'url': templateURL}, request, msg)
    except Http403:
        raise
    except Exception, e:
        msg = _("Error creating gadget: %(msg)s" % {"msg": str(e)})
        raise TracedServerError(e, {'url': templateURL}, request, msg)


def deleteGadget(user, short_name, vendor, version):

    result = {'removedIGadgets': []}

    # Remove all igadget that matches this Gadget Resource
    try:

        gadget = Gadget.objects.get(name=short_name, vendor=vendor, version=version)
        igadgets = IGadget.objects.filter(gadget=gadget)
        for igadget in igadgets:
            result['removedIGadgets'].append(igadget.id)
            deleteIGadget(igadget, user)

        gadget.delete()
        showcase_utils.wgt_deployer.undeploy(vendor, short_name, version)

    except Gadget.DoesNotExist:
        pass

    try:
        uri = "/gadgets/" + vendor + '/' + short_name + '/' + version + '/xhtml'
        xhtml = XHTML.objects.get(uri=uri)
        xhtml.delete()
    except XHTML.DoesNotExist:
        pass

    return result


class GadgetCollection(Resource):

    @no_cache
    def read(self, request, user_name=None):
        user = user_authentication(request, user_name)

        gadgets = Gadget.objects.filter(users=user)

        data_list = [get_gadget_data(gadget) for gadget in gadgets]
        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def create(self, request, user_name=None):

        if 'workspaceId' not in request.POST:
            msg = _("Missing workspaceId parameter")
            json = json_encode({"message": msg, "result": "error"})
            return HttpResponseServerError(json, mimetype='application/json; charset=UTF-8')

        user = user_authentication(request, user_name)

        #create the gadget
        gadget = parseAndCreateGadget(request, user, request.POST['workspaceId'])

        return HttpResponse(json_encode(get_gadget_data(gadget)), mimetype='application/json; charset=UTF-8')


class Showcase(Resource):

    @commit_on_http_success
    def create(self, request):

        if 'url' not in request.POST:
            return HttpResponseBadRequest()

        url = request.POST['url']
        template_content = download_http_content(url, user=request.user)
        template = TemplateParser(template_content, base=url)

        if template.get_resource_type() == 'gadget':
            create_gadget_from_template(template, request.user, request)
        else:
            create_published_workspace_from_template(template, request.user)

        return HttpResponse(status=201)


class GadgetEntry(Resource):

    @no_cache
    def read(self, request, vendor, name, version, user_name=None):
        user = user_authentication(request, user_name)
        gadget = get_object_or_404(Gadget, users=user, vendor=vendor, name=name, version=version)
        data_fields = get_gadget_data(gadget)
        return HttpResponse(json_encode(data_fields), mimetype='application/json; charset=UTF-8')

    def update(self, request, vendor, name, version, user_name=None):
        user = user_authentication(request, user_name)
        gadget = get_object_or_404(Gadget, users=user, vendor=vendor, name=name, version=version)
        gadget.save()
        return HttpResponse('ok')

    def delete(self, request, vendor, name, version, user_name=None):
        user = user_authentication(request, user_name)
        gadget = get_object_or_404(Gadget, users=user, vendor=vendor, name=name, version=version)
        gadget.delete()
        return HttpResponse('ok')


class GadgetCodeEntry(Resource):

    def read(self, request, vendor, name, version, user_name=None):
        user = user_authentication(request, user_name)
        gadget = get_object_or_404(Gadget, vendor=vendor, name=name, version=version, users__id=user.id)
        xhtml = gadget.xhtml

        content_type = xhtml.content_type
        if not content_type:
            content_type = 'text/html'

        code = xhtml.code
        if not xhtml.cacheable or code == '':
            try:
                if xhtml.url.startswith(('http://', 'https://')):
                    code = download_http_content(gadget.get_resource_url(xhtml.url, request), user=request.user)
                else:
                    code = download_http_content('file://' + os.path.join(settings.GADGETS_DEPLOYMENT_DIR, xhtml.url), user=request.user)

                code = fix_gadget_code(code, xhtml.url, request)
            except Exception, e:
                # FIXME: Send the error or use the cached original code?
                msg = _("XHTML code is not accessible: %(errorMsg)s") % {'errorMsg': e.message}
                return HttpResponse(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

        if xhtml.cacheable and (xhtml.code == '' or xhtml.code_timestamp is None):
            xhtml.code = code
            xhtml.code_timestamp = time.time() * 1000
            xhtml.save()
        elif not xhtml.cacheable and xhtml.code != '':
            xhtml.code = ''
            xhtml.code_timestamp = None
            xhtml.save()

        response = HttpResponse(code, mimetype='%s; charset=UTF-8' % content_type)
        cache_timeout = 0
        if xhtml.cacheable:
            cache_timeout = 31536000  # 1 year

        patch_cache_headers(response, xhtml.code_timestamp, cache_timeout)
        return response

    def update(self, request, vendor, name, version, user_name=None):
        user = user_authentication(request, user_name)
        gadget = get_object_or_404(Gadget, users=user, vendor=vendor, name=name, version=version)
        xhtml = gadget.xhtml

        try:
            url = xhtml.url
            if (url.startswith('http')):
                #Absolute URL
                xhtml.code = download_http_content(url, user=user)
            else:
                #Relative URL
                if (url.startswith('/deployment/gadgets')):
                    #GWT gadget package
                    xhtml.code = get_xhtml_content(url)
                else:
                    #Gadget with relative url and it's not a GWT package
                    url = gadget.get_resource_url(url, request)
                    xhtml.code = download_http_content(url, user=user)

            xhtml.save()
        except Exception, e:
            msg = _("XHTML code is not accessible")

            raise TracedServerError(e, {'vendor': vendor, 'name': name, 'version': version}, request, msg)

        return HttpResponse('ok')


def serve_showcase_media(request, vendor, name, version, file_path):

    if request.method != 'GET':
        return HttpResponseNotAllowed(('GET',))

    local_path = os.path.join(
        showcase_utils.wgt_deployer.get_base_dir(vendor, name, version),
        file_path)

    if not os.path.isfile(local_path):
        return HttpResponse(status=404)

    if not getattr(settings, 'USE_XSENDFILE', False):
        return serve(request, local_path, document_root='/')
    else:
        response = HttpResponse()
        response['X-Sendfile'] = smart_str(local_path)
        return response
