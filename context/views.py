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

from django.shortcuts import get_object_or_404, get_list_or_404
from django.http import Http404, HttpResponse, HttpResponseBadRequest
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from django.utils import simplejson

from commons.resource import Resource

from commons.authentication import user_authentication
from commons.utils import get_xml_error, json_encode

from commons.get_data import get_concept_data, get_concept_value
from context.models import Concept, ConceptName

from commons.http_utils import PUT_parameter

class ContextCollection(Resource):
    def read(self, request, user_name):
        user = user_authentication(request, user_name)
        concepts = Concept.objects.all()
        data_list = {} 
        concept_values = {}
        concept_values['user'] = user
        data_list['concepts'] = [get_concept_data(concept, concept_values) for concept in concepts]
        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def create(self, request, user_name):
        user = user_authentication(request, user_name)
        
        if request.POST.has_key('json'):
            received_json = request.POST['json']
        else:
            return HttpResponseBadRequest(get_xml_error(_("JSON parameter not specified")))

        try:
            received_data = simplejson.loads(received_json)
        except:
            return HttpResponseBadRequest(get_xml_error(_("Expecting data in JSON format.")))

        for received_concept in received_data['concepts']:
            concept = None
            try:
                concept = Concept.objects.get(concept=received_concept['concept'])
                if not concept.adaptor == received_concept['adaptor']:
                    return HttpResponseBadRequest(get_xml_error(_(u'Attempted update. You must use PUT HTTP method in this case')))
            
            except Concept.DoesNotExist:
                concept = Concept (concept=received_concept['concept'], adaptor=received_concept['adaptor'])
                concept.save()
            
            try:
                #Checks if concept name exits in database
                ConceptName.objects.get (name=received_concept['name'], concept=concept)

            except ConceptName.DoesNotExist:
                cname = ConceptName (name=received_concept['name'], concept=concept)
                cname.save()
        
        return HttpResponse('ok') 



class ContextEntry(Resource):
    def read(self, request, user_name, concept_name):
        user = user_authentication(request, user_name)
        concepts = get_list_or_404(Concept, concept=concept_name)
        concept_values = {}
        concept_values['user'] = user
        data_list = get_concept_data(concept, concept_values)
        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def create(self, request, user_name, concept_name):
        user = user_authentication(request, user_name)

        if request.POST.has_key('json'):
            received_json = request.POST['json']
        else:
            return HttpResponseBadRequest(get_xml_error(_("JSON parameter not specified")))

        try:
            received_concept = simplejson.loads(received_json)
        except:
            return HttpResponseBadRequest(get_xml_error(_("Expecting data in JSON format.")))

        concept = None
        try:
            concept = Concept.objects.get(concept=concept_name)
            if not concept.adaptor == received_concept['adaptor']:
                return HttpResponseBadRequest(get_xml_error(_(u'Attempted update. You must use PUT HTTP method in this case')))

        except Concept.DoesNotExist:
            concept = Concept (concept=concept_name, adaptor=received_concept['adaptor'])
            concept.save()

        cname = ConceptName (name=received_concept['name'], concept=concept)
        cname.save()

        return HttpResponse('ok') 
                
    @transaction.commit_on_success
    def update(self, request, user_name, concept_name):
        user = user_authentication(request, user_name)
        
        received_json = PUT_parameter(request, 'json') 

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("JSON parameter not specified")))

        try:
            received_data = simplejson.loads(received_json)
        except:
            return HttpResponseBadRequest(get_xml_error(_("Expecting data in JSON format.")))

        for received_concept in received_data:
            concept = None
            try:
                concept = Concept.objects.get(concept=concept_name)
                concept.adaptor = received_concept['adaptor']
                concept.save()
                 
            except Concept.DoesNotExist:
                return HttpResponseBadRequest(get_xml_error(_("Concept does not exist. You must use POST HTTP method in this case")))

            cname = ConceptName (name=received_concept['name'], concept=concept)
            cname.save()

        return HttpResponse('ok') 

    @transaction.commit_on_success
    def delete(self, request, user_name, concept_name):
        user = user_authentication(request, user_name)
        concept = get_object_or_404 (Concept, concept=concept_name)
        ConceptName.objects.filter(concept=concept).delete()
        concept.delete()
        return HttpResponse('ok')



class ContextValueEntry(Resource):
    def read(self, request, user_name, concept_name):
        user = user_authentication(request, user_name)
        
        data_res ={}
        concept_data = {}
        concept_data['user'] = user
        data_res['value'] = get_concept_value(concept_name, concept_data)
        
        return HttpResponse(json_encode(data_res), mimetype='application/json; charset=UTF-8')

