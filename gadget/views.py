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
from django.db import IntegrityError

from django.shortcuts import get_object_or_404, get_list_or_404
from django.http import HttpResponse, HttpResponseServerError
from django.core import serializers

from commons.resource import Resource

from commons.authentication import get_user_authentication, user_authentication
from commons.get_data import get_gadget_data

from django.db import transaction

from django.utils.translation import ugettext as _

from commons.utils import get_xml_error, json_encode
from commons.exceptions import TemplateParseException
from commons.http_utils import *

from gadget.models import Gadget
from workspace.views import get_user_gadgets

from commons.logs_exception import TracedServerError

from gadget.utils import * 
    

class GadgetCollection(Resource):
    def read(self, request, user_name=None):
        user = user_authentication(request, user_name)
        
        #Getting all gadgets of the user
        #Done it against workspaces, not directly against gadgets!
        #Done like this, it's not necessary to keep updated relationships between gadgets and users
        gadgets = get_user_gadgets(user)
        
        data = serializers.serialize('python', gadgets, ensure_ascii=False)

        data_list = []
        for d in data:
            data_fields = get_gadget_data(d)
            data_list.append(data_fields)
        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')

    @transaction.commit_manually
    def create(self, request, user_name=None):
        user = user_authentication(request, user_name)
        if request.POST.has_key('url'):
            templateURL = request.POST['url']
        else:
            return HttpResponseServerError('<error>Url not specified</error>', mimetype='application/xml; charset=UTF-8')

        try:
            #get or create the Gadget
            result = get_or_create_gadget(templateURL, user)
            transaction.commit()
            
            gadget = result["gadget"]
            templateParser = result["templateParser"]
            
        except TemplateParseException, e:
            transaction.rollback()
            msg = _("Error parsing template!")
        
            raise TracedServerError(e, {'url': templateURL}, request, msg)
        except IntegrityError:
            transaction.rollback()
            msg = _("Gadget already exists")
        
            raise TracedServerError(e, {'url': templateURL}, request, msg)
        except Exception, e:
            msg = _("Error creating gadget!")
        
            raise TracedServerError(e, {'url': templateURL}, request, msg)
        
            
        gadgetName = templateParser.getGadgetName()
        gadgetVendor = templateParser.getGadgetVendor()
        gadgetVersion = templateParser.getGadgetVersion()

        gadget_entry = GadgetEntry()
        # POST and GET behavior is alike, both must return a Gadget JSON representation
        return gadget_entry.read(request, gadgetVendor, gadgetName, gadgetVersion, user_name)
        
class GadgetEntry(Resource):
    def read(self, request, vendor, name, version, user_name=None):
        user = user_authentication(request, user_name)
        gadgets = get_list_or_404(Gadget, users=user, vendor=vendor, name=name, version=version)
        data = serializers.serialize('python', gadgets, ensure_ascii=False)
        data_fields = get_gadget_data(data[0])
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
        #user = user_authentication(request, user_name)
        gadget = get_object_or_404(Gadget, vendor=vendor, name=name, version=version)
        code = get_object_or_404(gadget.xhtml, id=gadget.xhtml.id)
        
        content_type = gadget.xhtml.content_type
        if (content_type):
            return HttpResponse(code.code, mimetype='%s; charset=UTF-8' % content_type)
        else:
            return HttpResponse(code.code, mimetype='text/html; charset=UTF-8')

    def update(self, request, vendor, name, version, user_name=None):
        user = user_authentication(request, user_name)
        gadget = get_object_or_404(Gadget, users=user, vendor=vendor, name=name, version=version)

        xhtml = gadget.xhtml;

        try:
            xhtml.code = download_http_content(xhtml.url)
            xhtml.save()
        except Exception, e:
            msg = _("XHTML code is not accessible")

            raise TracedServerError(e, {'vendor': vendor, 'name': name, 'version': version}, request, msg)
        
        return HttpResponse('ok')
