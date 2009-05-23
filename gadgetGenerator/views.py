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

from django.db import transaction
from django.utils import simplejson

from commons.logs import log
from commons.resource import Resource
from gadgetGenerator.models import TemplateInstance


class templateGenerator(Resource):
    
    def read(self, request,templateName,templateId):

        try:
            #fetch the parameters the user had introduced on creating the template
            templateInstance = TemplateInstance.objects.get(id=templateId)
            context = simplejson.loads(templateInstance.context)
            
            #fetch the default parameters
            template = Template.objects.get(id=templateInstance.template)
            defaultContext = simplejson.loads(template.defaultContext)
            
            #create the new context with the default vaules plus the ones specified by the user
            newContext = {}
            for (key, value) in defaultContext.iteritems():
                newContext[key] = context[key] or value
        
        except Exception, e:
            msg = _("template cannot be fetched: ") + unicode(e)
            
            raise TracedServerError(e, {'templateName': templateName, 'templateId':templateId}, request, msg)    
        
        return render_to_response(templateName + '.html',
                          my_data_dictionary,
                          context_instance=RequestContext(request))
 
        

    @transaction.commit_on_success
    def create(self,request, templateName):
    
        if not request.POST.has_key('template_data'):
            return HttpResponseBadRequest(get_xml_error(_("template_data JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.POST['template_data']

        try:
            #Register the params to generate an specific template dinamically
            templateInstance = TemplateInstance()
            templateInstance.context = received_json
            templateInstance.template = Template.objects.get(name=templateName)
            templateInstance.save()
            
            
        except Exception, e:
            transaction.rollback()
            msg = _("template cannot be created: ") + unicode(e)
            
            raise TracedServerError(e, {'template_data': template_data}, request, msg)    
    
        #return the new template URL
        url = request.build_absolute_uri() + str(templateInstance.id)
        return HttpResponse("{'URL': '%s'}" % (url), mimetype='application/json; charset=UTF-8')
