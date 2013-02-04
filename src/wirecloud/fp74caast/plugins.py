from django.utils.translation import ugettext_lazy as _

from wirecloud.platform.plugins import WirecloudPlugin


class FP74CaastPlugin(WirecloudPlugin):

    def get_workspace_context_definitions(self):
        return {
            'user_4CaaSt_id': {
                'label': _('4Caast Id of the user'),
            },
        }

    def get_workspace_context_current_values(self, user_workspace):

        try:
            id_4CaaSt = user_workspace.profile4caast.id_4CaaSt
        except:
            id_4CaaSt = None

        return {
            'user_4CaaSt_id': id_4CaaSt,
        }
