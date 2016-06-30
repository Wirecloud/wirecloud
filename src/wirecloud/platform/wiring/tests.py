# -*- coding: utf-8 -*-

# Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

import codecs
import json
import os
import re
import time
import unittest

from django.conf import settings
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.test import Client
from mock import Mock, patch
import selenium
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.commons.utils.remote import FormModalTester
from wirecloud.commons.utils.testcases import uses_extra_resources, uses_extra_workspace, WirecloudTestCase, WirecloudSeleniumTestCase, wirecloud_selenium_test_case
from wirecloud.platform import plugins
from wirecloud.platform.models import CatalogueResource, IWidget, Workspace


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False

SELENIUM_VERSION = tuple([int(number) for number in selenium.__version__.split('.')])


def selenium_supports_draganddrop(driver):
    return driver.capabilities['browserName'] != 'firefox' or SELENIUM_VERSION >= (2, 37, 2) or driver.profile.native_events_enabled


def send_basic_key_event(driver, keycode):
    driver.execute_script('''
        var keycode = arguments[0];
        var evt = document.createEvent("KeyboardEvent");
        if (evt.initKeyEvent != null) {
            evt.initKeyEvent("keydown", true, true, window, false, false, false, false, keycode, 0);
        } else {
            Object.defineProperty(evt, 'keyCode', {get: function () {return keycode;}});
            evt.initKeyboardEvent("keydown", true, true, window, 0, 0, 0, 0, 0, keycode);
        }
        document.dispatchEvent(evt);
    ''', keycode)


class WiringTestCase(WirecloudTestCase):

    fixtures = ('test_data',)
    tags = ('wirecloud-wiring', 'wirecloud-noselenium', 'wirecloud-wiring-noselenium')

    def setUp(self):

        super(WiringTestCase, self).setUp()

        self.user = User.objects.get(username='test')
        self.empty_wiring = {
            'operators': {},
            'connections': [],
        }

        self.workspace_id = 1
        Workspace.objects.filter(id=self.workspace_id).update(wiringStatus=self.empty_wiring)

        self.wiring_url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': self.workspace_id})

    def test_save_basic_wiring_connection(self):
        client = Client()
        client.login(username='test', password='test')

        new_wiring = {
            'operators': {},
            'connections': [
                {
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        }
        response = client.put(self.wiring_url, json.dumps(new_wiring), content_type='application/json')

        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus, new_wiring)

    def test_basic_wiring_operations_with_read_only_connections(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {},
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        new_wiring = {
            'operators': {},
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
                {
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 2,
                        'endpoint': 'slot',
                    },
                },
            ],
        }
        response = client.put(self.wiring_url, json.dumps(new_wiring, ensure_ascii=False), content_type='application/json')

        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus, new_wiring)

    def test_read_only_connections_cannot_be_deleted(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {},
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {},
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_read_only_connections_cannot_be_modified(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {},
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {},
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 2,
                        'endpoint': 'slot',
                    },
                },
            ],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_read_only_preferences_cannot_be_modified(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': False, 'readonly': True, 'value': 'a'},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'readonly': True, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_normal_preferences_can_be_removed(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': False, 'readonly': False, 'value': 'a'},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)

    def test_read_only_preferences_cannot_be_removed(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': False, 'readonly': True, 'value': 'a'},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_read_only_preferences_cannot_be_added(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {}
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'readonly': True},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_hidden_preferences_cannot_be_added(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {}
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_hidden_status_cannot_be_removed(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'a'},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': False, 'readonly': False, 'value': 'a'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_normal_preferences_can_be_added(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {}
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'value': 'a'},
                        'pref2': {'hidden': False, 'readonly': False, 'value': 'a'},
                    },
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)

    def test_normal_preferences_can_be_updated(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'a'},
                        'pref2': {'hidden': False, 'readonly': False, 'value': 'b'},
                    },
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'b'},
                        'pref2': {'hidden': False, 'readonly': False, 'value': 'c'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)

    def test_operator_added(self):

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': False, 'readonly': False, 'value': 'b'},
                        'pref2': {'hidden': False, 'readonly': False, 'value': 'c'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)

    def test_iwidget_removed(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {},
            'connections': [
                {
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 2,
                        'endpoint': 'slot',
                    },
                },
            ],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')
        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': self.workspace_id, 'tab_id': 1, 'iwidget_id': 1})
        client.delete(url)

        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus, self.empty_wiring)


@patch('wirecloud.platform.core.plugins.get_version_hash', new=Mock(return_value='v1'))
class OperatorCodeEntryTestCase(WirecloudTestCase):

    XML_NORMALIZATION_RE = re.compile(b'>\\s+<')
    fixtures = ('selenium_test_data',)
    tags = ('wirecloud-wiring', 'wirecloud-noselenium', 'wirecloud-wiring-noselenium')

    @classmethod
    def setUpClass(cls):
        if hasattr(settings, 'FORCE_DOMAIN'):
            cls.old_FORCE_DOMAIN = settings.FORCE_DOMAIN
        if hasattr(settings, 'FORCE_PROTO'):
            cls.old_FORCE_PROTO = settings.FORCE_PROTO

        settings.FORCE_DOMAIN = 'example.com'
        settings.FORCE_PROTO = 'http'
        cls.OLD_WIRECLOUD_PLUGINS = getattr(settings, 'WIRECLOUD_PLUGINS', None)

        settings.WIRECLOUD_PLUGINS = ()
        plugins.clear_cache()

        super(OperatorCodeEntryTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, 'old_FORCE_DOMAIN'):
            settings.FORCE_DOMAIN = cls.old_FORCE_DOMAIN
        else:
            del settings.FORCE_DOMAIN

        if hasattr(cls, 'old_FORCE_PROTO'):
            settings.FORCE_PROTO = cls.old_FORCE_PROTO
        else:
            del settings.FORCE_PROTO

        settings.WIRECLOUD_PLUGINS = cls.OLD_WIRECLOUD_PLUGINS
        plugins.clear_cache()

        super(OperatorCodeEntryTestCase, cls).tearDownClass()

    def read_file(self, *filename):
        f = codecs.open(os.path.join(os.path.dirname(__file__), *filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def test_operator_code_entry_get(self):

        client = Client()

        # Authenticate
        client.login(username='normuser', password='admin')

        # Make the request
        resource_id = (
            'Wirecloud',
            'TestOperator',
            '1.0',
        )
        url = reverse('wirecloud.operator_code_entry', args=resource_id)
        response = client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/xhtml+xml')
        final_code = self.XML_NORMALIZATION_RE.sub(b'><', response.content)

        expected_code = self.read_file('test-data/xhtml1-expected.xhtml')
        self.assertEqual(final_code, expected_code)


@wirecloud_selenium_test_case
class WiringBasicOperationTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium')

    def test_basic_wiring_editor_operations(self):

        if not selenium_supports_draganddrop(self.driver):  # pragma: no cover
            raise unittest.SkipTest('This test need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

        self.login()

        with self.wallet as wallet:
            wallet.search('Test')
            widget = wallet.search_in_results('Test')
            iwidget1 = widget.instantiate()
            iwidget2 = widget.instantiate()
            iwidget3 = widget.instantiate()

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                widget1 = sidebar.add_component('widget', "Wirecloud/Test", id=iwidget1.id)
                widget2 = sidebar.add_component('widget', "Wirecloud/Test", id=iwidget2.id, x=450)

            source = widget1.find_endpoint('source', "outputendpoint")
            target = widget2.find_endpoint('target', "inputendpoint")
            source.create_connection(target)

        self.send_basic_event(iwidget1)
        time.sleep(0.2)

        with iwidget2:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

        with iwidget3:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        with iwidget1:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_wiring_remove_connection(self):

        self.login()

        iwidgets = self.find_iwidgets()

        with self.wiring_view as wiring:
            for connection in wiring.find_connections():
                connection.remove()

        self.send_basic_event(iwidgets[0])

        time.sleep(1)

        with iwidgets[1]:
            text_div = self.driver.find_element_by_id('registercallback_test')
            self.assertEqual(text_div.text, '')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_wiring_status_change_events_from_widgets(self):

        self.login()

        iwidget = self.find_iwidget(title="Wirecloud API test")

        with iwidget.wait_loaded():
            text_div = self.driver.find_element_by_id('wiring_hasinputconnections_test')
            self.assertEqual(text_div.text, 'true')
            text_div = self.driver.find_element_by_id('wiring_hasoutputconnections_test')
            self.assertEqual(text_div.text, 'false')

        with self.wiring_view as wiring:
            for connection in wiring.find_connections():
                connection.remove()

            widget = wiring.find_draggable_component('widget', id=iwidget.id)
            operator = wiring.find_draggable_component('operator', id=1)

            target = operator.find_endpoint('target', "input")
            source = widget.find_endpoint('source', "outputendpoint")
            source.create_connection(target)

        with iwidget:
            text_div = self.driver.find_element_by_id('wiring_hasinputconnections_test')
            self.assertEqual(text_div.text, 'false')
            text_div = self.driver.find_element_by_id('wiring_hasoutputconnections_test')
            self.assertEqual(text_div.text, 'true')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_wiring_status_change_events_from_operators(self):

        self.login()

        with self.wiring_view as wiring:

            # Make modifications into the wiring
            widget = wiring.find_draggable_component('widget', title="Test (connected to the test operator)")
            operator = wiring.find_draggable_component('operator', id=1)
            operator.wait_to_be_loaded()

            source = operator.find_endpoint('source', "output")
            target = widget.find_endpoint('target', "inputendpoint")
            source.create_connection(target)

        # The operator automatically sends a "wiring modified" event when it detects a wiring change
        with self.find_iwidget(title="Test (connected to the test operator)"):
            WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'wiring modified')

    def test_wiring_editor_modify_connection_endpoints(self):

        if not selenium_supports_draganddrop(self.driver):  # pragma: no cover
            raise unittest.SkipTest('This test need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:

            with wiring.component_sidebar as sidebar:
                widget1 = sidebar.add_component('widget', "Wirecloud/Test", title="Test (1)")
                widget2 = sidebar.add_component('widget', "Wirecloud/Test", title="Test (2)", x=450)
                widget3 = sidebar.add_component('widget', "Wirecloud/Test", title="Test (3)", x=450, y=200)

            source = widget1.find_endpoint('source', "outputendpoint")
            target = widget2.find_endpoint('target', "inputendpoint")
            source.create_connection(target)

        iwidgets = self.find_iwidgets()
        self.send_basic_event(iwidgets[0])
        time.sleep(0.2)

        with iwidgets[1]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

        with iwidgets[2]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        with iwidgets[0]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        with self.wiring_view as wiring:
            widget1 = wiring.find_draggable_component('widget', title="Test (1)")
            widget3 = wiring.find_draggable_component('widget', title="Test (3)")

            source = widget1.find_endpoint('source', "outputendpoint")
            target = widget3.find_endpoint('target', "inputendpoint")

            connection = wiring.find_connection("widget/7/outputendpoint", "widget/8/inputendpoint")
            connection.remove()
            source.create_connection(target)

        self.send_basic_event(iwidgets[0], 'hello new world!!')

        with iwidgets[2]:

            try:
                WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello new world!!')
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello new world!!')

        with iwidgets[1]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

        with iwidgets[0]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

    def test_widget_preferences_in_wiring_editor(self):

        self.login(username='user_with_workspaces')
        iwidget = self.find_iwidget(title="Test 1").wait_loaded()

        # Update widget preferences using the wiring editor interface
        with self.wiring_view as wiring:
            widget = wiring.find_draggable_component('widget', id=iwidget.id)

            modal = widget.show_settings()
            modal.get_field('list').set_value("1")
            modal.get_field('text').set_value("test")
            modal.get_field('boolean').click()
            modal.get_field('password').set_value("password")
            modal.accept()

        # Check the widget has received an event with the new values
        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'test')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'password')

    def test_operator_preferences_in_wiring_editor(self):

        self.login(username='user_with_workspaces')

        # Update operator preferences using the wiring editor interface
        with self.wiring_view as wiring:
            operator = wiring.find_draggable_component('operator', id=0)
            operator.wait_to_be_loaded()

            modal = operator.show_settings()
            modal.get_field('prefix').set_value("prefix: ")
            modal.accept()

        iwidgets = self.find_iwidgets()

        # Check the operator has received the new preference value
        # The operator sends a event through the wiring to notify it
        with iwidgets[0]:
            WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'preferences changed: prefix')

        # Check the operator reads the correct value when using the
        # MashupPlatform API
        self.send_basic_event(iwidgets[1])
        time.sleep(0.2)

        with iwidgets[0]:
            WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'prefix: hello world!!')

    def test_operator_logging_support(self):

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            operator = wiring.find_draggable_component('operator', id=0)
            operator.wait_to_be_loaded()

            modal = operator.show_logs()
            self.assertEqual(len(modal.find_alerts(state='error')), 0)
            modal.accept()

            # Make test operator log some errors
            modal = operator.show_settings()
            modal.get_field('test_logging').click()
            modal.accept()

            # Check operator registered correctly the errors raised by the operator
            modal = operator.show_logs()
            self.assertEqual(len(modal.find_alerts(state='error')), 2)
            modal.accept()

        with self.find_iwidget(title="Test 1"):
            try:
                WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text != '')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'preferences changed: test_logging')

    def _check_connection_errors(self, connection, count):
        modal = connection.show_logs()
        self.assertEqual(len(modal.find_alerts(state='error')), count)
        modal.accept()

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_type_error_and_value_exceptions(self):

        self.login(username="admin", next="/admin/api-test-mashup")
        iwidgets = self.find_iwidgets()

        self.send_basic_event(iwidgets[0], 'typeerror')
        self.send_basic_event(iwidgets[0], 'valueerror')
        self.send_basic_event(iwidgets[2], 'typeerror')
        self.send_basic_event(iwidgets[2], 'valueerror')

        self.check_wiring_badge("4")

        with self.wiring_view as wiring:
            connections = wiring.find_connections(extra_class='has-error')
            self.assertEqual(len(connections), 2)
            self._check_connection_errors(connections[0], 2)
            self._check_connection_errors(connections[1], 2)

    def test_widgets_can_be_added(self):
        self.login(username='user_with_workspaces', next="user_with_workspaces/ExistingWorkspace")

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                widget_id = sidebar.add_component('widget', "Wirecloud/Test").id

        self.assertIsNotNone(self.find_iwidget(id=widget_id))


@wirecloud_selenium_test_case
class WiringRecoveringTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium')

    def _read_json_fixtures(self, filename):
        testdir_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test-data'))

        with open(os.path.join(testdir_path, filename + '.json')) as file_opened:
            return json.loads(file_opened.read())

    def test_components_with_no_visual_data_should_be_recovered(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = self._read_json_fixtures('wiringstatus_missing_visual_data')
        workspace.save()

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            self.assertEqual(len(wiring.find_draggable_components()), 3)
            self.assertEqual(len(wiring.find_draggable_components(extra_class='missing')), 0)
            self.assertEqual(len(wiring.find_connections()), 3)

        iwidgets = self.find_iwidgets()
        self.send_basic_event(iwidgets[0])
        time.sleep(0.2)

        with iwidgets[1]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

    def test_connections_with_unrecoverable_endpoint_should_not_be_recovered(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = self._read_json_fixtures('wiringstatus_unrecoverabledata')
        workspace.save()

        self.login(username='user_with_workspaces')
        self.assertIsNone(self.find_navbar_button("display-wiring-view").badge)

        with self.wiring_view as wiring:
            self.assertEqual(len(wiring.find_connections()), 0)


@wirecloud_selenium_test_case
class ComponentDraggableTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium', 'wirecloud-wiring-draggable-component')

    def test_component_dropped_out_of_bounds_should_be_added(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                self.assertIsNotNone(sidebar.add_component('operator', "Wirecloud/TestOperator", y=-250))
                self.assertIsNotNone(sidebar.add_component('widget', "Wirecloud/Test", title="Test (1)", x=-450))

    def test_rename_widget_from_component_preferences(self):
        new_title = "New title"
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                # Rename the widget available in sidebar.
                component = sidebar.find_component('widget', "Wirecloud/Test", title="Test 1")
                component.rename(new_title)
            # Check if the widget draggable's title is changed too.
            self.assertIsNotNone(wiring.find_draggable_component('widget', title=new_title))
        # Check if the widget interface's title is changed too.
        self.assertIsNotNone(self.find_iwidget(title=new_title))

    def test_rename_widget_from_component_draggable_preferences(self):
        new_title = "New title"
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            # Rename the widget draggable available in wiring diagram.
            component = wiring.find_draggable_component('widget', title="Test 1")
            component.rename(new_title)

            with wiring.component_sidebar as sidebar:
                # Check if the widget 's title of in sidebar is changed too.
                self.assertIsNotNone(sidebar.find_component('widget', "Wirecloud/Test", title=new_title))
        # Check if the widget interface's title has changed too
        self.assertIsNotNone(self.find_iwidget(title=new_title))

    def test_remove_components_with_endpoint_attached_to_more_than_one_connection(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            # Ready an endpoint with more than one connection
            operator = wiring.find_draggable_component('operator', id=0)
            target = operator.find_endpoint('source', "output")
            source = wiring.find_draggable_component('widget', title="Test 1").find_endpoint('target', "nothandled")
            source.create_connection(target)
            self.assertEqual(len(target.find_connections()), 2)

            operator.remove()
            self.assertEqual(len(wiring.find_connections()), 1)

    def test_remove_components_using_key_delete_when_behaviour_engine_is_disabled(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:

            # Select one of the widgets and the operator using the control key
            widget = wiring.find_draggable_component('widget', title="Test 1")
            operator = wiring.find_draggable_component('operator', id=0)
            wiring.select(components=(widget, operator))

            # Remove the selection using the delete key
            send_basic_key_event(self.driver, 46)

            self.assertIsNone(wiring.find_draggable_component('widget', title="Test 1"))
            self.assertIsNone(wiring.find_draggable_component('operator', id=0))

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_mashup-with-behaviours_1.0.wgt', shared=True)
    def test_remove_components_using_key_delete_when_behaviour_engine_is_enabled(self):
        # From wiring editor, select (1) one component belonging only to the
        # current behaviour, (2) one component belonging to the current behaviour
        # and another behaviour, and (3) one component belonging to another
        # behaviour.
        #
        # This test will use the 'Backspace' key for removing such components.
        #
        # In the case (1), the platform should ask to the user
        # In the case (2), the platform should remove the component selected
        # In the case (3), the platform should ignore the component selected

        self.login(username='user_with_workspaces', next='/user_with_workspaces/mashup-with-behaviours')

        with self.wiring_view as wiring:

            # Select the components using the command key
            widget1 = wiring.find_draggable_component('widget', title="Test 1")
            widget2 = wiring.find_draggable_component('widget', title="Test 2")
            operator = wiring.find_draggable_component('operator', id=1)

            wiring.select(components=(widget1, widget2, operator), key=Keys.COMMAND)

            # Remove the selection using the backspace key
            send_basic_key_event(self.driver, 8)

            modal = FormModalTester(self, self.wait_element_visible_by_css_selector(".wc-alert-dialog"))
            self.assertIn('Test 2', modal.body.text)
            self.assertNotIn('Test 1', modal.body.text)
            self.assertNotIn('TestOperator', modal.body.text)
            modal.accept()

            self.assertIsNone(wiring.find_draggable_component('widget', title="Test 2"))
            self.assertTrue(wiring.find_draggable_component('operator', id=1).has_class('background'))
            self.assertTrue(wiring.find_draggable_component('widget', title="Test 1").has_class('background'))

    @uses_extra_resources(('Wirecloud_TestOperator_2.0.zip',), shared=True)
    def test_upgrade_operator(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                operator = sidebar.find_component('operator', "Wirecloud/TestOperator", id=0)
                operator.change_version("2.0")
                self.assertEqual(operator.version, "v2.0")
                modal = operator.show_logs()
                WebDriverWait(self.driver, timeout=5).until(lambda driver: len(modal.find_alerts(title="The operator was upgraded to v2.0 successfully.")) == 1)
                modal.accept()
            draggable_operator = wiring.find_draggable_component('operator', id=operator.id)

            self.assertEqual(len(draggable_operator.find_endpoints('target')), 2)
            target = draggable_operator.find_endpoint('target', "input")
            self.assertFalse(target.has_class('missing'))
            self.assertTrue(len(target.find_connections()), 1)

            self.assertEqual(len(draggable_operator.find_endpoints('source')), 2)
            source = draggable_operator.find_endpoint('source', "output")
            self.assertTrue(source.has_class('missing'))
            self.assertTrue(len(source.find_connections()), 1)

            self.assertEqual(len(wiring.find_connections(extra_class="missing")), 1)
            connection = wiring.find_connections(extra_class="missing")[0]
            self.assertEqual(connection.source_id, source.id)

    @uses_extra_resources(('Wirecloud_Test_3.0.wgt',), shared=True)
    def test_upgrade_widget(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                widget = sidebar.find_component('widget', "Wirecloud/Test", title="Test 1")
                widget.change_version("3.0")
                self.assertEqual(widget.version, "v3.0")
                modal = widget.show_logs()
                WebDriverWait(self.driver, timeout=5).until(lambda driver: len(modal.find_alerts(title="The widget was upgraded to v3.0 successfully.")) == 1)
                modal.accept()
            draggable_widget = wiring.find_draggable_component('widget', id=widget.id)

            self.assertEqual(len(draggable_widget.find_endpoints('target')), 2)
            target = draggable_widget.find_endpoint('target', "inputendpoint")
            self.assertTrue(target.has_class('missing'))
            self.assertTrue(len(target.find_connections()), 1)

            self.assertEqual(len(wiring.find_connections(extra_class="missing")), 1)
            connection = wiring.find_connections(extra_class="missing")[0]
            self.assertEqual(connection.target_id, target.id)

            self.assertEqual(len(draggable_widget.find_endpoints('source')), 1)
            source = draggable_widget.find_endpoint('source', "outputendpoint")
            self.assertFalse(source.has_class('missing'))
            self.assertTrue(len(source.find_connections()), 1)

    @uses_extra_resources(('Wirecloud_Test_3.0.wgt',), shared=True)
    def test_upgrade_and_downgrade_widget(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            draggable_widget = wiring.find_draggable_component('widget', title="Test 1")
            draggable_widget.change_version("3.0")
            draggable_widget.change_version("1.0")
            modal = draggable_widget.show_logs()
            WebDriverWait(self.driver, timeout=5).until(lambda driver: len(modal.find_alerts(title="The widget was downgraded to v1.0 successfully.")) == 1)
            modal.accept()

            self.assertEqual(len(draggable_widget.find_endpoints('target')), 2)
            target = draggable_widget.find_endpoint('target', "inputendpoint")
            self.assertFalse(target.has_class('missing'))
            self.assertTrue(len(target.find_connections()), 1)

            self.assertEqual(len(wiring.find_connections(extra_class="missing")), 0)

    @uses_extra_resources(('Wirecloud_Test_3.0.wgt',), shared=True)
    def test_remove_missing_endpoint_with_no_connections(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            draggable_widget = wiring.find_draggable_component('widget', title="Test 1")
            draggable_widget.change_version("3.0")

            connection = wiring.find_connections(extra_class="missing")[0]
            connection.remove()

            self.assertIsNone(draggable_widget.find_endpoint('target', "inputendpoint"))

    @uses_extra_resources(('Wirecloud_Test_3.0.wgt',), shared=True)
    def test_missing_endpoints_cannot_be_ordered(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            draggable_widget = wiring.find_draggable_component('widget', title="Test 1")
            draggable_widget.change_version("3.0")
            draggable_widget.show_preferences().check(must_be_disabled=("Order endpoints",))

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_search_components_by_keywords(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                groups = sidebar.find_component_groups('widget', keywords="api")
                self.assertEqual(len(groups), 1)
                group = groups[0]
                self.assertEqual(group.id, "Wirecloud/api-test")

    def test_search_components_by_keywords_no_results(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                groups = sidebar.find_component_groups('widget', keywords="api")
                self.assertEqual(len(groups), 0)
                alert = sidebar.alert
                self.assertIsNotNone(alert)
                self.assertTrue(alert.has_class('alert-error'))

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_search_components_by_keywords_suggestions(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                groups = sidebar.find_component_groups('widget', keywords="aip")
                self.assertEqual(len(groups), 1)
                alert = sidebar.alert
                self.assertIsNotNone(alert)
                self.assertTrue(alert.has_class('alert-info'))

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_mashup-with-behaviours_1.0.wgt', shared=True)
    def test_check_component_sidebar(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/mashup-with-behaviours')
        self._check_component_sidebar()
        # Get back to dashboard
        self._check_component_sidebar()

    def _check_component_sidebar(self):
        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                widgets = sidebar.find_components('widget', "Wirecloud/Test")
                self.assertEqual(len(widgets), 2)
                self.assertEqual(widgets[0].title, "Test 1")
                self.assertEqual(widgets[0].state, "in use")
                self.assertEqual(widgets[1].title, "Test 2")
                self.assertEqual(widgets[1].state, "in use")

                operators = sidebar.find_components('operator', "Wirecloud/TestOperator")
                self.assertEqual(len(operators), 1)
                self.assertEqual(operators[0].title, "TestOperator")
                self.assertEqual(operators[0].state, "in use")


@wirecloud_selenium_test_case
class ComponentMissingTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium')

    def _read_json_fixtures(self, *args):
        testdir_path = os.path.join(os.path.dirname(__file__), 'test-data')
        json_fixtures = []

        for filename in args:
            file_opened = open(os.path.join(testdir_path, filename + '.json'))
            json_fixtures.append(json.loads(file_opened.read()))
            file_opened.close()

        if len(json_fixtures) == 0:
            return None

        if len(json_fixtures) == 1:
            return json_fixtures[0]

        return tuple(json_fixtures)

    def test_widget_uninstalled_with_tradeinfo(self):

        CatalogueResource.objects.get(vendor="Wirecloud", short_name="Test").delete()

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            self.assertEqual(len(wiring.find_draggable_components('widget', extra_class='missing')), 2)

    def test_widget_with_visualinfo_and_connections_is_not_in_workspace(self):

        # Set a new wiring configuration containing a widget only referenced in
        # the visual description of the wiring status (the widget doesn't exist
        # on the current workspace)
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = self._read_json_fixtures('wiringstatus_widget_missingtradeinfo_with_connections')
        workspace.save()

        self.login(username='user_with_workspaces')

        # WireCloud should ignore the extra widget described in the wiring
        # status
        self.assertIsNone(self.find_navbar_button("display-wiring-view").badge)

        with self.wiring_view as wiring:
            # Check the Wiring Editor only display the valid widgets
            self.assertEqual(len(wiring.find_draggable_components('widget')), 2)

    def _check_operator_missing(self, wiring, component_id, source_length, target_length):
        operator = wiring.find_draggable_component('operator', id=component_id)

        self.assertTrue(operator.has_class('missing'))
        operator.show_preferences().check(must_be_disabled=('Settings',)).close()

        self.assertEqual(len(operator.find_endpoints('source')), source_length)
        self.assertEqual(len(operator.find_endpoints('target')), target_length)

    def test_operator_uninstalled_with_tradeinfo(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = self._read_json_fixtures('wiringstatus_operatoruninstalled_with_tradeinfo')
        workspace.save()

        self.login(username='user_with_workspaces')
        self.check_wiring_badge("1")

        with self.wiring_view as wiring:
            self._check_operator_missing(wiring, 1, 1, 1)

        with self.wiring_view as wiring:
            self._check_operator_missing(wiring, 1, 1, 1)

    def test_operator_uninstalled_with_tradeinfo_and_connections(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = self._read_json_fixtures('wiringstatus_operatoruninstalled_with_tradeinfo_and_connections')
        workspace.save()

        self.login(username='user_with_workspaces')
        self.check_wiring_badge("4")

        with self.wiring_view as wiring:
            self._check_operator_missing(wiring, 1, 1, 1)
            self.assertEqual(len(wiring.find_connections(extra_class="missing")), 3)


@wirecloud_selenium_test_case
class ComponentOperatorTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium')

    def test_operator_available_after_being_installed(self):
        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_TestOperatorSelenium_1.0.zip', 'TestOperatorSelenium', shared=True)

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                self.assertIsNotNone(sidebar.find_component_group('operator', "Wirecloud/TestOperatorSelenium"))

    def test_operator_not_available_after_being_uninstalled(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        with self.myresources_view as myresources:
            myresources.uninstall_resource("TestOperator")

        with self.wiring_view as wiring:
            self.assertTrue(wiring.find_draggable_component('operator', id=0).has_class('missing'))

            with wiring.component_sidebar as sidebar:
                self.assertIsNone(sidebar.find_component_group('operator', "Wirecloud/TestOperator"))

    def test_operator_not_usable_after_being_deleted(self):
        self.login()

        with self.myresources_view as myresources:
            myresources.delete_resource('TestOperator')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                self.assertIsNone(sidebar.find_component_group('operator', "Wirecloud/TestOperator"))

    @uses_extra_resources(('Wirecloud_Test_NoImage_3.0.wgt',), shared=True)
    def test_operator_with_no_image(self):
        # Add a widget with no image included.
        self.login()
        self.add_widget_to_mashup('Test_NoImage')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                # The current version displayed should show the default no-image.
                self.assertFalse(sidebar.find_component_group('widget', "Wirecloud/Test_NoImage").has_image())

    def test_operator_can_be_used_after_being_reinstalled(self):
        self._reupload_and_use_operator()

    def test_operator_can_be_used_after_being_reinstalled_and_browser_is_reloaded(self):
        self._reupload_and_use_operator(reload=True)

    def _reupload_and_use_operator(self, reload=False):
        workspace = Workspace.objects.get(id=3)
        workspace.wiringStatus['operators']['0']['preferences'] = {
            'prefix': {"readonly": False, "hidden": False, "value": 'test_'},
            'exception_on_event': {"readonly": False, "hidden": False, "value": 'true'},
            'test_logging': {"readonly": False, "hidden": False, "value": 'true'}
        }
        workspace.save()

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        with self.wiring_view as wiring:
            modal = wiring.find_draggable_component('operator', id=0).show_settings()
            modal.get_field('exception_on_event').click()
            modal.accept()

        with self.myresources_view as myresources:
            myresources.uninstall_resource('TestOperator')

        if reload is True:
            self.reload()

        # Reinstall the operator
        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_TestOperator_1.0.zip', 'TestOperator', shared=True)

        # Check the operator leaves ghost mode
        self.assertIsNone(self.find_navbar_button("display-wiring-view").badge)

        # Check operator connections are restored sucessfully
        tab = self.get_workspace_tab_by_name('Tab 2')
        tab.element.click()
        (target_iwidget, source_iwidget) = self.find_iwidgets()
        self.send_basic_event(source_iwidget)

        with target_iwidget:
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_id('wiringOut').text != 'hello world!!')

        # Check preference values has been restored to the values used before uninstalling the widget and not to the default ones
        with self.wiring_view as wiring:
            modal = wiring.find_draggable_component('operator', id=0).show_settings()
            self.assertEqual(modal.get_field('prefix').value, "test_")
            self.assertFalse(modal.get_field('exception_on_event').is_selected)
            self.assertTrue(modal.get_field('test_logging').is_selected)
            modal.accept()


@wirecloud_selenium_test_case
class ConnectionManagementTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium', 'wirecloud-wiring-connection-management')

    def test_readonly_connections_cannot_be_deleted(self):
        # Change the connection state to readonly
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['connections'][1]['readonly'] = True
        workspace.save()

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            # Such connection should be readonly and its button 'delete'
            # should be disabled
            connection = wiring.find_connection("widget/2/outputendpoint", "operator/0/input")
            self.assertTrue(connection.has_class('readonly'))
            self.assertTrue(connection.btn_remove.is_disabled)

    def test_components_with_readonly_connections_cannot_be_deleted(self):
        # Change the connection state to readonly
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['connections'][1]['readonly'] = True
        workspace.save()

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            # Both components of the readonly connection should also be readonly and
            # their buttons 'delete' should be disabled
            widget = wiring.find_draggable_component('widget', id=2)
            self.assertTrue(widget.has_class('readonly'))
            self.assertTrue(widget.btn_remove.is_disabled)
            operator = wiring.find_draggable_component('operator', id=0)
            self.assertTrue(operator.has_class('readonly'))
            self.assertTrue(operator.btn_remove.is_disabled)

    def test_connections_with_only_visual_data_should_be_ignored(self):
        # Change the connection output-endpoint from the business description.
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['connections'][0]['target']['endpoint'] = 'nothandled'
        workspace.save()

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            # The workspace should have three connections loaded
            self.assertEqual(len(wiring.find_connections()), 3)
            self.assertEqual(len(wiring.find_connections(extra_class='missing')), 0)

    def test_active_connection_should_allow_to_change_their_endpoints(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            target1 = wiring.find_draggable_component('operator', id=0).find_endpoint('target', 'input')
            target2 = wiring.find_draggable_component('widget', id=1).find_endpoint('target', 'inputendpoint')

            connection = wiring.find_connection('widget/2/outputendpoint', 'operator/0/input')
            connection.change_endpoint(target1, target2)

            self.assertIsNone(wiring.find_connection('widget/2/outputendpoint', 'operator/0/input'))
            connection = wiring.find_connection('widget/2/outputendpoint', 'widget/1/inputendpoint')
            self.assertIsNotNone(connection)
            # This has been fixed in WireCloud 1.0, but is not working on WireCloud 0.9
            # See https://github.com/Wirecloud/wirecloud/issues/174 for more info
            #WebDriverWait(self.driver, timeout=2).until(lambda driver: connection.has_class('active'))

    def test_modify_connection_on_several_behaviours(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WorkspaceBehaviours')

        with self.wiring_view as wiring:
            operator = wiring.find_draggable_component('operator', id=0)
            target1 = operator.find_endpoint('target', 'input')
            target2 = operator.find_endpoint('target', 'nothandled')

            connection = wiring.find_connection('widget/11/outputendpoint', 'operator/0/input')
            connection.change_endpoint(target1, target2)

            # The button 'accept' corresponds to modify such connection in all the behaviours
            modal = FormModalTester(self, self.wait_element_visible_by_css_selector(".wc-alert-dialog"))
            modal.accept()

            self.assertIsNone(wiring.find_connection('widget/11/outputendpoint', 'operator/0/input'))
            connection = wiring.find_connection('widget/11/outputendpoint', 'operator/0/nothandled')
            self.assertIsNotNone(connection)
            self.assertTrue(connection.has_class('active'))

    def test_modify_connection_on_active_behaviours(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WorkspaceBehaviours')

        with self.wiring_view as wiring:
            operator = wiring.find_draggable_component('operator', id=0)
            target1 = operator.find_endpoint('target', 'input')
            target2 = operator.find_endpoint('target', 'nothandled')

            # The button 'cancel' corresponds to modify such connection only in the active behaviour
            connection = wiring.find_connection('widget/11/outputendpoint', 'operator/0/input')
            connection.change_endpoint(target1, target2)
            modal = FormModalTester(self, self.wait_element_visible_by_css_selector(".wc-alert-dialog"))
            modal.cancel()

            self.assertTrue(wiring.find_connection('widget/11/outputendpoint', 'operator/0/input').has_class('background'))
            connection = wiring.find_connection('widget/11/outputendpoint', 'operator/0/nothandled')
            self.assertIsNotNone(connection)
            self.assertTrue(connection.has_class('active'))

    def test_modify_connection_on_background_is_not_allowed(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WorkspaceBehaviours')

        with self.wiring_view as wiring:
            operator = wiring.find_draggable_component('operator', id=0)
            source = operator.find_endpoint('source', 'output')

            widget = wiring.find_draggable_component('widget', title="Test 1")
            target = widget.find_endpoint('target', 'nothandled')

            connection1 = wiring.find_connection('operator/0/output', 'widget/10/inputendpoint')
            connection1.click()

            connection2 = source.create_connection(target)

            self.assertTrue(connection1.has_class('background'))
            self.assertFalse(connection1.has_class('active'))
            self.assertIsNotNone(connection2)

    def test_modify_connection_and_drop_over_connection_on_background(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WorkspaceBehaviours')

        with self.wiring_view as wiring:
            operator = wiring.find_draggable_component('operator', id=0)
            widget = wiring.find_draggable_component('widget', title="Test 1")

            source1 = operator.find_endpoint('source', 'output')
            target1 = widget.find_endpoint('target', 'inputendpoint')
            target2 = widget.find_endpoint('target', 'nothandled')
            connection = source1.create_connection(target2)
            connection.change_endpoint(target2, target1)

            self.assertIsNone(wiring.find_connection(source1.id, target2.id))
            self.assertFalse(wiring.find_connection(source1.id, target1.id).has_class('background'))


@wirecloud_selenium_test_case
class EndpointManagementTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium', 'wirecloud-wiring-endpoint-management')

    @classmethod
    def setUpClass(cls):
        super(EndpointManagementTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):  # pragma: no cover
            cls.tearDownClass()
            raise unittest.SkipTest('EndpointManagementTestCase needs to use native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    def test_endpoints_suggested_when_mouse_is_over(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                widgets = sidebar.find_components('widget', 'Wirecloud/Test')
                widget1 = sidebar.add_component('widget', 'Wirecloud/Test', id=widgets[0].id)
                widget2 = sidebar.add_component('widget', 'Wirecloud/Test', id=widgets[1].id, x=450)
                widget3 = sidebar.add_component('widget', 'Wirecloud/Test', id=widgets[2].id, x=450, y=200)

            target1 = widget1.find_endpoint('target', 'inputendpoint')
            source2 = widget2.find_endpoint('source', 'outputendpoint')
            target3 = widget3.find_endpoint('target', 'inputendpoint')
            source3 = widget3.find_endpoint('source', 'outputendpoint')

            source2.mouse_over(must_suggest=(target1, target3))
            target1.mouse_over(must_suggest=(source2, source3))

    def test_endpoints_suggested_while_connection_is_creating(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                widgets = sidebar.find_components('widget', 'Wirecloud/Test')
                widget1 = sidebar.add_component('widget', 'Wirecloud/Test', id=widgets[0].id)
                widget2 = sidebar.add_component('widget', 'Wirecloud/Test', id=widgets[1].id, x=450)
                widget3 = sidebar.add_component('widget', 'Wirecloud/Test', id=widgets[2].id, x=450, y=200)

            target1 = widget1.find_endpoint('target', 'inputendpoint')
            source2 = widget2.find_endpoint('source', 'outputendpoint')
            target3 = widget3.find_endpoint('target', 'inputendpoint')
            source3 = widget3.find_endpoint('source', 'outputendpoint')

            source2.create_connection(target3, must_suggest=(target1, target3))
            target1.create_connection(source3, must_suggest=(source2, source3))

    def test_endpoints_can_be_collapsed_and_expanded(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                operators = sidebar.find_components('operator', 'Wirecloud/TestOperator', state='in use')
            wiring.find_draggable_component('operator', id=operators[0].id).collapse_endpoints()

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                operators = sidebar.find_components('operator', 'Wirecloud/TestOperator', state='in use')
            wiring.find_draggable_component('operator', id=operators[0].id).expand_endpoints()

    def test_endpoints_collapsed_should_expand_while_connection_is_creating(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                operators = sidebar.find_components('operator', 'Wirecloud/TestOperator', state='in use')
                widgets = sidebar.find_components('widget', 'Wirecloud/Test', state='in use')

            operator = wiring.find_draggable_component('operator', id=operators[0].id)
            operator.collapse_endpoints()

            widget1 = wiring.find_draggable_component('widget', id=widgets[0].id)
            widget1.collapse_endpoints()

            widget2 = wiring.find_draggable_component('widget', id=widgets[1].id)

            source = widget2.find_endpoint('source', "outputendpoint")
            target = widget1.find_endpoint('target', "inputendpoint")
            source.create_connection(target, must_expand=(operator, widget1))

    @uses_extra_resources(('Wirecloud_TestOperatorMultiendpoint_1.0.wgt',), shared=True)
    def test_components_with_endpoints_collapsed_cannot_order_endpoints(self):
        self.login()

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                operator = sidebar.add_component('operator', "Wirecloud/TestOperatorMultiendpoint")

            operator.collapse_endpoints()

            menu_dropdown = operator.show_preferences()
            menu_dropdown.check(must_be_disabled=("Order endpoints",))
            menu_dropdown.close()

    def check_input_endpoint_exceptions(self):

        self.login(username='user_with_workspaces')

        iwidgets = self.find_iwidgets()
        source_iwidget = iwidgets[0]
        target_iwidget = iwidgets[1]
        source_iwidget.wait_loaded()
        target_iwidget.wait_loaded()

        self.assertEqual(source_iwidget.error_count, 0)
        self.assertEqual(target_iwidget.error_count, 0)

        self.send_basic_event(source_iwidget)

        WebDriverWait(self.driver, timeout=10).until(lambda driver: target_iwidget.error_count == 1)
        self.assertEqual(source_iwidget.error_count, 0)

        with target_iwidget:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        # Test exception on the operator input endpoint
        source_iwidget = iwidgets[1]
        target_iwidget = iwidgets[0]

        self.send_basic_event(source_iwidget)
        self.check_wiring_badge("1")

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                operators = sidebar.find_components('operator', 'Wirecloud/TestOperator', state='in use')
            operator = wiring.find_draggable_component('operator', id=operators[0].id)
            modal = operator.show_logs()
            self.assertEqual(len(modal.find_alerts(state='error')), 1)
            modal.accept()

    def test_input_endpoint_exceptions(self):

        # Enable widget exceptions
        iwidget = IWidget.objects.get(pk=2)
        iwidget.set_variable_value("boolean", 'true')
        iwidget.save()

        # Enable operator exceptions
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['operators']['0']['preferences']['exception_on_event'] = {"readonly": False, "hidden": False, "value": 'true'}
        workspace.save()

        # Check exceptions
        self.check_input_endpoint_exceptions()

    def test_input_endpoint_no_handler_exceptions(self):

        # Update wiring connections to use the not handled input endpoints
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['connections'][0]['target']['endpoint'] = 'nothandled'
        workspace.wiringStatus['connections'][1]['target']['endpoint'] = 'nothandled'
        workspace.save()

        self.check_input_endpoint_exceptions()

    def test_missing_input_and_output_endpoints(self):
        # Update wiring connections to set (1) a connection bound to missing
        # input-endpoint and (2) a connection bound to missing output-endpoint.
        # From wiring editor, those connections must be displayed.

        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['connections'][0]['target']['endpoint'] = 'missing'
        workspace.wiringStatus['connections'][1]['source']['endpoint'] = 'missing'
        workspace.save()

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            self.assertEqual(len(wiring.find_connections(extra_class='missing')), 2)

    @uses_extra_resources(('Wirecloud_TestOperatorMultiendpoint_1.0.wgt',), shared=True)
    def test_ordering_operator_endpoints(self):
        self.login()

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                operator = sidebar.add_component('operator', "Wirecloud/TestOperatorMultiendpoint")
                operator_id = operator.id

            targets_count = len(operator.find_endpoints('target'))
            sources_count = len(operator.find_endpoints('target'))

            with operator.order_endpoints as component_editable:
                component_editable.move_endpoint('source', "output1", "output2")
                component_editable.move_endpoint('target', "input1", "input3")

            self.assertEqual(targets_count, len(operator.find_endpoints('target')))
            self.assertEqual(sources_count, len(operator.find_endpoints('source')))

        with self.wiring_view as wiring:
            operator = wiring.find_draggable_component('operator', id=operator_id)
            self.assertEqual(targets_count, len(operator.find_endpoints('target')))
            self.assertEqual(sources_count, len(operator.find_endpoints('source')))

    @uses_extra_resources(('Wirecloud_TestMultiendpoint_1.0.wgt',), shared=True)
    def test_ordering_widget_endpoints(self):
        self.login()
        iwidget = self.add_widget_to_mashup('Test_Multiendpoint')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                operator = sidebar.add_component('operator', "Wirecloud/TestOperator")
                widget = sidebar.add_component('widget', "Wirecloud/Test_Multiendpoint", id=iwidget.id, x=450)

            source = widget.find_endpoint('source', "output1")
            target = operator.find_endpoint('target', 'input')
            connection = source.create_connection(target)

            targets_count = len(widget.find_endpoints('target'))
            sources_count = len(widget.find_endpoints('target'))

            with widget.order_endpoints as component_editable:
                component_editable.move_endpoint('source', "output1", "output2", must_change=(connection,))
                component_editable.move_endpoint('target', "input1", "input3")

            self.assertEqual(targets_count, len(widget.find_endpoints('target')))
            self.assertEqual(sources_count, len(widget.find_endpoints('source')))

        with self.wiring_view as wiring:
            widget = wiring.find_draggable_component('widget', id=iwidget.id)
            self.assertEqual(targets_count, len(widget.find_endpoints('target')))
            self.assertEqual(sources_count, len(widget.find_endpoints('source')))


@wirecloud_selenium_test_case
class BehaviourManagementTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium', 'wirecloud-wiring-behaviour-management')

    def test_behaviour_engine_is_disabled_by_default(self):
        # Create a new workspace to ensure we are testing the default status of
        # the behaviour engine
        self.login()
        self.create_workspace(name="Test")

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                # Check the behaviour engine is disabled
                self.assertTrue(sidebar.disabled)
                self.assertFalse(sidebar.has_behaviours())

    def test_behaviour_engine_can_be_enabled(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.btn_enable.click()
                self.assertFalse(sidebar.disabled)
                # Check that there is an initial behaviour
                self.assertEqual(len(sidebar.find_behaviours()), 1)
                sidebar.active_behaviour.check_info("New behaviour", "No description provided.")

        # Check the change is correctly persisted
        self.reload()
        self.wait_wirecloud_ready()

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                self.assertFalse(sidebar.disabled)
                self.assertEqual(len(sidebar.find_behaviours()), 1)
                sidebar.active_behaviour.check_info("New behaviour", "No description provided.")

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_mashup-with-behaviours_1.0.wgt', shared=True)
    def test_behaviour_info_can_be_updated(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/mashup-with-behaviours')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.active_behaviour.update("Title", "Description")

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_mashup-with-behaviours_1.0.wgt', shared=True)
    def test_behaviour_title_and_description_cannot_be_emptied(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/mashup-with-behaviours')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.active_behaviour.update("", "")

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_mashup-with-behaviours_1.0.wgt', shared=True)
    def test_behaviours_can_be_created(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/mashup-with-behaviours')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.create_behaviour("Title", "Description")

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_mashup-with-behaviours_1.0.wgt', shared=True)
    def test_behaviours_can_be_created_with_no_info(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/mashup-with-behaviours')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.create_behaviour()

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_mashup-with-behaviours_1.0.wgt', shared=True)
    def test_order_behaviours(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/mashup-with-behaviours')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.btn_order.click()
                behaviour1 = sidebar.find_behaviour("Behaviour 1")
                behaviour2 = sidebar.find_behaviour("Behaviour 2")
                behaviour1.change_position(behaviour2)
                sidebar.btn_order.click()


@wirecloud_selenium_test_case
class ComponentVolatileTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_dashboard_management_api_support(self):

        # This test checks that the wiring editor behaves correctly when using
        # the dashboard management API, that its, the Wiring Editor loads and
        # serializes correctly the wiring status on the presence of volatile
        # widgets and operators.
        #
        # Volatile widgets and operators should be displayed in the showcase
        # using a volatile label and being disabled
        self.login()
        iwidgets = self.find_iwidgets()
        iwidgets_count = len(iwidgets)

        with iwidgets[1]:
            # use execute_script as we are not testing if the button is visible
            # and directly clickable without scrolling the view
            self.driver.execute_script("document.getElementById('dashboard_management_button').click();")
            # Two widgets are created when clicking the dashboard management button
            # one of them is connected directly, the other is connected through and
            # operator

        WebDriverWait(self.driver, timeout=5).until(lambda driver: len(self.find_iwidgets()) == (iwidgets_count + 2))

        with self.wiring_view as wiring:
            self.assertEqual(len(wiring.find_draggable_components('operator')), 1)
            self.assertEqual(len(wiring.find_draggable_components('widget')), 3)
            self.assertEqual(len(wiring.find_connections()), 2)

            with wiring.component_sidebar as sidebar:
                self.assertEqual(len(sidebar.find_components('operator', "Wirecloud/TestOperator", state='volatile')), 1)
                self.assertEqual(len(sidebar.find_components('widget', "Wirecloud/api-test", state='volatile')), 2)

        # Check dynamic connections created by the dashboard_management_button works as expected
        with iwidgets[1]:
            self.driver.execute_script("document.getElementById('wiring_pushevent_button').click();")

        # Add WebDriverWait until the event arrive both widgets

        iwidgets = self.find_iwidgets()
        with iwidgets[3]:
            text_div = self.driver.find_element_by_id('registercallback_test')
            self.assertEqual(text_div.text, 'Success!!')

        with iwidgets[4]:
            text_div = self.driver.find_element_by_id('registercallback_test')
            self.assertEqual(text_div.text, 'Success!!')
