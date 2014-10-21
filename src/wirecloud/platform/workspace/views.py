# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

from io import BytesIO
import json
import os
import zipfile

from django.db import IntegrityError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _
from six import string_types

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource, Service
from wirecloud.commons.utils.cache import no_cache
from wirecloud.commons.utils.db import save_alternative
from wirecloud.commons.utils.downloader import download_http_content
from wirecloud.commons.utils.http import authentication_required, authentication_required_cond, build_error_response, get_content_type, normalize_boolean_param, supported_request_mime_types, supported_response_mime_types
from wirecloud.commons.utils.template import is_valid_name, is_valid_vendor, is_valid_version, TemplateParser
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.models import IWidget, Tab, UserWorkspace, Workspace
from wirecloud.platform.settings import ALLOW_ANONYMOUS_ACCESS
from wirecloud.platform.workspace.mashupTemplateGenerator import build_json_template_from_workspace, build_rdf_template_from_workspace
from wirecloud.platform.workspace.mashupTemplateParser import check_mashup_dependencies, buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate, MissingDependencies
from wirecloud.platform.workspace.utils import deleteTab, createTab, get_workspace_list, get_workspace_data, get_global_workspace_data, setVisibleTab
from wirecloud.platform.markets.utils import get_local_catalogue


def createEmptyWorkspace(workspaceName, user, allow_renaming=False):
    active = False
    workspaces = UserWorkspace.objects.filter(user__id=user.id, active=True)
    if workspaces.count() == 0:
        # there isn't yet an active workspace
        active = True

    empty_wiring = '{"operators": {}, "connections": []}'

    workspace = Workspace(name=workspaceName, creator=user, wiringStatus=empty_wiring)
    if allow_renaming is True:
        save_alternative(Workspace, 'name', workspace)
    else:
        workspace.save()
    UserWorkspace.objects.create(user=user, workspace=workspace, active=active)

    # Tab creation
    createTab(_('Tab'), workspace)

    return workspace


def setActiveWorkspace(user, workspace):

    UserWorkspace.objects.filter(user=user, active=True).exclude(workspace=workspace).update(active=False)
    UserWorkspace.objects.filter(user=user, workspace=workspace).update(active=True)


class WorkspaceCollection(Resource):

    @supported_response_mime_types(('application/json',))
    @commit_on_http_success
    @no_cache
    def read(self, request):

        workspaces, _junk = get_workspace_list(request.user)
        data_list = [get_workspace_data(workspace, request.user) for workspace in workspaces]

        return HttpResponse(json.dumps(data_list), content_type='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @supported_response_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request):

        try:
            data = json.loads(request.body)
        except ValueError as e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        workspace_name = data.get('name', '').strip()
        workspace_id = data.get('workspace', '')
        mashup_id = data.get('mashup', '')
        try:
            allow_renaming = normalize_boolean_param('allow_renaming', data.get('allow_renaming', False))
            dry_run = normalize_boolean_param('allow_renaming', data.get('dry_run', False))
        except (TypeError, ValueError) as e:
            return build_error_response(request, 422, unicode(e))

        if mashup_id == '' and workspace_id == '' and workspace_name == '':
            return build_error_response(request, 422, _('Missing name parameter'))
        elif  mashup_id != '' and workspace_id != '':
            return build_error_response(request, 422, _('Workspace and mashup parameters cannot be used at the same time'))

        if mashup_id == '' and workspace_id == '':

            if not is_valid_name(workspace_name):
                return build_error_response(request, 422, _('invalid workspace name'))

            if dry_run:
                return HttpResponse(status=204)

            try:
                workspace = createEmptyWorkspace(workspace_name, request.user, allow_renaming=allow_renaming)
            except IntegrityError:
                msg = _('A workspace with the given name already exists')
                return build_error_response(request, 409, msg)
        else:

            if mashup_id != '':
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

                base_dir = catalogue.wgt_deployer.get_base_dir(mashup_vendor, mashup_name, mashup_version)
                wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))
                template = TemplateParser(wgt_file.get_template())

            else:

                from_ws = get_object_or_404(Workspace, id=workspace_id)
                if from_ws.public is False and not request.user.is_superuser and from_ws.creator != request.user:
                    return build_error_response(request, 403, _('You are not allowed to read from workspace %s') % workspace_id)

                options = {
                    'vendor': 'api',
                    'name': from_ws.name,
                    'version': '1.0',
                    'title': '',
                    'description': 'Temporal mashup for the workspace copy operation',
                    'email': 'a@example.com',
                }

                template = TemplateParser(build_json_template_from_workspace(options, from_ws, from_ws.creator))

            try:
                check_mashup_dependencies(template, request.user)
            except MissingDependencies as e:
                details = {
                    'missingDependencies': e.missing_dependencies,
                }
                return build_error_response(request, 422, unicode(e), details=details)

            if dry_run:
                return HttpResponse(status=204)

            if workspace_name == '':
                workspace_name = None

            try:
                workspace, _junk = buildWorkspaceFromTemplate(template, request.user, allow_renaming=allow_renaming, new_name=workspace_name)
            except IntegrityError:
                msg = _('A workspace with the given name already exists')
                return build_error_response(request, 409, msg)

        workspace_data = get_global_workspace_data(workspace, request.user)

        return workspace_data.get_response(status_code=201, cacheable=False)


class WorkspaceEntry(Resource):

    @authentication_required_cond(ALLOW_ANONYMOUS_ACCESS)
    @supported_response_mime_types(('application/json',))
    def read(self, request, workspace_id):

        workspace = get_object_or_404(Workspace, pk=workspace_id)

        if not workspace.public and not (request.user.is_authenticated() and workspace.users.filter(pk=request.user.pk).exists()):
            return build_error_response(request, 403, _("You don't have permission to access this workspace"))

        workspace_data = get_global_workspace_data(workspace, request.user)

        return workspace_data.get_response()

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id):

        try:
            ts = json.loads(request.body)
        except ValueError as e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        workspace = Workspace.objects.get(pk=workspace_id)
        if not (request.user.is_superuser or workspace.users.filter(pk=request.user.pk).exists()):
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        if 'active' in ts:

            active = ts.get('active', False)
            if isinstance(active, string_types):
                active = ts['active'].lower() == 'true'

            if active:
                # Only one active workspace
                setActiveWorkspace(request.user, workspace)
            else:
                currentUserWorkspace = UserWorkspace.objects.get(workspace=workspace, user=request.user)
                currentUserWorkspace.active = False
                currentUserWorkspace.save()

        if 'name' in ts:
            workspace.name = ts['name']

        workspace.save()

        return HttpResponse(status=204)

    @authentication_required
    @commit_on_http_success
    def delete(self, request, workspace_id):

        workspace = get_object_or_404(Workspace, pk=workspace_id)
        if not workspace.users.filter(pk=request.user.pk).exists():
            return build_error_response(request, 403, _('You are not allowed to delete this workspace'))

        UserWorkspace.objects.filter(user=request.user, workspace=workspace).delete()
        if workspace.users.count() == 0:

            # Remove the workspace
            iwidgets = IWidget.objects.filter(tab__workspace=workspace)
            for iwidget in iwidgets:
                iwidget.delete()
            workspace.delete()

        return HttpResponse(status=204)


class TabCollection(Resource):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @supported_response_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id):

        try:
            data = json.loads(request.body)
        except ValueError as e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        if 'name' not in data:
            return build_error_response(request, 400, _('Malformed tab JSON: expecting tab name.'))

        tab_name = data['name']
        workspace = Workspace.objects.get(pk=workspace_id)
        if not (request.user.is_superuser or workspace.creator == request.user):
            return build_error_response(request, 403, _('You are not allowed to create new tabs for this workspace'))

        try:
            tab = createTab(tab_name, workspace)
        except IntegrityError:
            msg = _('A tab with the given name already exists for the workspace')
            return build_error_response(request, 409, msg)

        # Returning created Ids
        ids = {'id': tab.id, 'name': tab.name}

        return HttpResponse(json.dumps(ids), status=201, content_type='application/json; charset=UTF-8')


class TabOrderService(Service):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def process(self, request, workspace_id):

        workspace = Workspace.objects.get(pk=workspace_id)
        if not (request.user.is_superuser or workspace.creator == request.user):
            return build_error_response(request, 403, _('You are not allowed to create new tabs for this workspace'))

        try:
            order = json.loads(request.body)
        except ValueError as e:
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

        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if tab.workspace.creator != request.user:
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        user_workspace = UserWorkspace.objects.get(user__id=request.user.id, workspace__id=workspace_id)
        if user_workspace.manager != '':
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        try:
            data = json.loads(request.body)
        except ValueError as e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        if 'visible' in data:
            visible = data['visible']
            if isinstance(visible, string_types):
                visible = visible.strip().lower()
                if visible not in ('true', 'false'):
                    return build_error_response(request, 422, _('Invalid visible value'))
                visible = visible == 'true'
            elif not isinstance(visible, bool):
                return build_error_response(request, 422, _('Invalid visible value'))

            if visible:
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
        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not request.user.is_superuser and not tab.workspace.users.filter(id=request.user.id).exists():
            return build_error_response(request, 403, _('You are not allowed to remove this tab'))

        tabs = Tab.objects.filter(workspace__pk=workspace_id).order_by('position')[::1]
        if len(tabs) == 1:
            msg = _("Tab cannot be deleted as workspaces need at least one tab")
            return build_error_response(request, 403, msg)

        if tab.iwidget_set.filter(readOnly=True).exists():
            msg = _("Tab cannot be deleted as it contains widgets that cannot be deleted")
            return build_error_response(request, 403, msg)

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


class MashupMergeService(Service):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def process(self, request, to_ws_id):

        try:
            data = json.loads(request.body)
        except ValueError as e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        mashup_id = data.get('mashup', '')
        workspace_id = data.get('workspace', '')

        if mashup_id == '' and workspace_id == '':
            return build_error_response(request, 422, _('Missing workspace or mashup parameter'))
        elif  mashup_id != '' and workspace_id != '':
            return build_error_response(request, 422, _('Workspace and mashup parameters cannot be used at the same time'))

        to_ws = get_object_or_404(Workspace, id=to_ws_id)
        if not request.user.is_superuser and to_ws.creator != request.user:
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        if mashup_id != '':
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

            base_dir = catalogue.wgt_deployer.get_base_dir(mashup_vendor, mashup_name, mashup_version)
            wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))
            template = TemplateParser(wgt_file.get_template())

        else:

            from_ws = get_object_or_404(Workspace, id=workspace_id)
            if not request.user.is_superuser and from_ws.creator != request.user:
                return build_error_response(request, 403, _('You are not allowed to read from workspace %s') % workspace_id)

            options = {
                'vendor': 'api',
                'name': 'merge_op',
                'version': '1.0',
                'title': '',
                'description': 'Temporal mashup for merging operation',
                'email': 'a@example.com',
            }

            template = TemplateParser(build_json_template_from_workspace(options, from_ws, from_ws.creator))

        try:
            check_mashup_dependencies(template, request.user)
        except MissingDependencies as e:
            details = {
                'missingDependencies': e.missing_dependencies,
            }
            return build_error_response(request, 422, unicode(e), details=details)

        fillWorkspaceUsingTemplate(to_ws, template)
        return HttpResponse(status=204)


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

        import wirecloud.catalogue.utils as catalogue_utils

        content_type = get_content_type(request)[0]
        image_file = None
        smartphoneimage_file = None
        if content_type == 'application/json':
            received_json = request.body
        else:
            received_json = request.POST['json']
            image_file = request.FILES.get('image', None)
            smartphoneimage_file = request.FILES.get('smartphoneimage', None)

        try:
            options = json.loads(received_json)
        except ValueError as e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        missing_fields = check_json_fields(options, ('name', 'vendor', 'version'))
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
            options['image'] = image_filename
        if smartphoneimage_file is not None:
            smartphoneimage_filename = 'images/smartphone' + os.path.splitext(smartphoneimage_file.name)[1]
            options['smartphoneimage'] = smartphoneimage_filename

        description = build_rdf_template_from_workspace(options, workspace, request.user)

        # Build mashup wgt file
        f = BytesIO()
        zf = zipfile.ZipFile(f, 'w')
        zf.writestr('config.xml', bytes(description.serialize(format='pretty-xml')))
        if image_file is not None:
            zf.writestr(image_filename, image_file.read())
        if smartphoneimage_file is not None:
            zf.writestr(smartphoneimage_filename, smartphoneimage_file.read())
        for resource_info in options['embedded']:
            (vendor, name, version) = (resource_info['vendor'], resource_info['name'], resource_info['version'])
            resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
            base_dir = catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version)
            zf.write(os.path.join(base_dir, resource.template_uri), resource_info['src'])
        zf.close()
        wgt_file = WgtFile(f)

        resource = get_local_catalogue().publish(None, wgt_file, request.user, options, request)

        return HttpResponse(json.dumps(resource.get_processed_info(request), ensure_ascii=False), status=201, content_type='application/json; charset=utf-8')
