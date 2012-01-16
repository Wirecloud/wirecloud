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

import httplib
import urlparse

from django.conf import settings
from django.contrib.auth import load_backend
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import Group
from django.core.urlresolvers import reverse
from django.http import HttpResponseServerError, HttpResponseBadRequest, HttpResponse, HttpResponseRedirect, HttpResponseForbidden
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.shortcuts import get_object_or_404, render_to_response
from django.template import Context, loader, RequestContext

from catalogue.templateParser import TemplateParser
from catalogue.views import ResourceCollection
from commons.authentication import login_public_user
from commons.http_utils import download_http_content
from commons.utils import get_xml_error, get_xhtml_content, json_encode
from catalogue.models import CatalogueResource
from gadget.models import Gadget, XHTML
from workspace.models import WorkSpace
from workspace.utils import get_workspace_list


@user_passes_test(lambda u: u.is_authenticated() and u.username != 'public')
def select_workspace(request):
    _junk1, active_workspace, _junk2 = get_workspace_list(request.user)
    return HttpResponseRedirect(reverse('wirecloud.workspace_view', args=(active_workspace.workspace.id,)))


@login_required
def render_workspace_view(request, workspace):
    if request.user.username != "public":
        workspace = get_object_or_404(WorkSpace, pk=int(workspace))
        if request.user not in workspace.users.all():
            return HttpResponseForbidden()

        post_load_script = '[{"command": "load_workspace", "ws_id": %s}]' % workspace.id
        return render_ezweb(request, request.user.username, None, post_load_script=post_load_script)
    else:
        return HttpResponseRedirect('accounts/login/?next=%s' % request.path)


@login_required
def render_lite_workspace_view(request, workspace):
    return render_workspace_view(request, workspace, "index_lite.html")


def redirected_login(request):
    if request.method == "POST":
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            from django.contrib.auth import login

            login(request, form.get_user())
            if request.session.test_cookie_worked():
                request.session.delete_test_cookie()

    return HttpResponseRedirect(request.META.get('HTTP_REFERER'))


def send_pingback(request, params):
    """ Send HTTP POST to pingback service with indicated params (for FAST Project) """
    default_params = {'result_code': 0, 'result_message': ''}
    default_params.update(params)
    params = default_params

    if 'pingback' in request.REQUEST:
        try:
            url = request.REQUEST['pingback']
            headers = {'Content-type': 'application/json'}
            proto, host, cgi = urlparse.urlparse(url)[:3]

            data = {'PlatformName': 'EzWeb', 'Result': {'Code': params['result_code'], 'Message': params['result_message']}}
            if 'vendor' in params and 'gadgetName' in params and 'version' in params:
                data['GadgetOwner'] = params['vendor']
                data['GadgetName'] = params['gadgetName']
                data['GadgetVersion'] = params['version']
            if 'gadgetId' in params:
                data['Identifier'] = str(params['gadgetId'])
            data = simplejson.dumps(data)

            # HTTP call
            conn = httplib.HTTPConnection(host)
            conn.request("POST", cgi, data, headers)
            conn.getresponse()
            conn.close()
        except:
            pass


def add_gadget_script(request, fromWGT=False, user_action=True):
    """ Page for adding gadgets to catalogue without loading EzWeb """
    if (request.user.is_authenticated() and not request.user.username.startswith('anonymous')):
        if ('template_uri' in request.REQUEST):
            template_uri = request.REQUEST['template_uri']
        else:
            #Send pingback ERROR
            send_pingback(request, {'result_code': -3, 'result_message': _('A template URL must be specified!')})

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

                params = {'msg': _('Adding a gadget to EzWeb!'), 'template_uri': template_uri, 'gadget': gadget}

                if 'pingback' in request.REQUEST:
                    params['pingback'] = request.REQUEST['pingback']

                return render_to_response('catalogue_adder.html', params, context_instance=RequestContext(request))
            except Exception, e:
                #Send pingback ERROR
                send_pingback(request, {'result_code': -3, 'result_message': _('Invalid template URL! Please, specify a valid one!')})

                #Error parsing the template
                t = loader.get_template('catalogue_adder.html')
                c = Context({'msg': _('Invalid template URL! Please, specify a valid one!')})
                return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")

        if (request.method.lower() == "post"):
            #POST Request: Adding gadget to catalogue and to workspace if specified!
            catalogue_response = {}
            try:
                #Adding to catalogue if it doesn't exist!
                gc = ResourceCollection()

                http_response = gc.create(request, request.user.username, fromWGT=fromWGT)
                if not user_action:
                    return http_response

                catalogue_response = simplejson.loads(http_response.content)

                #Cancel by the user
                if 'pingback_cancel' in request.REQUEST and (request.REQUEST['pingback_cancel'] == 'true'):
                    if 'pingback' in request.REQUEST:
                        #Send pingback CANCEL
                        catalogue_response['result_code'] = 1
                        catalogue_response['result_message'] = _('Cancel by the user')
                        send_pingback(request, catalogue_response)
                    #Redirect
                    return HttpResponseRedirect('/')

                if (catalogue_response['result'].lower() != 'ok'):
                    #Send pingback ERROR
                    if 'gadgetName' in catalogue_response:
                        catalogue_response['result_code'] = -2
                        catalogue_response['result_message'] = _('Gadget already exists!')
                    else:
                        catalogue_response['result_code'] = -1
                        catalogue_response['result_message'] = _('Error ocurred processing template!')
                    send_pingback(request, catalogue_response)

                    #Error adding in the catalogue!
                    t = loader.get_template('catalogue_adder.html')
                    c = Context({'msg': catalogue_response['result_message']})
                    return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")

                #Send pingback OK
                catalogue_response['result_code'] = 0
                catalogue_response['result_message'] = _('Success')
                send_pingback(request, catalogue_response)

                if ('add_to_ws' in request.REQUEST and request.REQUEST['add_to_ws'] == 'on'):
                    #The gadget must be instantiated in the user workspace!
                    #Loading ezweb for automating gadget instantiation
                    vendor = catalogue_response['vendor']
                    version = catalogue_response['version']
                    name = catalogue_response['gadgetName']
                    post_load_script = '[{"command": "instantiate_resource", "template": "%s", "vendor_name": "%s", "name": "%s", "version": "%s"}]' % (template_uri, vendor, name, version)

                    return render_ezweb(request, view_type="index", user_name=request.user.username, post_load_script=post_load_script)
                else:
                    # No gadget instantiation, redirecting to information interface!
                    # Gadget added to catalogue only!
                    t = loader.get_template('catalogue_adder.html')
                    c = Context({'msg': _('Gadget added correctly to Catalogue!')})
                    return HttpResponse(t.render(c), mimetype="application/xhtml+xml")
            except Exception, e:
                #Send pingback ERROR
                catalogue_response['result_code'] = -1
                catalogue_response['result_message'] = _('Error ocurred processing template!')
                send_pingback(request, catalogue_response)

                t = loader.get_template('catalogue_adder.html')
                c = Context({'msg': _('Error ocurred processing template: %s!') % e.message})
                return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")

    else:
        #Not authenticated or anonymous user => redirecting to login!
        params = {'next': request.META['QUERY_STRING']}

        if 'pingback' in request.REQUEST:
            params['pingback'] = request.REQUEST['pingback']

        return render_to_response('catalogue_adder_login.html', params, context_instance=RequestContext(request))


def update_gadget_script(request, fromWGT=False, user_action=True):
    """ Page for adding gadgets to catalogue without loading EzWeb """
    if (request.user.is_authenticated() and not request.user.username.startswith('anonymous')):
        if ('gadget_vendor' in request.REQUEST and 'gadget_name' in request.REQUEST and 'gadget_version' in  request.REQUEST):
            vendor = request.REQUEST['gadget_vendor']
            name = request.REQUEST['gadget_name']
            version = request.REQUEST['gadget_version']
        else:
            #Send pingback ERROR
            send_pingback(request, {'result_code': -3, 'result_message': _('Invalid params for gadget update! (gadget_vendor, gadget_name, gadget_version)')})

            #template_uri not specified!
            t = loader.get_template('catalogue_adder.html')
            c = Context({'msg': _('Invalid params for gadget update! (gadget_vendor, gadget_name, gadget_version)')})
            return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")

        gadget_info = {'vendor': vendor, 'gadgetName': name, 'version': version}  # For ping_back

        #Cancel by the user
        if 'pingback_cancel' in request.REQUEST and (request.REQUEST['pingback_cancel'] == 'true'):
            if 'pingback' in request.REQUEST:
                #Send pingback CANCEL
                gadget_info['result_code'] = 1
                gadget_info['result_message'] = _('Cancel by the user')
                send_pingback(request, gadget_info)
            #Redirect
            return HttpResponseRedirect('/')

        try:
            resource = CatalogueResource.objects.get(short_name=name, vendor=vendor, version=version)
            gadget_info['gadgetId'] = resource.id
        except Exception:
            #Send pingback ERROR
            gadget_info['result_code'] = -3
            gadget_info['result_message'] = _('Invalid gadget info! Please, specify a valid one!')
            send_pingback(request, gadget_info)

            #Error parsing the template
            t = loader.get_template('catalogue_adder.html')
            c = Context({'msg': _('Invalid gadget info! Please, specify a valid one!')})
            return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")

        gadget = None
        try:
            gadget = Gadget.objects.get(name=name, vendor=vendor, version=version)
        except Exception:
            pass

        try:
            if gadget != None:
                xhtml = XHTML.objects.get(id=gadget.xhtml.id)

                content_type = gadget.xhtml.content_type
                if not content_type:
                    content_type = 'text/html'

                #if not xhtml.cacheable:
                if (not xhtml.url.startswith('http') and not xhtml.url.startswith('https')):
                    xhtml.code = get_xhtml_content(xhtml.url)
                else:
                    xhtml.code = download_http_content(xhtml.url, user=request.user)
                xhtml.save()
        except Exception:
            #Send pingback ERROR
            gadget_info['result_code'] = -3
            gadget_info['result_message'] = _('XHTML code is not accessible!')
            send_pingback(request, gadget_info)

            #Error parsing the template
            t = loader.get_template('catalogue_adder.html')
            c = Context({'msg': _('XHTML code is not accessible!')})
            return HttpResponseBadRequest(t.render(c), mimetype="application/xhtml+xml")

        #Send pingback OK
        gadget_info['result_code'] = 0
        gadget_info['result_message'] = _('Success')
        send_pingback(request, gadget_info)

        # Gadget updated!
        t = loader.get_template('catalogue_adder.html')
        c = Context({'msg': _('Gadget updated correctly!')})
        return HttpResponse(t.render(c), mimetype="application/xhtml+xml")

    else:
        #Not authenticated or anonymous user => redirecting to login!
        params = {'next': request.META['QUERY_STRING']}

        if 'pingback' in request.REQUEST:
            params['pingback'] = request.REQUEST['pingback']

        return render_to_response('catalogue_adder_login.html', params, context_instance=RequestContext(request))


def public_ws_viewer(request, public_ws_id):
    """ EzWeb viewer """
    try:
        workspace = WorkSpace.objects.get(id=public_ws_id)
    except WorkSpace.DoesNotExist:
        return HttpResponseServerError(get_xml_error(_('the workspace does not exist')), mimetype='application/xml; charset=UTF-8')

    last_user = ''
    if (request.user and request.user.username != 'public' and request.user.username != ''):
        last_user = request.user

    public_user = login_public_user(request)

    request.user = public_user

    if (len(workspace.users.filter(username=public_user.username)) == 1):
        return render_ezweb(request, view_type="viewer", public_workspace=public_ws_id, last_user=last_user)

    return HttpResponseServerError(get_xml_error(_('the workspace is not shared')), mimetype='application/xml; charset=UTF-8')


def get_user_screen_name(request):
    #the backend is the one who knows where to look for the screen name of the user
    backend_path = request.session._session['_auth_user_backend']
    user_backend = load_backend(backend_path)

    try:
        return user_backend.get_screen_name(request)
    except:
        return None


def manage_groups(user, groups):
    user.groups.clear()
    for group in groups:
        group, created = Group.objects.get_or_create(name=group)
        user.groups.add(group)
    user.save()


def render_ezweb(request, user_name=None, view_type=None, public_workspace='', last_user='', post_load_script='[]'):
    """ Main view """
    if view_type is None:
        if 'view' in request.GET:
            view_type = request.GET['view']
        else:
            user_agent = request.META['HTTP_USER_AGENT']
            if user_agent.find("iPhone") != -1 or user_agent.find("iPod") != -1 or user_agent.find('Android') != -1:
                view_type = 'iphone'
            else:
                view_type = 'index'

    # Checking profile!
    if hasattr(settings, 'AUTHENTICATION_SERVER_URL'):
        url = settings.AUTHENTICATION_SERVER_URL

        if (not url.endswith('/')):
            url += '/'

        url = "%sapi/user/%s/data.json" % (url, request.user.username)

        try:
            user_data = simplejson.loads(download_http_content(url))

            manage_groups(request.user, user_data['groups'])
            request.session['policies'] = json_encode({"user_policies": user_data['user_policies'], "all_policies": user_data['all_policies']})
        except:
            request.session['policies'] = "null"
    else:
        request.session['policies'] = "null"

    try:
        user_profile = request.user.get_profile()
        user_profile.execute_server_script(request)

        script = user_profile.merge_client_scripts(post_load_script)
    except Exception:
        script = post_load_script

    screen_name = get_user_screen_name(request)

    context = {
        'screen_name': screen_name,
        'current_tab': 'dragboard',
        'active_workspace': public_workspace,
        'last_user': last_user,
        'post_load_script': script,
    }

    return render_to_response(view_type + '.html', context, context_instance=RequestContext(request))
