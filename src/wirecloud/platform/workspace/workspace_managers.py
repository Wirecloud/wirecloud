from wirecloud.platform.models import GroupPublishedWorkspace, PublishedWorkspace, Workspace


def ref_from_workspace(workspace):

    if isinstance(workspace, Workspace):
        return 'group/' + str(workspace.id)
    elif isinstance(workspace, PublishedWorkspace):
        return 'group_published/' + str(workspace.id)


class OrganizationWorkspaceManager:

    def get_id(self):
        return 'wirecloud_organizations'

    def update_base_workspaces(self, user, current_workspace_refs):

        workspaces_to_remove = current_workspace_refs[:]
        workspaces_to_add = []

        user_groups = user.groups.all()

        # workspaces assigned to the user's groups
        # the compression list outside the inside compression list is for flattening
        # the inside list
        workspaces = [workspace for sublist in
                      [Workspace.objects.filter(targetOrganizations=org)
                       for org in user_groups]
                      for workspace in sublist]

        # published workspaces assigned to the user's groups
        # the compression list outside the inside compression list is for flattening
        # the inside list
        workspaces += [relation.workspace for sublist in
                       [GroupPublishedWorkspace.objects.filter(group=group)
                        for group in user_groups]
                      for relation in sublist]

        workspaces = set(workspaces)

        for workspace in workspaces:
            if workspace.creator == user:
                # Ignore workspaces created by the user
                continue

            ref = ref_from_workspace(workspace)
            if ref not in current_workspace_refs:
                workspaces_to_add.append((ref, workspace))
            else:
                workspaces_to_remove.remove(ref)

        return (workspaces_to_remove, workspaces_to_add)
