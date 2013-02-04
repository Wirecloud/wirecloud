from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from commons.resource import Resource
from wirecloud.workspace.packageLinker import PackageLinker
from wirecloud.workspace.views import setActiveWorkspace
from wirecloud.models import Workspace, UserWorkspace
from wirecloud.fp74caast.models import Profile4CaaSt


def parse_username(tenant_id):

    return tenant_id.split('.', 4)[3]


class TenantCollection(Resource):

    def read(self, request, creator_user, workspace):

        workspace = get_object_or_404(Workspace, creator__username=creator_user, name=workspace)

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
            creator = User.objects.get(username=creator_user)
            packageLinker = PackageLinker()
            user_workspace = packageLinker.link_workspace(workspace, user, creator)

        setActiveWorkspace(user, user_workspace.workspace)

        try:
            user_workspace.profile4caast.id_4CaaSt = id_4CaaSt
            user_workspace.profile4caast.save()
        except:
            Profile4CaaSt.objects.create(user_workspace=user_workspace, id_4CaaSt=id_4CaaSt)

        return HttpResponse(status=status)
