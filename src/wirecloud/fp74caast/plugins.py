from django.utils.translation import ugettext_lazy as _

from wirecloud.platform.plugins import WirecloudPlugin

from wirecloud.fp74caast.urls import urlpatterns


class FP74CaaStPlugin(WirecloudPlugin):

    def get_urls(self):
        return urlpatterns

    def get_workspace_context_definitions(self):

        return {
            'tenant_4CaaSt_id': {
                'label': _('Tenant Id (4CaaSt)'),
            },
            'SaaS_tenant_4CaaSt_id': {
                'label': _('SaaS tenant Id (4CaaSt)'),
            }
        }

    def get_workspace_context_current_values(self, user_workspace):

        try:
            tenant_id = user_workspace.workspace.creator.tenantprofile_4CaaSt.id_4CaaSt
        except:
            tenant_id = ""

        try:
            SaaS_tenant_id = user_workspace.profile4caast.id_4CaaSt
        except:
            SaaS_tenant_id = ""

        return {
            'tenant_4CaaSt_id': tenant_id,
            'SaaS_tenant_4CaaSt_id': SaaS_tenant_id,
        }
