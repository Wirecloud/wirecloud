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


from lxml import etree
from cStringIO import StringIO

from django.core.urlresolvers import reverse
from django.test import Client

from wirecloud.commons.utils.testcases import WirecloudTestCase


class BasicViewsAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')

    def setUp(self):
        super(BasicViewsAPI, self).setUp()

        self.client = Client()

    def test_workspace_view_check_permissions(self):
    
        url = reverse('wirecloud.workspace_view', kwargs={'creator_user': 'user_with_workspaces', 'workspace': 'ExistingWorkspace'})

        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/xhtml+xml')

        parser = etree.XMLParser(encoding='utf-8')
        etree.parse(StringIO(response.content), parser)

    def test_workspace_view_handles_not_found(self):
    
        url = reverse('wirecloud.workspace_view', kwargs={'creator_user': 'noexistent_user', 'workspace': 'NonexistingWorkspace'})

        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

        parser = etree.XMLParser(encoding='utf-8')
        etree.parse(StringIO(response.content), parser)
