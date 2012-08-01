# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import time

from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.db import transaction
from django.test import TransactionTestCase, Client
from django.utils import simplejson
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait

from commons.test import WirecloudSeleniumTestCase, widget_operation
from wirecloud.workspace.models import WorkSpace


# Avoid nose to repeat these tests (they are run through wirecloud/tests.py)
__test__ = False


class WiringTestCase(TransactionTestCase):

    fixtures = ['test_data']

    def setUp(self):
        self.user = User.objects.get(username='test')

        workspace = WorkSpace.objects.get(id=1)
        self.workspace_id = workspace.pk

        workspace.wiringStatus = simplejson.dumps({
            'operators': [],
            'connections': [],
        })
        workspace.save()
        transaction.commit()

        self.wiring_url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': self.workspace_id})

    def test_basic_wiring_operations(self):
        client = Client()
        client.login(username='test', password='test')

        data = simplejson.dumps({
            'operators': [],
            'connections': [
                {
                    'source': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')

        self.assertEquals(response.status_code, 204)
    test_basic_wiring_operations.tags = ('fiware-ut-6',)

    def test_wiring_modification_fails_with_incorrect_user(self):
        client = Client()
        client.login(username='test2', password='test')

        data = simplejson.dumps({
            'operators': [],
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEquals(response.status_code, 403)
    test_wiring_modification_fails_with_incorrect_user.tags = ('fiware-ut-6',)

    def test_read_only_connections_cannot_be_deleted(self):

        workspace = WorkSpace.objects.get(id=1)
        workspace.wiringStatus = simplejson.dumps({
            'operators': [],
            'connections': [
                {
                    'readOnly': True,
                    'source': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        })
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = simplejson.dumps({
            'operators': [],
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEquals(response.status_code, 403)


class WiringSeleniumTestCase(WirecloudSeleniumTestCase):

    tags = ('fiware-ut-6',)


    def get_iwidget_anchor(self, iwidget, endpoint):
        return self.driver.execute_script('''
            var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
            return LayoutManagerFactory.getInstance().viewsByName["wiring"].igadgets[%(iwidget)d].getAnchor("%(endpoint)s").wrapperElement;
        ''' % {"iwidget": iwidget, "endpoint": endpoint}
        )

    def test_basic_wiring_operations(self):
        self.login()

        self.add_widget_to_mashup('Test')
        self.add_widget_to_mashup('Test')
        self.add_widget_to_mashup('Test')

        self.change_main_view('wiring')
        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")
        self.driver.find_element_by_xpath("//*[contains(@class, 'container')]//*[text()='Widgets']").click()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container igadget')]//*[text()='Test (1)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-40, -40).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container igadget')]//*[text()='Test (2)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(40, 40).release().perform()

        source = self.get_iwidget_anchor(1, 'event')
        target = self.get_iwidget_anchor(2, 'slot')
        ActionChains(self.driver).drag_and_drop(source, target).perform()

        self.change_main_view('workspace')

        with widget_operation(self.driver, 1):
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.2)

        with widget_operation(self.driver, 2):
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut') == 'hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

        with widget_operation(self.driver, 3):
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        with widget_operation(self.driver, 1):
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')
