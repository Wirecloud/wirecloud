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

    def get_workspace_context_current_values(self, workspace, user):

        try:
            tenant_id = workspace.creator.tenantprofile_4CaaSt.id_4CaaSt
        except:
            tenant_id = ""

        try:
            user_workspace = workspace.userworkspace_set.get(user=user.id)
            SaaS_tenant_id = user_workspace.profile4caast.id_4CaaSt
        except:
            SaaS_tenant_id = ""

        return {
            'tenant_4CaaSt_id': tenant_id,
            'SaaS_tenant_4CaaSt_id': SaaS_tenant_id,
        }
