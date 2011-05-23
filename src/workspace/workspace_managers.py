from workspace.models import WorkSpace


def ref_from_workspace(workspace):
    return 'group/' + str(workspace.id)


class OrganizationWorkspaceManager:

    def get_id():
        return 'ezweb_organizations'

    def update_base_workspaces(self, user, current_workspace_refs):

        workspaces_to_remove = current_workspace_refs[:]
        workspaces_to_add = []

        # workspaces assigned to the user's groups
        # the compression list outside the inside compression list is for flatten
        # the inside list
        workspaces = [workspace for sublist in
                      [WorkSpace.objects.filter(targetOrganizations=org)
                       for org in user.groups.all()]
                      for workspace in sublist]

        for workspace in workspaces:
            ref = ref_from_workspace(workspace)
            if ref not in current_workspace_refs:
                workspaces_to_add.append((ref, workspace))
            else:
                workspaces_to_remove.remove(ref)

        return (workspaces_to_remove, workspaces_to_add)
