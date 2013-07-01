# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

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

from cStringIO import StringIO
import os
import urlparse
import zipfile

from django.contrib.auth.models import Group, User
from django.core.urlresolvers import reverse
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseForbidden, Http404
from django.shortcuts import get_object_or_404
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.utils.http import urlencode

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource, Service
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.cache import no_cache
from wirecloud.commons.utils.http import authentication_required, build_error_response, get_content_type, supported_request_mime_types
from wirecloud.commons.utils.template import is_valid_name, is_valid_vendor, is_valid_version, TemplateParser
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.get_data import get_workspace_data, get_global_workspace_data
from wirecloud.platform.iwidget.utils import deleteIWidget
from wirecloud.platform.models import IWidget, PublishedWorkspace, Tab, UserWorkspace, VariableValue, Workspace
from wirecloud.platform.workspace.mashupTemplateGenerator import build_rdf_template_from_workspace, build_template_from_workspace
from wirecloud.platform.workspace.mashupTemplateParser import check_mashup_dependencies, buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate, MissingDependencies
from wirecloud.platform.workspace.packageLinker import PackageLinker
from wirecloud.platform.workspace.utils import deleteTab, createTab, get_workspace_list, setVisibleTab, set_variable_value
from wirecloud.platform.markets.utils import get_market_managers


def clone_original_variable_value(variable, creator, new_user):
    original_var_value = VariableValue.objects.get(variable=variable, user=creator)

    value = original_var_value.get_variable_value()

    return VariableValue.objects.create(variable=variable, user=new_user, value=value)


def createEmptyWorkspace(workspaceName, user):
    active = False
    workspaces = UserWorkspace.objects.filter(user__id=user.id, active=True)
    if workspaces.count() == 0:
        # there isn't yet an active workspace
        active = True

    empty_wiring = '{"operators": {}, "connections": []}'

    workspace = Workspace.objects.create(name=workspaceName, creator=user, wiringStatus=empty_wiring)
    UserWorkspace.objects.create(user=user, workspace=workspace, active=active)

    # Tab creation
    createTab(_('Tab'), user, workspace)

    return workspace


def setActiveWorkspace(user, workspace):

    UserWorkspace.objects.filter(user=user, active=True).exclude(workspace=workspace).update(active=False)
    UserWorkspace.objects.filter(user=user, workspace=workspace).update(active=True)


def linkWorkspaceObject(user, workspace, creator, link_variable_values=True):
    packageLinker = PackageLinker()

    return packageLinker.link_workspace(workspace, user, creator, link_variable_values)


def linkWorkspace(user, workspace_id, creator, link_variable_values=True):
    workspace = get_object_or_404(Workspace, id=workspace_id)

    return linkWorkspaceObject(user, workspace, creator, link_variable_values)


class WorkspaceCollection(Resource):

    @authentication_required
    @commit_on_http_success
    @no_cache
    def read(self, request):

        workspaces, _junk, reload_showcase = get_workspace_list(request.user)
        data_list = [get_workspace_data(workspace, request.user) for workspace in workspaces]

        return HttpResponse(simplejson.dumps(data_list), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/x-www-form-urlencoded', 'application/json'))
    @commit_on_http_success
    def create(self, request):

        content_type = get_content_type(request)[0]
        if content_type == 'application/json':
            try:
                data = simplejson.loads(request.raw_post_data)
            except Exception, e:
                msg = _("malformed json data: %s") % unicode(e)
                return build_error_response(request, 400, msg)

            workspace_name = data.get('name', '').strip()
            mashup_id = data.get('mashup', '')
            dry_run = data.get('', 'false').lower() == 'true'
        else:
            workspace_name = request.POST.get('name', '').strip()
            mashup_id = request.POST.get('mashup', '')
            dry_run = request.POST.get('', 'false').lower() == 'true'

        if mashup_id == '' and workspace_name == '':
            return build_error_response(request, 422, _('missing workspace name'))

        if mashup_id == '':

            if dry_run:
                return HttpResponse(status_code=204)

            try:
                workspace = createEmptyWorkspace(workspace_name, request.user)
            except IntegrityError:
                msg = _('A workspace with the given name already exists')
                return build_error_response(request, 409, msg)
        else:
            values = mashup_id.split('/', 3)
            if len(values) != 3:
                return build_error_response(request, 422, _('invalid mashup id'))

            (mashup_vendor, mashup_name, mashup_version) = values
            try:
                resource = CatalogueResource.objects.get(vendor=mashup_vendor, short_name=mashup_name, version=mashup_version)
                if not resource.is_available_for(request.user) or resource.resource_type() != 'mashup':
                    raise CatalogueResource.DoesNotExist
            except CatalogueResource.DoesNotExist:
                return build_error_response(request, 422, _('Mashup not found: %(mashup_id)s') % {'mashup_id': mashup_id})

            if resource.fromWGT:
                base_dir = catalogue.wgt_deployer.get_base_dir(mashup_vendor, mashup_name, mashup_version)
                wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))
                template = TemplateParser(wgt_file.get_template())
            else:
                template = downloader.download_http_content(resource.template_uri, user=request.user)
                try:
                    template = TemplateParser(template)
                except:
                    build_error_response(request, 424, _('Downloaded invalid resource description from: %(url)s') % {'url': resource.template_uri})

            try:
                check_mashup_dependencies(template, request.user)
            except MissingDependencies, e:
                details = {
                    'missingDependencies': e.missing_dependencies,
                }
                return build_error_response(request, 422, unicode(e), details=details)

            if dry_run:
                return HttpResponse(status_code=204)

            workspace, _junk = buildWorkspaceFromTemplate(template, request.user, True)

        workspace_data = get_global_workspace_data(workspace, request.user)

        return workspace_data.get_response(status_code=201, cacheable=False)


class WorkspaceEntry(Resource):

    @authentication_required
    def read(self, request, workspace_id):

        workspace = get_object_or_404(Workspace, users__id=request.user.id, pk=workspace_id)
        workspace_data = get_global_workspace_data(workspace, request.user)

        return workspace_data.get_response()

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id):

        try:
            ts = simplejson.loads(request.raw_post_data)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        workspace = Workspace.objects.get(users__id=request.user.id, pk=workspace_id)

        if 'active' in ts:
            if ts['active'] == 'true':
                #Only one active workspace
                setActiveWorkspace(request.user, workspace)
            else:
                currentUserWorkspace = UserWorkspace.objects.get(workspace=workspace, user=request.user)
                currentUserWorkspace.active = True
                currentUserWorkspace.save()

        if 'name' in ts:
            workspace.name = ts['name']

        workspace.save()

        return HttpResponse(status=204)

    @authentication_required
    @commit_on_http_success
    def delete(self, request, workspace_id):

        user_workspaces = UserWorkspace.objects.select_related('workspace')
        try:
            user_workspace = user_workspaces.get(user__id=request.user.id, workspace__id=workspace_id)
        except UserWorkspace.DoesNotExist:
            raise Http404

        workspace = user_workspace.workspace
        if workspace.creator != request.user or user_workspace.manager != '':
            return HttpResponseForbidden()

        # Check if the user does not have any other workspace
        workspaces = Workspace.objects.filter(users__id=request.user.id).exclude(pk=workspace_id)

        if workspaces.count() == 0:
            msg = _("workspace cannot be deleted")

            return build_error_response(request, 403, msg)

        # Remove the workspace
        PublishedWorkspace.objects.filter(workspace=workspace).update(workspace=None)
        iwidgets = IWidget.objects.filter(tab__workspace=workspace)
        for iwidget in iwidgets:
            deleteIWidget(iwidget, request.user)
        workspace.delete()

        from wirecloud.platform.get_data import _invalidate_cached_variable_values
        _invalidate_cached_variable_values(workspace)

        # Set a new active workspace (first workspace by default)
        activeWorkspace = workspaces[0]
        setActiveWorkspace(request.user, activeWorkspace)

        return HttpResponse(status=204)


class TabCollection(Resource):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id):

        try:
            data = simplejson.loads(request.raw_post_data)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        if 'name' not in data:
            return build_error_response(request, 400, _('Malformed tab JSON: expecting tab name.'))

        tab_name = data['name']
        workspace = Workspace.objects.get(users__id=request.user.id, pk=workspace_id)

        try:
            tab = createTab(tab_name, request.user, workspace)
        except IntegrityError:
            msg = _('A tab with the given name already exists for the workspace')
            return build_error_response(request, 409, msg)

        # Returning created Ids
        ids = {'id': tab.id, 'name': tab.name}

        return HttpResponse(simplejson.dumps(ids), status=201, mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id):

        user_workspaces = UserWorkspace.objects.select_related('workspace')
        try:
            user_workspace = user_workspaces.get(user__id=request.user.id, workspace__id=workspace_id)
        except UserWorkspace.DoesNotExist:
            raise Http404

        workspace = user_workspace.workspace
        if workspace.creator != request.user or user_workspace.manager != '':
            return HttpResponseForbidden()

        try:
            order = simplejson.loads(request.raw_post_data)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        tabs = Tab.objects.filter(id__in=order)

        for tab in tabs:
            tab.position = order.index(tab.id)
            tab.save()

        return HttpResponse(status=204)


class TabEntry(Resource):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id):

        tabs = Tab.objects.select_related('workspace')
        try:
            tab = tabs.get(workspace__users__id=request.user.id, workspace__pk=workspace_id, pk=tab_id)
        except Tab.DoesNotExist:
            raise Http404

        workspace = tab.workspace
        user_workspace = UserWorkspace.objects.get(user__id=request.user.id, workspace__id=workspace_id)
        if workspace.creator != request.user or user_workspace.manager != '':
            return HttpResponseForbidden()

        try:
            data = simplejson.loads(request.raw_post_data)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        if 'visible' in data:
            visible = data['visible']
            if (visible == 'true'):
                #Only one visible tab
                setVisibleTab(request.user, workspace_id, tab)
            else:
                tab.visible = False

        if 'name' in data:
            tab.name = data['name']

        tab.save()

        return HttpResponse(status=204)

    @authentication_required
    @commit_on_http_success
    def delete(self, request, workspace_id, tab_id):

        # Get tab, if it does not exist, an http 404 error is returned
        tab = get_object_or_404(Tab, workspace__pk=workspace_id, pk=tab_id)
        tabs = Tab.objects.filter(workspace__pk=workspace_id).order_by('position')[::1]

        if len(tabs) == 1:
            msg = _("tab cannot be deleted")
            return HttpResponseForbidden(msg)

        # decrease the position of the following tabs
        for t in range(tab.position + 1, len(tabs)):
            tabs[t].position = tabs[t].position - 1
            tabs[t].save()

        # Remove the tab
        tabs.remove(tab)
        deleteTab(tab, request.user)

        if tab.visible:
            # set a new visible tab (first tab by default)
            activeTab = tabs[0]
            setVisibleTab(request.user, workspace_id, activeTab)

        return HttpResponse(status=204)


class WorkspaceVariableCollection(Resource):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id):

        try:
            iwidgetVariables = simplejson.loads(request.raw_post_data)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        variables_to_notify = []
        for igVar in iwidgetVariables:
            variables_to_notify += set_variable_value(igVar['id'], request.user, igVar['value'])

        data = {'iwidgetVars': variables_to_notify}
        return HttpResponse(simplejson.dumps(data), mimetype='application/json; charset=UTF-8')


class WorkspaceSharerEntry(Resource):

    @authentication_required
    @commit_on_http_success
    def update(self, request, workspace_id, share_boolean):

        workspace = get_object_or_404(Workspace.objects.get(id=workspace_id))
        owner = workspace.creator

        if owner != request.user:
            msg = 'You are not the owner of the workspace, so you can not share it!'
            result = {'result': 'error', 'description': msg}
            return HttpResponseForbidden(simplejson.dumps(result), mimetype='application/json; charset=UTF-8')

        #Everything right!
        if request.raw_post_data == '':
            #Share with everybody
            #Linking with public user!
            public_user = None  # TODO

            linkWorkspaceObject(public_user, workspace, owner, link_variable_values=True)

            workspace_path = reverse('wirecloud.workspace_view', args=(workspace_id,))
            url = request.build_absolute_uri(workspace_path + '?' + urlencode({u'view': 'viewer'}))

            result = {"result": "ok", "url": url}
            return HttpResponse(simplejson.dumps(result), mimetype='application/json; charset=UTF-8')
        else:
            #Share only with the scpecified groups
            try:
                groups = simplejson.loads(request.raw_post_data)
            except Exception, e:
                msg = _("malformed json data: %s") % unicode(e)
                return build_error_response(request, 400, msg)

            queryGroups = Group.objects.filter(id__in=groups)
            for g in queryGroups:
                workspace.targetOrganizations.add(g)

            users = User.objects.filter(groups__in=groups).distinct()
            for user in users:
                #link the workspace with each user
                linkWorkspaceObject(user, workspace, owner, link_variable_values=True)

            return HttpResponse(status=204)


class WorkspaceLinkerEntry(Resource):

    @authentication_required
    @commit_on_http_success
    @no_cache
    def read(self, request, workspace_id):

        linkWorkspace(request.user, workspace_id)

        return HttpResponse(status=204)


class MashupMergeService(Service):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def process(self, request, to_ws_id):

        try:
            data = simplejson.loads(request.raw_post_data)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        template_url = data['workspace']

        to_ws = get_object_or_404(Workspace, id=to_ws_id)
        if not request.user.is_superuser and to_ws.creator != request.user:
            return HttpResponseForbidden()

        path = request.build_absolute_uri()
        login_scheme, login_netloc = urlparse.urlparse(template_url)[:2]
        current_scheme, current_netloc = urlparse.urlparse(path)[:2]
        if ((not login_scheme or login_scheme == current_scheme) and
            (not login_netloc or login_netloc == current_netloc)):
            pworkspace_id = template_url.split('/')[-2]
            template = PublishedWorkspace.objects.get(id=pworkspace_id).template
        else:
            template = downloader.download_http_content(template_url, user=request.user)

        fillWorkspaceUsingTemplate(to_ws, template)

        result = {'result': 'ok', 'workspace_id': to_ws_id}
        return HttpResponse(simplejson.dumps(result), mimetype='application/json; charset=UTF-8')


def check_json_fields(json, fields):
    missing_fields = []

    for field in fields:
        if not field in json:
            missing_fields.append(field)

    return missing_fields


class WorkspacePublisherEntry(Resource):

    @authentication_required
    @supported_request_mime_types(('application/json', 'multipart/form-data'))
    @commit_on_http_success
    def create(self, request, workspace_id):

        content_type = get_content_type(request)[0]
        image_file = None
        if content_type == 'application/json':
            received_json = request.raw_post_data
        else:
            received_json = request.POST['json']
            image_file = request.FILES.get('image', None)

        try:
            options = simplejson.loads(received_json)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        missing_fields = check_json_fields(options, ('name', 'vendor', 'version', 'email'))
        if len(missing_fields) > 0:
            return build_error_response(request, 400, _('Malformed JSON. The following field(s) are missing: %(fields)s.') % {'fields': missing_fields})

        if not is_valid_vendor(options['vendor']):
            return build_error_response(request, 400, _('Invalid vendor'))

        if not is_valid_name(options['name']):
            return build_error_response(request, 400, _('Invalid name'))

        if not is_valid_version(options['version']):
            return build_error_response(request, 400, _('Invalid version number'))

        workspace = get_object_or_404(Workspace, id=workspace_id)
        if image_file is not None:
            image_filename = 'images/catalogue' + os.path.splitext(image_file.name)[1]
            options['imageURI'] = image_filename
        description = build_rdf_template_from_workspace(options, workspace, request.user)

        f = StringIO()
        zf = zipfile.ZipFile(f, 'w')
        zf.writestr('config.xml', bytes(description.serialize(format='pretty-xml')))
        if image_file is not None:
            zf.writestr(image_filename, image_file.read())
        zf.close()
        wgt_file = WgtFile(f)

        market_managers = get_market_managers(request.user)
        try:
            market_managers['local'].publish(None, wgt_file, request.user, options, request)
        except Exception, e:
            return build_error_response(request, 502, unicode(e))

        return HttpResponse(status=201)


class WorkspaceExportService(Service):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    def process(self, request, workspace_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        if not request.user.is_superuser and workspace.creator != request.user:
            return HttpResponseForbidden()

        try:
            mashup = simplejson.loads(request.raw_post_data)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        missing_fields = check_json_fields(mashup, ['name', 'vendor', 'version', 'email'])
        if len(missing_fields) > 0:
            raise build_error_response(request, 400, _('Malformed mashup JSON. The following field(s) are missing: %(fields)s.') % {'fields': missing_fields})

        template = build_template_from_workspace(mashup, workspace, request.user)
        return HttpResponse(template, mimetype='application/xml; charset=UTF-8')


class MashupTemplate(Resource):

    def read(self, request, workspace_id):
        published_workspace = get_object_or_404(PublishedWorkspace, id=workspace_id)
        return HttpResponse(published_workspace.template, mimetype='application/xml; charset=UTF-8')
