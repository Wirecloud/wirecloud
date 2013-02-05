from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from wirecloud.commons.baseviews.resource import Resource
from wirecloud.platform.workspace.packageLinker import PackageLinker
from wirecloud.platform.workspace.utils import get_workspace_list
from wirecloud.platform.workspace.views import setActiveWorkspace
from wirecloud.platform.models import Workspace, UserWorkspace

from wirecloud.fp74caast.models import Profile4CaaSt


def parse_username(tenant_id):

    return tenant_id.split('.', 4)[3]


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
