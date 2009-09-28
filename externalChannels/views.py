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

from gadget.templateParser import TemplateParser

from django.db import transaction

from django.utils.translation import ugettext as _

from commons.utils import get_xml_error, json_encode
from commons.exceptions import TemplateParseException
from commons.http_utils import *

from commons.logs_exception import TracedServerError

class ExternalChannelCollection(Resource):
    @transaction.commit_on_success
    def create(self, request, user_name=None):
        user = user_authentication(request, user_name)
        if request.POST.has_key('url'):
            templateURL = request.POST['url']
        else:
            return HttpResponseServerError('<error>Url not specified</error>', mimetype='application/xml; charset=UTF-8')

        ########### Template Parser
        templateParser = None
        
        try:
            # Gadget is created only once
            templateParser = TemplateParser(templateURL)
            gadget_uri = templateParser.getGadgetUri()

            try:
                gadget = Gadget.objects.get(uri=gadget_uri)
            except Gadget.DoesNotExist:
                # Parser creates the gadget. It's made only if the gadget does not exist
                templateParser.parse()
                gadget = templateParser.getGadget()
            
            # A new user has added the gadget in his showcase 
            gadget.users.add(user) 
            transaction.commit()
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

class ExternalChannelEntry(Resource):
    def read(self, request, user_name=None):
        user = user_authentication(request, user_name)
        if request.POST.has_key('url'):
            templateURL = request.POST['url']
        else:
            return HttpResponseServerError('<error>Url not specified</error>', mimetype='application/xml; charset=UTF-8')
    
    def delete(self, request, user_name=None):
        user = user_authentication(request, user_name)
        if request.POST.has_key('url'):
            templateURL = request.POST['url']
        else:
            return HttpResponseServerError('<error>Url not specified</error>', mimetype='application/xml; charset=UTF-8')
    