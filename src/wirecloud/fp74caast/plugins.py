from django.utils.translation import ugettext_lazy as _

from wirecloud.platform.plugins import WirecloudPlugin

from wirecloud.fp74caast.urls import urlpatterns


class FP74CaaStPlugin(WirecloudPlugin):

    def get_urls(self):
        return urlpatterns

    def get_platform_context_definitions(self):
        return {
            'tenant_4CaaSt_id': {
                'label': _('Tenant Id (4CaaSt)'),
            }
        }

    def get_platform_context_current_values(self, user):
        try:
            id_4CaaSt = user.tenantprofile_4CaaSt.id_4CaaSt
        except:
            id_4CaaSt = ""

        return {
            'tenant_4CaaSt_id': id_4CaaSt
        }

    def get_workspace_context_definitions(self):

        return {
            'SaaS_tenant_4CaaSt_id': {
                'label': _('SaaS tenant Id (4CaaSt)'),
            }
        }

    def get_workspace_context_current_values(self, user_workspace):

        try:
            id_4CaaSt = user_workspace.profile4caast.id_4CaaSt
        except:
            id_4CaaSt = ""

        return {
            'SaaS_tenant_4CaaSt_id': id_4CaaSt,
        }
