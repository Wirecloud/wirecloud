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
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext

from commons.resource import Resource


class TranslationCollection(Resource):

    def write(self, request):
        pass


class GadgetTranslator(Resource):

    def read(self, request, identifier):
        gadget = get_object_or_404(id=identifier)
        translate_fields = gadget.get_translate_fields()
        result = {}
        # transform the data
        for e in translate_fields:
            #for each variable
            for lang, fields in e.iteritems():
                #for each language
                for field in fields:
                    #add the value
                    index = field["id"] + "_" + field["table"] + "_" + field["attribute"]
                    result[lang][index] = field["widget"].render(index, field["value"])
        return render_to_response("translation.html",
                                  {'translate_fields': result},
                                  context_instance=RequestContext(request))
