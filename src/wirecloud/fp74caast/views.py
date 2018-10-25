# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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
import zipfile

from django.contrib.auth.models import User
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_GET, require_POST

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.downloader import download_http_content
from wirecloud.commons.utils.http import build_error_response, get_content_type, parse_json_request
from wirecloud.commons.utils.template import TemplateParser, TemplateParseException
from wirecloud.commons.utils.template.writers.rdf import write_rdf_description
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.localcatalogue.utils import install_resource_to_user
from wirecloud.platform.workspace.mashupTemplateParser import buildWorkspaceFromTemplate
from wirecloud.platform.workspace.packageLinker import PackageLinker
from wirecloud.platform.workspace.utils import get_workspace_list
from wirecloud.platform.workspace.views import setActiveWorkspace
from wirecloud.platform.models import Workspace, UserWorkspace
from wirecloud.fp74caast.models import Profile4CaaSt, TenantProfile


def parse_username(tenant_id):

    id_fields = tenant_id.split('.')
    if id_fields[0] == 'org':
        return id_fields[3]
    else:
        return id_fields[2]


@require_POST
@commit_on_http_success
def add_tenant(request):

    data = parse_json_request(request)

    id_4CaaSt = data['4CaaStID']

    if id_4CaaSt is None:
        return build_error_response(request, 400, _('Missing 4CaaStID'))

    if not isinstance(id_4CaaSt, str) or id_4CaaSt.strip() == '':
        return build_error_response(request, 400, _('Invalid 4CaaStID'))

    username = parse_username(id_4CaaSt)

    status = 201
    try:
        user = User.objects.create_user(username, 'test@example.com', username)
    except:
        status = 209
        user = User.objects.get(username=username)
        try:
            if user.tenantprofile_4CaaSt.id_4CaaSt != id_4CaaSt:
                msg = "A user with the same name and with different tenant id already exists."
                return build_error_response(request, 400, msg)
            else:
                return HttpResponse(status)
        except TenantProfile.DoesNotExist:
            pass

    TenantProfile.objects.create(user=user, id_4CaaSt=id_4CaaSt)

    return HttpResponse(status)


@require_POST
@commit_on_http_success
def remove_tenant(request):

    data = parse_json_request(request)

    id_4CaaSt = data.get('4CaaStID')

    if id_4CaaSt is None:
        return build_error_response(request, 400, _('Missing 4CaaStID'))

    if not isinstance(id_4CaaSt, str) or id_4CaaSt.strip() == '':
        return build_error_response(request, 400, _('Invalid 4CaaStID'))

    username = parse_username(id_4CaaSt)

    user = get_object_or_404(User, username=username)
    try:
        if user.tenantprofile_4CaaSt.id_4CaaSt != id_4CaaSt:
            raise Http404
    except TenantProfile.DoesNotExist:
        raise Http404

    user.delete()

    return HttpResponse(status=204)


def _parse_ac_request(request):

    fileURL = None
    file_contents = None
    content_type = get_content_type(request)[0]

    data = parse_json_request(request)

    if 'url' not in data:
        return build_error_response(request, 400, _('Missing widget URL'))

    fileURL = data.get('url')
    id_4CaaSt = data.get('4CaaStID')

    if id_4CaaSt is None:
        return build_error_response(request, 400, _('Missing 4CaaStID'))

    if not isinstance(id_4CaaSt, str) or id_4CaaSt.strip() == '':
        return build_error_response(request, 400, _('Invalid 4CaaStID'))

    try:
        downloaded_file = download_http_content(fileURL)
    except:
        return build_error_response(request, 409, _('Mashable application component could not be downloaded'))

    downloaded_file = StringIO(downloaded_file)
    file_contents = WgtFile(downloaded_file)

    # Create a custom version of the resource
    template = TemplateParser(file_contents.get_template())
    template_info = template.get_resource_info()
    template_info['name'] += '@' + id_4CaaSt

    for pref_name, pref_value in data.get('preferences', {}).items():
        for widget_pref_index, widget_pref in enumerate(template_info['preferences']):
            if widget_pref['name'] == pref_name:
                template_info['preferences'][widget_pref_index]['readonly'] = True
                template_info['preferences'][widget_pref_index]['value'] = pref_value
                break

    # Write a new Wgt file
    new_file = StringIO()
    zin = zipfile.ZipFile(downloaded_file, 'r')
    zout = zipfile.ZipFile(new_file, 'w')
    zout.writestr('config.xml', write_rdf_description(template_info))
    for item in zin.infolist():
        if item.filename == 'config.xml':
            continue
        zout.writestr(item, zin.read(item.filename))
    zin.close()
    zout.close()

    file_contents = WgtFile(new_file)

    return id_4CaaSt, file_contents, fileURL


@require_POST
@commit_on_http_success
def deploy_tenant_ac(request):

    result = _parse_ac_request(request)
    if isinstance(result, HttpResponse):
        return result

    id_4CaaSt, wgt_file, fileURL = result

    # Process 4CaaSt Id
    username = parse_username(id_4CaaSt)

    user = get_object_or_404(User, username=username)

    # Install uploaded MAC resource
    try:

        resource = install_resource_to_user(user, file_contents=wgt_file)

    except TemplateParseException as e:

        return build_error_response(request, 400, e.msg)

    # Create a workspace if the resource is a mashup
    if resource.resource_type() == 'mashup' and not Workspace.objects.filter(creator=user, name=resource.short_name).exists():
        buildWorkspaceFromTemplate(resource.get_template(), user, True)

    return HttpResponse(status=204)


@require_POST
@commit_on_http_success
def undeploy_tenant_ac(request):

    result = _parse_ac_request(request)
    if isinstance(result, HttpResponse):
        return result

    id_4CaaSt, wgt_file, fileURL = result

    # Process 4CaaSt Id
    username = parse_username(id_4CaaSt)

    user = get_object_or_404(User, username=username)
    try:
        if user.tenantprofile_4CaaSt.id_4CaaSt != id_4CaaSt:
            raise Http404
    except TenantProfile.DoesNotExist:
        raise Http404

    # If the resource is a mashup, remove the assigned workspace
    template = TemplateParser(wgt_file.get_template())
    if template.get_resource_type() == 'mashup':
        Workspace.objects.filter(creator=user, name=template.get_resource_info()['title']).delete()

    # Uninstall de resource
    template = TemplateParser(wgt_file.get_template())
    resource = CatalogueResource.objects.get(vendor=template.get_resource_vendor(), short_name=template.get_resource_name(), version=template.get_resource_version())
    resource.users.remove(user)

    return HttpResponse(status=204)


@require_GET
@commit_on_http_success
def add_saas_tenant(request, creator, workspace):

    # Sync workspace list before searching it
    creator_user = get_object_or_404(User, username=creator)
    get_workspace_list(creator_user)

    workspace = get_object_or_404(Workspace, creator=creator_user, name=workspace)

    status = 201

    id_4CaaSt = request.GET.get('message')

    if id_4CaaSt is None:
        return build_error_response(request, 400, _('Missing 4CaaStID'))

    if not isinstance(id_4CaaSt, str) or id_4CaaSt.strip() == '':
        return build_error_response(request, 400, _('Invalid 4CaaStID'))

    username = parse_username(id_4CaaSt)
    try:
        user = User.objects.create_user(username, 'test@example.com', username)
    except:
        user = User.objects.get(username=username)

    try:
        user_workspace = UserWorkspace.objects.get(user=user, workspace=workspace)
    except:
        packageLinker = PackageLinker()
        user_workspace = packageLinker.link_workspace(workspace, user, creator_user)

    setActiveWorkspace(user, user_workspace.workspace)

    try:
        user_workspace.profile4caast.id_4CaaSt = id_4CaaSt
        user_workspace.profile4caast.save()
    except:
        Profile4CaaSt.objects.create(user_workspace=user_workspace, id_4CaaSt=id_4CaaSt)

    return HttpResponse(status=status)


@require_GET
@commit_on_http_success
def remove_saas_tenant(request, creator, workspace):

    id_4CaaSt = request.GET.get('message')

    if id_4CaaSt is None:
        return build_error_response(request, 400, _('Missing 4CaaStID'))

    if not isinstance(id_4CaaSt, str) or id_4CaaSt.strip() == '':
        return build_error_response(request, 400, _('Invalid 4CaaStID'))

    username = parse_username(id_4CaaSt)

    db_filter = {
        'user_workspace__user__username': username,
        'user_workspace__workspace__creator__username': creator,
        'user_workspace__workspace__name': workspace,
        'id_4CaaSt': id_4CaaSt,
    }
    profile = get_object_or_404(Profile4CaaSt, **db_filter)
    profile.user_workspace.delete()
    profile.delete()

    return HttpResponse(status=204)
