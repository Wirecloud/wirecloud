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
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render_to_response
from django.utils import simplejson
from django.utils.translation import ugettext as _

from commons.logs_exception import TracedServerError
from commons.resource import Resource
from commons.utils import get_xml_error, json_encode
from gadgetGenerator.models import Template, TemplateInstance


class templateGenerator(Resource):

    def read(self, request, templateName, templateId):

        try:
            #fetch the parameters the user had introduced on creating the template
            templateInstance = TemplateInstance.objects.get(id=int(templateId))
            context = simplejson.loads(templateInstance.context)

            #fetch the default parameters
            template = Template.objects.get(id=templateInstance.template.id)
            defaultContext = simplejson.loads(template.defaultContext)

            #update the default context with the context specified by the user.
            defaultContext.update(context)

        except Exception, e:
            msg = _("template cannot be fetched: ") + unicode(e)

            raise TracedServerError(e, {'templateName': templateName, 'templateId': templateId}, request, msg)

        return render_to_response("gadgetTemplates/" + templateName + '.xml', defaultContext, mimetype="application/xhtml+xml")

    @transaction.commit_on_success
    def create(self, request, templateName):

        if 'template_data' not in request.POST:
            return HttpResponseBadRequest(get_xml_error(_("template_data JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.POST['template_data']

        try:
            #generate an specific template dinamically
            templateInstance = TemplateInstance()
            templateInstance.template = Template.objects.get(name=templateName)
            templateInstance.save()

            context = simplejson.loads(received_json)

            # Parse fixed params
            fixed_params = ''

            if 'parse_parameters' in context and 'fixed_params' in context:
                fixed_params = context['fixed_params'].strip()

                context['fixed_params'] = {}
                if len(fixed_params) > 0:
                    for param in fixed_params.split(','):
                        param = param.strip()
                        if param != '':
                            context['fixed_params'][param.split('=')[0].strip()] = param.split('=')[1].strip()

            # Parse default params
            default_params_tmp = ''
            default_params = {}

            if 'parse_parameters' in context and 'default_params' in context:
                default_params_tmp = context['default_params'].strip()
                del context['default_params']

                if len(default_params_tmp) > 0:
                    for param in default_params_tmp.split(','):
                        param = param.strip()
                        if param != '':
                            default_params[param.split('=')[0].strip()] = param.split('=')[1].strip()

            # Parse URL params, create a params dictionary without the fixed params
            context['params'] = {}
            parsedUrl = context['URL'].partition('?')
            if 'parse_parameters' in context and int(context['parse_parameters']) > 0:
                #include the parameters of the url
                context['URL'] = parsedUrl[0]  # base without ?
                queryString = parsedUrl[2]
                if len(queryString) > 0:
                    for param in queryString.split('&'):
                        if param != '':
                            # Check if params is not on the fixed_params dictionary
                            param_att_value = param.split('=')
                            if not('fixed_params' in context) or not(param_att_value[0] in context['fixed_params']):
                                if param_att_value[0] in default_params:
                                    context['params'][param_att_value[0]] = default_params[param_att_value[0]]
                                else:
                                    context['params'][param_att_value[0]] = ''
                    if ('fixed_params' in context and len(context['fixed_params']) > 0) or ('params' in context and len(context['params']) > 0):
                        # if we have parameters, fixed or variable, add '?' to the base URL
                        context['URL'] = context['URL'] + parsedUrl[1]
                    # Add fixed params to the base URL and remove from context
                    if ('fixed_params' in context and len(context['fixed_params']) > 0):
                        fixed_params_part = ''
                        for key, value in context['fixed_params'].items():
                            if fixed_params_part != '':
                                fixed_params_part = fixed_params_part + '&' + key + '=' + value
                            else:
                                fixed_params_part = key + '=' + value
                        context['URL'] = context['URL'] + fixed_params_part
                        del context['fixed_params']

            events = []
            if 'events' in context:
                events = context['events'].split(',')

            context['events'] = []
            for event in events:
                if event.strip() != '':
                    context['events'].append(event.strip())

            #include the XHTML url
            context['XHTML'] = "http://" + request.get_host() + "/gadgetGenerator/xhtml/" + templateName + '/' + str(templateInstance.id)

            templateInstance.context = json_encode(context)
            templateInstance.save()

        except Exception, e:
            transaction.rollback()
            msg = _("template cannot be created: ") + unicode(e)

            raise TracedServerError(e, {'template_data': received_json}, request, msg)

        #return the new template URL
        url = request.build_absolute_uri() + "/" + str(templateInstance.id)
        response = {'URL': url}
        return HttpResponse(json_encode(response), mimetype='application/json; charset=UTF-8')


class xhtmlGenerator(Resource):

    def read(self, request, templateName, templateId):
        try:
            #fetch the parameters the user had introduced on creating the template
            templateInstance = TemplateInstance.objects.get(id=int(templateId))
            context = simplejson.loads(templateInstance.context)

            return render_to_response("gadgetTemplates/" + templateName + '.html', context)

        except Exception, e:
            msg = _("xhtml cannot be fetched: ") + unicode(e)

            raise TracedServerError(e, {'templateName': templateName, 'templateId': templateId}, request, msg)
