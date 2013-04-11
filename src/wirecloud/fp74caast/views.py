from cStringIO import StringIO

from django.contrib.auth.models import User
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_GET, require_POST

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews.resource import Resource
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.http import build_error_response, get_content_type
from wirecloud.commons.utils.template import TemplateParser, TemplateParseException
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.localcatalogue.utils import install_resource_to_user
from wirecloud.platform.workspace.packageLinker import PackageLinker
from wirecloud.platform.workspace.utils import get_workspace_list
from wirecloud.platform.workspace.views import setActiveWorkspace
from wirecloud.platform.models import Workspace, UserWorkspace

from wirecloud.fp74caast.models import Profile4CaaSt, TenantProfile


def parse_username(tenant_id):

    return tenant_id.split('.', 4)[3]


@require_GET
def add_tenant(request):

    id_4CaaSt = request.GET['message']
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


@require_GET
def remove_tenant(request):

    id_4CaaSt = request.GET['message']
    username = parse_username(id_4CaaSt)

    user = get_object_or_404(User, username=username)
    try:
        if user.tenantprofile_4CaaSt.id_4CaaSt != id_4CaaSt:
            raise Http404
    except TenantProfile.DoesNotExist:
        raise Http404

    user.delete()

    return HttpResponse(status=204)

@require_POST
def deploy_tenant_ac(request):

    id_4CaaSt = request.GET.get('message', None)
    fileURL = None
    file_contents = None
    content_type = get_content_type(request)[0]

    if content_type == 'multipart/form-data':

        if not 'file' in request.FILES:
            return build_error_response(request, 400, _('Missing widget file'))

        downloaded_file = request.FILES['file']
        file_contents = WgtFile(downloaded_file)

    elif content_type == 'application/octet-stream':

        downloaded_file = StringIO(request.raw_post_content)
        file_contents = WgtFile(downloaded_file)

    else:

        if content_type == 'application/json':

            try:
                data = simplejson.loads(request.raw_post_data)
            except Exception, e:
                msg = _("malformed json data: %s") % unicode(e)
                return build_error_response(request, 400, msg)

            if 'url' not in data:
                return build_error_response(request, 400, _('Missing widget URL'))

            fileURL = data.get('url')
            if 'id_4caast' in data:
                id_4CaaSt = data.get('id_4caast')

        elif content_type == 'application/x-www-form-urlencoded':

            if 'url' not in request.POST:
                return build_error_response(request, 400, _('Missing widget URL'))

            fileURL = request.POST['url']

        try:
            downloaded_file = downloader.download_http_content(fileURL)
        except:
            return build_error_response(request, 409, _('Widget content could not be downloaded'))

        downloaded_file = StringIO(downloaded_file)
        file_contents = WgtFile(downloaded_file)

    # Process 4CaaSt Id
    username = parse_username(id_4CaaSt)

    user = get_object_or_404(User, username=username)
    try:
        if user.tenantprofile_4CaaSt.id_4CaaSt != id_4CaaSt:
            raise Http404
    except TenantProfile.DoesNotExist:
        raise Http404

    # Install uploaded MAC resource
    try:

        install_resource_to_user(user, file_contents=file_contents, templateURL=fileURL, packaged=True)

    except TemplateParseException, e:

        return build_error_response(request, 400, unicode(e.msg))

    return HttpResponse(status=204)


@require_POST
def undeploy_tenant_ac(request):

    id_4CaaSt = request.GET.get('message', None)
    fileURL = None
    file_contents = None
    content_type = get_content_type(request)[0]

    if content_type == 'multipart/form-data':

        if not 'file' in request.FILES:
            return build_error_response(request, 400, _('Missing widget file'))

        downloaded_file = request.FILES['file']
        file_contents = WgtFile(downloaded_file)

    elif content_type == 'application/octet-stream':

        downloaded_file = StringIO(request.raw_post_content)
        file_contents = WgtFile(downloaded_file)

    else:

        if content_type == 'application/json':

            try:
                data = simplejson.loads(request.raw_post_data)
            except Exception, e:
                msg = _("malformed json data: %s") % unicode(e)
                return build_error_response(request, 400, msg)

            if 'url' not in data:
                return build_error_response(request, 400, _('Missing widget URL'))

            fileURL = data.get('url')
            if 'id_4caast' in data:
                id_4CaaSt = data.get('id_4caast')

        elif content_type == 'application/x-www-form-urlencoded':

            if 'url' not in request.POST:
                return build_error_response(request, 400, _('Missing widget URL'))

            fileURL = request.POST['url']

        try:
            downloaded_file = downloader.download_http_content(fileURL)
        except:
            return build_error_response(request, 409, _('Widget content could not be downloaded'))

        downloaded_file = StringIO(downloaded_file)
        file_contents = WgtFile(downloaded_file)

    # Process 4CaaSt Id
    username = parse_username(id_4CaaSt)

    user = get_object_or_404(User, username=username)
    try:
        if user.tenantprofile_4CaaSt.id_4CaaSt != id_4CaaSt:
            raise Http404
    except TenantProfile.DoesNotExist:
        raise Http404

    # Install uploaded MAC resource
    if isinstance(file_contents, basestring):
        file_contents = StringIO(file_contents)
        wgt_file = WgtFile(file_contents)
    elif isinstance(file_contents, WgtFile):
        wgt_file = file_contents
    else:
        raise Exception

    template = TemplateParser(wgt_file.get_template())
    resource = CatalogueResource.objects.get(vendor=template.get_resource_vendor(), short_name=template.get_resource_name(), version=template.get_resource_version())
    resource.users.remove(user)

    return HttpResponse(status=204)


class TenantCollection(Resource):

    def read(self, request, creator, workspace):

        # Sync workspace list before searching it
        creator_user = get_object_or_404(User, username=creator)
        get_workspace_list(creator_user)

        workspace = get_object_or_404(Workspace, creator=creator_user, name=workspace)

        status = 201

        id_4CaaSt = request.GET['message']
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
def remove_saas_tenant(request, creator, workspace):

    id_4CaaSt = request.GET['message']
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
