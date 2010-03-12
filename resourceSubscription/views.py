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

from commons.resource import Resource
from commons.utils import json_encode

from django.http import HttpResponse, HttpResponseServerError
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404

from resourceSubscription.models import Contract
from catalogue.models import Application

from django.utils import simplejson
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from django.db import transaction

def check_arguments(request):
    if (not request.REQUEST.__contains__('contract_list')):
        return HttpResponseServerError('{"error": "Missing contract_info parameter"}', mimetype='application/json; charset=UTF-8'), None
    
    contract_list = request.REQUEST['contract_list']
    
    try:
        contract_list = simplejson.loads(contract_list)
    except Exception, e:
        return HttpResponseServerError('{"error": "Badformed JSON argument"}', mimetype='application/json; charset=UTF-8'), None
    
    return None, contract_list 
    
class ApplicationsSubscriber(Resource):
    @login_required  
    @transaction.commit_on_success 
    def create(self, request):
        error, contract_list = check_arguments(request)
        
        if (error):
            return error
        
        user = request.user
        
        for contract_info in contract_list:
            app_id = contract_info['app_id']
            application = get_object_or_404(Application, app_code=app_id)
        
            contract, created = Contract.objects.get_or_create(user=user, application=application)
            
            contract.update_info(contract_info)
        
        return HttpResponse('{"result": "ok"}', mimetype='application/json; charset=UTF-8')