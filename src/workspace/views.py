# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

# This file is based on Morfeo EzWeb Platform

#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)


import urlparse

from django.contrib.auth.decorators import user_passes_test, login_required
from django.contrib.auth.models import Group, User
from django.core.urlresolvers import reverse
from django.db import transaction, IntegrityError
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseServerError
from django.http import HttpResponseForbidden, Http404
from django.shortcuts import get_object_or_404
from django.utils import simplejson
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext as _
from django.utils.http import urlencode

from catalogue.utils import add_resource_from_template
from commons.authentication import get_user_authentication, get_public_user, logout_request, relogin_after_public
from commons.cache import no_cache
from commons.get_data import get_workspace_data, get_global_workspace_data, get_tab_data
from commons.http_utils import PUT_parameter, download_http_content
from commons.logs import log
from commons.logs_exception import TracedServerError
from commons.resource import Resource
from commons.template import TemplateParser
from commons.transaction import commit_on_http_success
from commons.service import Service
from commons.utils import get_xml_error, json_encode
from igadget.models import IGadget
from igadget.utils import deleteIGadget
from packageCloner import PackageCloner
from packageLinker import PackageLinker
from workspace.mashupTemplateGenerator import build_rdf_template_from_workspace, build_template_from_workspace
from workspace.mashupTemplateParser import buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate
from workspace.models import Category
from workspace.models import VariableValue
from workspace.models import Tab
from workspace.models import PublishedWorkSpace, UserWorkSpace, WorkSpace
from workspace.utils import deleteTab, createTab, create_published_workspace_from_template, getCategories, getCategoryId, get_workspace_list, setVisibleTab, set_variable_value
from marketAdaptor import marketadaptor
from wirecloud.models.markets import Market
from wirecloud.markets.utils import get_market_managers


def clone_original_variable_value(variable, creator, new_user):
    original_var_value = VariableValue.objects.get(variable=variable, user=creator)

    value = original_var_value.get_variable_value()

    return VariableValue.objects.create(variable=variable, user=new_user, value=value)


def createWorkSpace(workspaceName, user):
    cloned_workspace = None
    #try to assign a new workspace according to user category
    try:
        categories = getCategories(user)
        # take the first one which has a new workspace
        for category in categories:
            try:
                new_workspace = Category.objects.get(category_id=getCategoryId(category)).new_workspace
                if new_workspace != None:
                    cloned_workspace, _junk = buildWorkspaceFromTemplate(new_workspace.template, user)

                    cloned_workspace.name = workspaceName
                    cloned_workspace.save()

                    setActiveWorkspace(user, cloned_workspace)
                    break
            except Category.DoesNotExist:
                #the user category doesn't have a new workspace
                #try with other categories
                continue

    except:
        pass

    if not cloned_workspace:
        #create an empty workspace
        return createEmptyWorkSpace(workspaceName, user)

    # Returning created Ids
    return cloned_workspace


def createEmptyWorkSpace(workSpaceName, user):
    active = False
    workspaces = UserWorkSpace.objects.filter(user__id=user.id, active=True)
    if workspaces.count() == 0:
        # there isn't yet an active workspace
        active = True

    #Workspace creation
    workspace = WorkSpace(name=workSpaceName, creator=user)
    workspace.save()

    #Adding user reference to workspace in the many to many relationship
    user_workspace = UserWorkSpace(user=user, workspace=workspace, active=active)
    user_workspace.save()

    #Tab creation
    createTab(_('Tab'), user, workspace)

    return workspace


def setActiveWorkspace(user, workspace):

    UserWorkSpace.objects.filter(user=user, active=True).exclude(workspace=workspace).update(active=False)
    UserWorkSpace.objects.filter(user=user, workspace=workspace).update(active=True)


def cloneWorkspace(workspace_id, user):

    published_workspace = get_object_or_404(PublishedWorkSpace, id=workspace_id)

    workspace = published_workspace.workspace

    packageCloner = PackageCloner()

    cloned_workspace = packageCloner.clone_tuple(workspace)

    cloned_workspace.creator = user

    cloned_workspace.save()

    return cloned_workspace


def linkWorkspaceObject(user, workspace, creator, link_variable_values=True):
    packageLinker = PackageLinker()

    return packageLinker.link_workspace(workspace, user, creator, link_variable_values)


def linkWorkspace(user, workspace_id, creator, link_variable_values=True):
    workspace = get_object_or_404(WorkSpace, id=workspace_id)

    return linkWorkspaceObject(user, workspace, creator, link_variable_values)


class WorkSpaceCollection(Resource):

    @transaction.commit_on_success
    @no_cache
    def read(self, request):
        user = get_user_authentication(request)

        try:

            workspaces, _junk, reload_showcase = get_workspace_list(user)

        except Exception, e:
            msg = _("error reading workspace: ") + unicode(e)

            raise TracedServerError(e, "bad creation of default workspaces", request, msg)

        data_list = {
            'workspaces': [get_workspace_data(workspace, user) for workspace in workspaces],
            'reloadShowcase': reload_showcase,
        }

        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def create(self, request):
        user = get_user_authentication(request)

        if 'workspace' not in request.POST:
            return HttpResponseBadRequest(get_xml_error(_("workspace JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.POST['workspace']

        try:
            ts = simplejson.loads(received_json)

            if 'name' not in ts:
                raise Exception(_('Malformed workspace JSON: expecting workspace uri.'))

            workspace_name = ts['name']

            workspace = createWorkSpace(workspace_name, user)
            workspace_data = get_global_workspace_data(workspace, user)

            return workspace_data.get_response()

        except Exception, e:
            transaction.rollback()
            msg = _("workspace cannot be created: ") + unicode(e)

            raise TracedServerError(e, ts, request, msg)


class WorkSpaceEntry(Resource):

    @transaction.commit_on_success
    def read(self, request, workspace_id, last_user=''):
        #last_user : last_user_after_public autologin
        user = get_user_authentication(request)

        workspace = get_object_or_404(WorkSpace, users__id=user.id, pk=workspace_id)
        workspace_data = get_global_workspace_data(workspace, user)

        #Closing session after downloading public user workspace
        if (user.username == 'public' and last_user and last_user != 'public' and last_user != ''):
            logout_request(request)
            request.user = relogin_after_public(request, last_user, None)

        return workspace_data.get_response()

    @transaction.commit_on_success
    def update(self, request, workspace_id, last_user=''):
        user = get_user_authentication(request)

        received_json = PUT_parameter(request, 'workspace')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("workspace JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            ts = simplejson.loads(received_json)
            workspace = WorkSpace.objects.get(users__id=user.id, pk=workspace_id)

            if 'active' in ts:
                active = ts['active']
                if (active == 'true'):
                    #Only one active workspace
                    setActiveWorkspace(user, workspace)
                else:
                    currentUserWorkspace = UserWorkSpace.objects.get(workspace=workspace, user=user)
                    currentUserWorkspace.active = True
                    currentUserWorkspace.save()

            if 'name' in ts:
                workspace.name = ts['name']

            workspace.save()

            return HttpResponse('ok')
        except Exception, e:
            transaction.rollback()
            msg = _("workspace cannot be updated: ") + unicode(e)

            raise TracedServerError(e, ts, request, msg)

    @transaction.commit_on_success
    def delete(self, request, workspace_id, last_user=''):
        user = get_user_authentication(request)

        user_workspaces = UserWorkSpace.objects.select_related('workspace')
        try:
            user_workspace = user_workspaces.get(user__id=user.id, workspace__id=workspace_id)
        except UserWorkSpace.DoesNotExist:
            raise Http404

        workspace = user_workspace.workspace
        if workspace.creator != user or user_workspace.manager != '':
            return HttpResponseForbidden()

        # Check if the user does not have any other workspace
        workspaces = WorkSpace.objects.filter(users__id=user.id).exclude(pk=workspace_id)

        if workspaces.count() == 0:
            msg = _("workspace cannot be deleted")

            raise TracedServerError(None, {'workspace': workspace_id}, request, msg)

        # Remove the workspace
        PublishedWorkSpace.objects.filter(workspace=workspace).update(workspace=None)
        igadgets = IGadget.objects.filter(tab__workspace=workspace)
        for igadget in igadgets:
            deleteIGadget(igadget, user)
        workspace.delete()

        from commons.get_data import _invalidate_cached_variable_values
        _invalidate_cached_variable_values(workspace)

        # Set a new active workspace (first workspace by default)
        activeWorkspace = workspaces[0]
        setActiveWorkspace(user, activeWorkspace)

        return HttpResponse(status=204)


class TabCollection(Resource):

    @transaction.commit_on_success
    def create(self, request, workspace_id):
        user = get_user_authentication(request)

        if 'tab' not in request.POST:
            return HttpResponseBadRequest(get_xml_error(_("tab JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.POST['tab']

        try:
            t = simplejson.loads(received_json)

            if 'name' not in t:
                raise Exception(_('Malformed tab JSON: expecting tab name.'))

            tab_name = t['name']
            workspace = WorkSpace.objects.get(users__id=user.id, pk=workspace_id)

            tab = createTab(tab_name, user, workspace)

            # Returning created Ids
            ids = {'id': tab.id, 'name': tab.name}

            return HttpResponse(json_encode(ids), mimetype='application/json; charset=UTF-8')

        except Exception, e:
            transaction.rollback()
            msg = _("tab cannot be created: ") + unicode(e)

            raise TracedServerError(e, t, request, msg)

    @transaction.commit_on_success
    def update(self, request, workspace_id):
        user = get_user_authentication(request)

        user_workspaces = UserWorkSpace.objects.select_related('workspace')
        try:
            user_workspace = user_workspaces.get(user__id=user.id, workspace__id=workspace_id)
        except UserWorkSpace.DoesNotExist:
            raise Http404

        workspace = user_workspace.workspace
        if workspace.creator != user or user_workspace.manager != '':
            return HttpResponseForbidden()

        received_json = PUT_parameter(request, 'order')
        try:
            order = simplejson.loads(received_json)

            tabs = Tab.objects.filter(id__in=order)

            for tab in tabs:
                tab.position = order.index(tab.id)
                tab.save()

            from commons.get_data import _invalidate_cached_variable_values
            _invalidate_cached_variable_values(workspace)

            return HttpResponse(status=204)

        except Exception, e:
            transaction.rollback()
            msg = _("tab order cannot be updated: ") + unicode(e)

            raise TracedServerError(e, received_json, request, msg)


class TabEntry(Resource):

    def read(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)

        tab = get_object_or_404(Tab, workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
        tab_data = get_tab_data(tab)

        return HttpResponse(json_encode(tab_data), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def update(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)

        received_json = PUT_parameter(request, 'tab')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("tab JSON expected")), mimetype='application/xml; charset=UTF-8')

        tabs = Tab.objects.select_related('workspace')
        try:
            tab = tabs.get(workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
        except Tab.DoesNotExist:
            raise Http404

        workspace = tab.workspace
        user_workspace = UserWorkSpace.objects.get(user__id=user.id, workspace__id=workspace_id)
        if workspace.creator != user or user_workspace.manager != '':
            return HttpResponseForbidden()

        try:
            t = simplejson.loads(received_json)

            if 'visible' in t:
                visible = t['visible']
                if (visible == 'true'):
                    #Only one visible tab
                    setVisibleTab(user, workspace_id, tab)
                else:
                    tab.visible = False

            if 'name' in t:
                tab.name = t['name']

            tab.save()

            from commons.get_data import _invalidate_cached_variable_values
            _invalidate_cached_variable_values(workspace)

            return HttpResponse(status=204)
        except Exception, e:
            transaction.rollback()
            msg = _("tab cannot be updated: ") + unicode(e)

            raise TracedServerError(e, received_json, request, msg)

    @transaction.commit_on_success
    def delete(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)

        #set new order
        tabs = Tab.objects.filter(workspace__pk=workspace_id).order_by('position')

        # Get tab, if it does not exist, an http 404 error is returned
        tab = get_object_or_404(Tab, workspace__pk=workspace_id, pk=tab_id)

        #decrease the position of the following tabs
        for t in range(tab.position, tabs.count()):
            tabs[t].position = tabs[t].position - 1

        tabs = tabs.exclude(pk=tab_id)

        if tabs.count() == 0:
            msg = _("tab cannot be deleted")
            log(msg, request)
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

        #Delete WorkSpace variables too!
        deleteTab(tab, user)

        #set a new visible tab (first tab by default)
        activeTab = tabs[0]
        setVisibleTab(user, workspace_id, activeTab)

        return HttpResponse('ok')


class WorkSpaceVariableCollection(Resource):

    @transaction.commit_on_success
    def update(self, request, workspace_id):
        user = get_user_authentication(request)

        content_type = request.META.get('CONTENT_TYPE', '')
        if content_type == None:
            content_type = ''

        if content_type.startswith('application/json'):
            received_json = request.raw_post_data
        else:
            received_json = PUT_parameter(request, 'variables')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("variables JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            variables = simplejson.loads(received_json)

            igadgetVariables = variables['igadgetVars']

            variables_to_notify = []
            for igVar in igadgetVariables:
                variables_to_notify += set_variable_value(igVar['id'], user, igVar['value'])

            data = {'igadgetVars': variables_to_notify}
            return HttpResponse(json_encode(data), mimetype='application/json; charset=UTF-8')

        except Exception, e:
            transaction.rollback()
            msg = _("cannot update variables: ") + unicode(e)

            raise TracedServerError(e, received_json, request, msg)


class WorkSpaceMergerEntry(Resource):

    @transaction.commit_on_success
    @no_cache
    def read(self, request, from_ws_id, to_ws_id):
        from_ws = get_object_or_404(WorkSpace, id=from_ws_id)
        to_ws = get_object_or_404(WorkSpace, id=to_ws_id)

        user = get_user_authentication(request)

        packageCloner = PackageCloner()

        to_workspace = packageCloner.merge_workspaces(from_ws, to_ws, user)

        result = {'result': 'ok', 'merged_workspace_id': to_workspace.id}
        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')


class WorkSpaceSharerEntry(Resource):

    @transaction.commit_on_success
    def update(self, request, workspace_id, share_boolean):
        user = get_user_authentication(request)

        try:
            workspace = WorkSpace.objects.get(id=workspace_id)
        except WorkSpace.DoesNotExist:
            msg = 'The workspace does not exist!'
            result = {'result': 'error', 'description': msg}
            HttpResponseServerError(json_encode(result), mimetype='application/json; charset=UTF-8')

        owner = workspace.creator

        if (owner != user):
            msg = 'You are not the owner of the workspace, so you can not share it!'
            result = {'result': 'error', 'description': msg}
            return HttpResponseForbidden(json_encode(result), mimetype='application/json; charset=UTF-8')

        #Everything right!
        if 'groups' not in request.REQUEST:
            #Share with everybody
            #Linking with public user!
            public_user = get_public_user(request)

            linkWorkspaceObject(public_user, workspace, owner, link_variable_values=True)

            workspace_path = reverse('wirecloud.workspace_view', args=(workspace_id,))
            url = request.build_absolute_uri(workspace_path + '?' + urlencode({u'view': 'viewer'}))

            result = {"result": "ok", "url": url}
            return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')
        else:
            #Share only with the scpecified groups
            try:
                groups = simplejson.loads(PUT_parameter(request, 'groups'))
                queryGroups = Group.objects.filter(id__in=groups)
                for g in queryGroups:
                    workspace.targetOrganizations.add(g)

                users = User.objects.filter(groups__in=groups).distinct()
                for user in users:
                    #link the workspace with each user
                    linkWorkspaceObject(user, workspace, owner, link_variable_values=True)

            except Exception, e:
                transaction.rollback()
                msg = _("workspace cannot be shared: ") + unicode(e)

                raise TracedServerError(e, groups, request, msg)
            result = {"result": "ok"}
            return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

    @no_cache
    def read(self, request, workspace_id):
        get_user_authentication(request)

        groups = []
        #read the groups that can be related to a workspace
        queryGroups = Group.objects.exclude(name__startswith="cert__").order_by('name')
        for group in queryGroups:
            data = {'name': group.name, 'id': group.id}
            try:
                group.workspace_set.get(id=workspace_id)
                #boolean for js
                data['sharing'] = 'true'
            except WorkSpace.DoesNotExist:
                data['sharing'] = 'false'

            groups.append(data)

        return HttpResponse(json_encode(groups), mimetype='application/json; charset=UTF-8')


class WorkSpaceLinkerEntry(Resource):

    @transaction.commit_on_success
    @no_cache
    def read(self, request, workspace_id):
        user = get_user_authentication(request)

        linkWorkspace(user, workspace_id)

        result = {"result": "ok"}
        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')


class WorkSpaceClonerEntry(Resource):

    @transaction.commit_on_success
    @no_cache
    def read(self, request, workspace_id):
        user = get_user_authentication(request)

        cloned_workspace = cloneWorkspace(workspace_id, user)
        result = {'result': 'ok', 'new_workspace_id': cloned_workspace.id}
        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')


class MashupMergeService(Service):

    @method_decorator(login_required)
    @commit_on_http_success
    def process(self, request, to_ws_id):

        content_type = request.META.get('CONTENT_TYPE', '')
        if content_type == None:
            content_type = ''

        if content_type.startswith('application/json'):
            received_json = request.raw_post_data
        else:
            return HttpResponseBadRequest(get_xml_error(_("merge data expected")), mimetype='application/xml; charset=UTF-8')

        data = simplejson.loads(received_json)
        template_url = data['workspace']

        to_ws = get_object_or_404(WorkSpace, id=to_ws_id)
        if not request.user.is_staff and to_ws.creator != request.user:
            return HttpResponseForbidden()

        path = request.build_absolute_uri()
        login_scheme, login_netloc = urlparse.urlparse(template_url)[:2]
        current_scheme, current_netloc = urlparse.urlparse(path)[:2]
        if ((not login_scheme or login_scheme == current_scheme) and
            (not login_netloc or login_netloc == current_netloc)):
            pworkspace_id = template_url.split('/')[-2]
            template = PublishedWorkSpace.objects.get(id=pworkspace_id).template
        else:
            template = download_http_content(template_url, user=request.user)

        fillWorkspaceUsingTemplate(to_ws, template)

        result = {'result': 'ok', 'workspace_id': to_ws_id}
        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')


class MashupImportService(Service):

    @method_decorator(login_required)
    @commit_on_http_success
    def process(self, request):

        content_type = request.META.get('CONTENT_TYPE', '')
        if content_type == None:
            content_type = ''

        if content_type.startswith('application/json'):
            received_json = request.raw_post_data
        else:
            return HttpResponseBadRequest(get_xml_error(_("import data expected")), mimetype='application/xml; charset=UTF-8')

        data = simplejson.loads(received_json)
        template_url = data['workspace']

        path = request.build_absolute_uri()
        login_scheme, login_netloc = urlparse.urlparse(template_url)[:2]
        current_scheme, current_netloc = urlparse.urlparse(path)[:2]
        if ((not login_scheme or login_scheme == current_scheme) and
            (not login_netloc or login_netloc == current_netloc)):
            pworkspace_id = template_url.split('/')[-2]
            template = PublishedWorkSpace.objects.get(id=pworkspace_id).template
        else:
            template = download_http_content(template_url, user=request.user)
        workspace, _junk = buildWorkspaceFromTemplate(template, request.user)

        activate = data.get('active', False) == "true"
        if not activate:
            workspaces = UserWorkSpace.objects.filter(user__id=request.user.id, active=True)
            if workspaces.count() == 0:
                # there aren't any active workspace yet
                activate = True

        # Mark the mashup as the active workspace if it's requested. For example, solutions
        if activate:
            setActiveWorkspace(request.user, workspace)

        workspace_data = get_global_workspace_data(workspace, request.user)

        return HttpResponse(json_encode(workspace_data.get_data()), mimetype='application/json; charset=UTF-8')


def check_json_fields(json, fields):
    missing_fields = []

    for field in fields:
        if not field in json:
            missing_fields.append(field)

    return missing_fields


class WorkSpacePublisherEntry(Resource):

    @transaction.commit_on_success
    def create(self, request, workspace_id):
        if 'data' not in request.REQUEST:
            return HttpResponseBadRequest(get_xml_error(_("mashup data expected")), mimetype='application/xml; charset=UTF-8')

        received_json = request.REQUEST['data']
        try:
            mashup = simplejson.loads(received_json)
            missing_fields = check_json_fields(mashup, ['name', 'vendor', 'version', 'email'])
            if len(missing_fields) > 0:
                raise Exception(_('Malformed mashup JSON. The following field(s) are missing: %(fields)s.') % {'fields': missing_fields})

        except Exception, e:
            msg = _("mashup cannot be published: ") + unicode(e)
            return HttpResponseBadRequest(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

        user = get_user_authentication(request)
        workspace = get_object_or_404(WorkSpace, id=workspace_id)
        template = TemplateParser(build_rdf_template_from_workspace(mashup, workspace, user).serialize())
        published_workspace = create_published_workspace_from_template(template, user)
        published_workspace.workspace = workspace
        published_workspace.params = received_json
        published_workspace.save()

        market_managers = get_market_managers()
        errors = {}
        for market_endpoint in mashup['marketplaces']:

            try:
                market_managers[market_endpoint['market']].publish_mashup(market_endpoint, published_workspace, user, mashup)
            except Exception, e:
                errors[market_endpoint['market']] = unicode(e)

        if len(errors) == 0:
            return HttpResponse(status=201)
        elif len(errors) == len(mashup['marketplaces']):
            return HttpResponse(json_encode(errors), status=502, mimetype='application/json; charset=UTF-8')
        else:
            return HttpResponse(json_encode(errors), status=200, mimetype='application/json; charset=UTF-8')


class WorkspaceExportService(Service):

    @method_decorator(user_passes_test(lambda u: u.is_authenticated() and u.username != 'public'))
    def process(self, request, workspace_id):

        if 'options' not in request.POST:
            return HttpResponseBadRequest(get_xml_error(_("exporting options expected")), mimetype='application/xml; charset=UTF-8')

        user = get_user_authentication(request)
        workspace = get_object_or_404(WorkSpace, id=workspace_id)

        if not user.is_staff and workspace.creator != user:
            return HttpResponseForbidden()

        received_json = request.POST['options']
        try:
            mashup = simplejson.loads(received_json)
            missing_fields = check_json_fields(mashup, ['name', 'vendor', 'version', 'email'])
            if len(missing_fields) > 0:
                raise Exception(_('Malformed mashup JSON. The following field(s) are missing: %(fields)s.') % {'fields': missing_fields})

        except Exception, e:
            msg = _("mashup cannot be exported: ") + unicode(e)
            return HttpResponseBadRequest(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

        template = build_template_from_workspace(mashup, workspace, user)
        return HttpResponse(template, mimetype='application/xml; charset=UTF-8')


class MashupTemplate(Resource):

    def read(self, request, workspace_id):
        user = get_user_authentication(request)

        published_workspace = get_object_or_404(PublishedWorkSpace, id=workspace_id)
        if not user.is_staff and published_workspace.creator != user:
            return HttpResponseForbidden()

        return HttpResponse(published_workspace.template, mimetype='application/xml; charset=UTF-8')
