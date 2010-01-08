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

from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required

from commons.authentication import login_public_user
from commons.utils import get_xml_error, json_encode
from commons.logs_exception import TracedServerError

from workspace.models import WorkSpace

from catalogue.templateParser import TemplateParser

from django.http import HttpResponseServerError, HttpResponseBadRequest
from django.conf import settings
from django.utils.translation import ugettext as _

from catalogue.views import GadgetsCollection

from django.utils import simplejson

from django.contrib.auth.forms import AuthenticationForm
from django.http import HttpResponseRedirect, Http404
from django.template import Context, loader

@login_required
def index(request, user_name=None, template="index.html"):
    return render_ezweb(request, user_name, template)

@login_required
def wiring(request, user_name=None):
    """ Wiring view """
    return render_to_response('wiring.html', {}, context_instance=RequestContext(request))

@login_required
def index_lite(request, user_name=None):
    """ EzWeb with no header"""
    return render_ezweb(request, template="index_lite.html")

def redirected_login(request):
    if request.method == "POST":
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            from django.contrib.auth import login
            
            login(request, form.get_user())
            if request.session.test_cookie_worked():
                request.session.delete_test_cookie()
            
    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))       

def add_gadget_script(request, fromWGT = False):  
    """ Page for adding gadgets to catalogue without loading EzWeb """
    if (request.user.is_authenticated() and not request.user.username.startswith('anonymous')):
        if (request.REQUEST.has_key('template_uri')):
            template_uri = request.REQUEST['template_uri']
        else:
            #template_uri not specified!
            t = loader.get_template('catalogue_adder.html')
            c = Context({'msg': _('A template URL must be specified!')})
            return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")
        
        if (request.method.lower() == "get"):
            #GET Request: Render HTML interface!
            
            try:
                #Parsing gadget info from the template!
                templateParser = TemplateParser(template_uri, request.user, save=False)
                templateParser.parse()
            
                gadget = templateParser.get_gadget()
                
                return render_to_response('catalogue_adder.html', {'msg': _('Adding a gadget to EzWeb!'), 'template_uri': template_uri, 'gadget': gadget}, context_instance=RequestContext(request))
            except Exception, e:
                #Error parsing the template
                t = loader.get_template('catalogue_adder.html')
                c = Context({'msg': _('Invalid template URL! Please, specify a valid one!')})
                return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")
        
        
        if (request.method.lower() == "post"):
            #POST Request: Adding gadget to catalogue and to workspace if specified!
                      
            try:
                #Adding to catalogue if it doesn't exist!
                gc = GadgetsCollection()
                
                http_response = gc.create(request, request.user.username, fromWGT=fromWGT)
                
                catalogue_response = simplejson.loads(http_response.content)
            
                if (catalogue_response['result'].lower() != 'ok'):
                    #Error adding in the catalogue!
                    t = loader.get_template('catalogue_adder.html')
                    c = Context({'msg': _('Error ocurred processing template!')})
                    return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")
                
                #Retrieving info from catalogue for creating the "post_load_script" if the user wants to instantiate the gadget! 
                vendor = catalogue_response['vendor']
                version = catalogue_response['version']
                name = catalogue_response['gadgetName']
                
                if (request.REQUEST.has_key('add_to_ws') and request.REQUEST['add_to_ws'] == 'on'):
                    #The gadget must be instantiated in the user workspace!
                    #Loading ezweb for automating gadget instantiation
                    post_load_script = '[{"command": "instantiate_resource", "template": "%s", "vendor_name": "%s", "name": "%s", "version": "%s"}]' \
                        % (template_uri, vendor, name, version)
                    
                    return render_ezweb(request, template="index.html", user_name=request.user.username, post_load_script=post_load_script)
                else:
                    # No gadget instantiation, redirecting to information interface!
                    # Gadget added to catalogue only!
                    t = loader.get_template('catalogue_adder.html')
                    c = Context({'msg': _('Gadget added correctly to Catalogue!')})
                    return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")
            except TracedServerError, e:
                raise e
            except Exception, e:
                msg = _('Error ocurred processing template: %s!') % e.message
                raise TracedServerError(e, {}, request, msg)
                t = loader.get_template('catalogue_adder.html')
                c = Context({'msg': _('Error ocurred processing template: %s!') % e.message})
                return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")
        
    else:
        #Not authenticated or anonymous user => redirecting to login!
        return render_to_response('catalogue_adder_login.html', {'next': request.META['QUERY_STRING'] }, context_instance=RequestContext(request))

def public_ws_viewer(request, public_ws_id):
    """ EzWeb viewer """
    try:
        workspace = WorkSpace.objects.get(id=public_ws_id)
    except WorkSpace.DoesNotExist:
         return HttpResponseServerError(get_xml_error(_('the workspace does not exist')), mimetype='application/xml; charset=UTF-8')
    
    last_user = ''
    if (request.user and request.user.username != 'public' and request.user.username != ''):
        last_user = request.user
    
    public_user=login_public_user(request)
    
    request.user=public_user
    
    if (len(workspace.users.filter(username=public_user.username)) == 1):
        return render_ezweb(request, template="index_viewer.html", public_workspace=public_ws_id, last_user=last_user)
    
    return HttpResponseServerError(get_xml_error(_('the workspace is not shared')), mimetype='application/xml; charset=UTF-8')

def render_ezweb(request, user_name=None, template='index.html', public_workspace='', last_user='', post_load_script=''):
    """ Main view """ 
    if request.META['HTTP_USER_AGENT'].find("iPhone") >= 0 or request.META['HTTP_USER_AGENT'].find("iPod") >= 0:
        return render_to_response('iphone.html', {},
                  context_instance=RequestContext(request))
    else:
        #Checking profile!
        try:
            user_profile = request.user.get_profile()
            user_profile.execute_server_script(request)
            
            script = user_profile.merge_client_scripts(post_load_script)
        except Exception:
            script = post_load_script
        
        return render_to_response(template, {'current_tab': 'dragboard', 'active_workspace': public_workspace, 'last_user': last_user, 'post_load_script': script},
                  context_instance=RequestContext(request))
