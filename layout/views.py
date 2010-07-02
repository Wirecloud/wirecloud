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
from commons.logs_exception import TracedServerError

from django.http import HttpResponse, HttpResponseBadRequest
from django.conf import settings
from django.shortcuts import render_to_response
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.db import transaction, IntegrityError

from commons.utils import json_encode, accepts
from layout.models import Skin, SkinTemplate, Layout

import re

def check_name(name):
    msg = None
    if len(name) == 0:
        msg =  _('"name" is required')
    elif not re.match('^[\s\-\.\w]+$', name):
        msg = _('"name" not valid: Use alphanumeric characters, hyphens, underscores and dots')
    
    return msg

# resource for Skins (both workspace and catalogue ones)
class SkinEntry(Resource):
  
    def read(self, request, skin_name):
        try:
            skin = Skin.objects.get(name=skin_name)
        except Skin.DoesNotExist, e:
            msg = _("The skin cannot be fetched: ") + unicode(e)
            
            raise TracedServerError(e, {'skin_name': skin_name}, request, msg)
        
        context = simplejson.loads(skin.properties)
        return render_to_response("skinTemplates/" + skin.skin_template.template_file + '.css', context, mimetype="text/css")


#Manage the creation
class SkinGenerator(Resource):
    FORM_TEMPLATE = "layouts/skin_form.html"       
  
    def read(self, request, skin_type, skin_name=None):

        try:
            skin_template = SkinTemplate.objects.get(layout__name=settings.LAYOUT, type=skin_type)
            #take the fields structure form the skin template
            fields = simplejson.loads(skin_template.properties)
        
            if skin_name:
                #requesting a modification
                #take the properties defined in the skin
                skin = Skin.objects.get(name=skin_name)
                skin_properties = simplejson.loads(skin.properties)        
                
                #and set the values of the properties from the skin to show them in the form
                for name,properties in fields.items():
                    for property,desc in properties.items():
                        desc['value'] = skin_properties[property]
                    
            fields = {"properties" : fields, "name":skin_name or "", "mode":skin_type, "MEDIA_URL": settings.MEDIA_URL}
                
            return render_to_response(self.FORM_TEMPLATE, fields)
        
        except Exception, e:
            msg = unicode(e)
            raise TracedServerError(e, {'skin_name': skin_name}, request, msg)
        
    
    @transaction.commit_on_success
    def create(self, request, skin_type, skin_name=None):
        msg = None
        
        if not skin_name:
            #create a new skin
            skin_name = request.POST['name']
            msg = check_name(skin_name)

        if not msg:
            properties = request.POST.copy()
            try:
                resp="modified"
                
                if properties.has_key('name'):
                    del properties['name']
                properties = json_encode(dict(properties.items()))
                
                layout = Layout.objects.get(name=settings.LAYOUT)
                skin_template = SkinTemplate.objects.get(layout=layout, type=skin_type)
                try:
                    skin, created = Skin.objects.get_or_create(name=skin_name, layout=layout, skin_template=skin_template, creator=request.user)
                    skin.properties=properties
                    if created:
                        resp="created"
                     
                    skin.save()
                    
                    result = _("The skin %(name)s has been %(msg)s successfully") %{"name":skin_name, "msg":resp}
                    
                    if accepts(request, 'application/json'):
                        mimetype = 'application/json; charset=UTF-8'   
                        msg = json_encode({"message": result, 'result': 'ok'})
                    else:
                        mimetype ='text/html; charset=UTF-8'
                        msg = '<p style="font-size:80%">' + result + '</p>'
                    
                    return HttpResponse(msg, mimetype=mimetype)  
                            
                except IntegrityError, e:
                    msg =  _("Error creating the new skin: the name %s is already in use ") %(skin_name)
                except Exception, e:
                    transaction.rollback()
                    msg = _("Error creating the new skin: ") + unicode(e)    
            
            except Exception,e:
                msg = unicode(e) 
        
        # inform about errors
        if msg:
            if accepts(request, 'application/json'):
                mimetype = 'application/json; charset=UTF-8'
                msg = json_encode({"message":msg, "result":"error"})
            else:
                mimetype ='text/html; charset=UTF-8'
                msg = '<p style="color:red; font-size:80%">' + msg + '</p>'
                
            return HttpResponseBadRequest(msg, mimetype= mimetype)
                   
class SkinPreviewer(Resource):
    template_directory = "skinTemplates/"
    workspace_preview = template_directory + "ws_preview.html"
    catalogue_preview = template_directory + "catalogue.preview.html"
    
    def create(self, request, skin_type):
        
        properties = request.POST.copy()
        if properties.has_key('name'):
            del properties['name']
            
        #layout context
        layout = Layout.objects.get(name=settings.LAYOUT)
        properties["layout"] = simplejson.loads(layout.layout_css)
        #theme context
        properties["theme"] = simplejson.loads(layout.theme.theme_css)
        
        properties["MEDIA_URL"] = settings.MEDIA_URL                           
        
        template = eval('self.'+skin_type+'_preview')
        return render_to_response(template, properties)
        