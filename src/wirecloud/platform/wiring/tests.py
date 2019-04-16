# -*- coding: utf-8 -*-

# Copyright (c) 2011-2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.

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

import codecs
import json
import os
import re
import time
import unittest
from unittest.mock import Mock, patch

from django.conf import settings
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.test import Client, override_settings, TestCase, TransactionTestCase
import selenium
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.commons.utils.remote import FormModalTester
from wirecloud.commons.utils.testcases import uses_extra_resources, uses_extra_workspace, WirecloudTestCase, WirecloudSeleniumTestCase, wirecloud_selenium_test_case
from wirecloud.platform import plugins
from wirecloud.platform.models import CatalogueResource, IWidget, Workspace
from wirecloud.platform.workspace.utils import encrypt_value


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


class WiringTestCase(WirecloudTestCase, TransactionTestCase):

    fixtures = ('test_data',)
    tags = ('wirecloud-wiring', 'wirecloud-noselenium', 'wirecloud-wiring-noselenium')
    populate = False
    use_search_indexes = False

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
                        'pref1': {'hidden': False, 'readonly': True, 'value': {"users": {"2": 'a'}}},
                    },
                    'properties': {}
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
                        'pref1': {'readonly': True, 'value': {"users": {"2": 'b'}}},
                    },
                    'properties': {}
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
                        'pref1': {'hidden': False, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                    },
                    'properties': {}
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
                    'preferences': {},
                    'properties': {}
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
                        'pref1': {'hidden': False, 'readonly': True, 'value': {"users": {"2": 'a'}}},
                    },
                    'properties': {}
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
                    'preferences': {},
                    'properties': {}
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
                    'preferences': {},
                    'properties': {}
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
                    },
                    'properties': {}
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
                    'preferences': {},
                    'properties': {}
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
                    },
                    'properties': {}
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
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                    },
                    'properties': {}
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
                        'pref1': {'hidden': False, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                    },
                    'properties': {}
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
                    'preferences': {},
                    'properties': {}
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
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref1"]["value"], {"users": {"2": "a"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref2"]["value"], {"users": {"2": "a"}})

    def test_normal_preferences_can_be_updated(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'pref2': {'hidden': False, 'readonly': False, 'value': {"users": {"2": 'b'}}},
                    },
                    'properties': {}
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
                    },
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref1"]["value"], {"users": {"2": "b"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref2"]["value"], {"users": {"2": "c"}})

    def test_secure_preferences_can_be_updated(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                    },
                    'properties': {}
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps([{
            "op": "replace",
            "path": "/operators/1/preferences/pref1/value",
            "value": "helloWorld",
        }])

        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref1"]["value"], {"users": {"2": "helloWorld"}})

    def test_normal_properties_can_be_created(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {},
                    'properties': {}
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
                    'preferences': {},
                    'properties': {'prop1': {'hidden': False, 'readonly': False, 'value': 'b'}}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "b"}})

    def test_readonly_properties_cannot_be_created(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {},
                    'properties': {}
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
                    'preferences': {},
                    'properties': {'prop1': {'hidden': False, 'readonly': True, 'value': 'b'}}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_hidden_properties_cannot_be_created(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {},
                    'properties': {}
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
                    'preferences': {},
                    'properties': {'prop1': {'hidden': True, 'readonly': False, 'value': 'b'}}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_readonly_properties_status_cannot_be_updated(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {},
                    'properties': {'prop1': {'hidden': False, 'readonly': True, 'value': 'a'}}
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
                    'preferences': {},
                    'properties': {'prop1': {'hidden': False, 'readonly': False, 'value': 'a'}}
                },
            },
            'connections': [],
        })

        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_readonly_properties_value_cannot_be_updated(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {},
                    'properties': {'prop1': {'hidden': False, 'readonly': True, 'value': 'a'}}
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
                    'preferences': {},
                    'properties': {'prop1': {'hidden': False, 'readonly': True, 'value': 'b'}}
                },
            },
            'connections': [],
        })

        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_readonly_multiuser_properties_value_cannot_be_updated_by_owner(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': True, 'value': {"users": {"2": 'a'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps([
            {
                'op': "replace",
                'path': "/operators/1/properties/prop1/value",
                'value': "b"
            }
        ])

        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 403)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "a"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref1"]["value"], {"users": {"2": "default"}})

    def test_readonly_multiuser_properties_value_cannot_be_updated_by_allowed_user(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': True, 'value': {"users": {"2": 'a'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps([
            {
                'op': "replace",
                'path': "/operators/1/properties/prop1/value",
                'value': "b"
            }
        ])

        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 403)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "a"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref1"]["value"], {"users": {"2": "default"}})

    def test_hidden_properties_status_cannot_be_updated(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {},
                    'properties': {'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}}}
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
                    'preferences': {},
                    'properties': {'prop1': {'hidden': False, 'readonly': False, 'value': 'a'}}
                },
            },
            'connections': [],
        })

        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_normal_properties_can_be_removed(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {},
                    'properties': {'prop1': {'hidden': False, 'readonly': False, 'value': 'b'}}
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
                    'preferences': {},
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)

    def test_read_properties_cannot_be_removed(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {},
                    'properties': {'prop1': {'hidden': False, 'readonly': True, 'value': 'b'}}
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
                    'preferences': {},
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_hidden_properties_cannot_be_removed(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {},
                    'properties': {'prop1': {'hidden': True, 'readonly': False, 'value': 'b'}}
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
                    'preferences': {},
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_properties_can_be_updated_patch(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}}
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}}
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps([
            {
                'op': "replace",
                'path': "/operators/1/properties/prop1/value",
                'value': "c"
            }
        ])

        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')

        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "c"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop2"]["value"], {"users": {"2": "b"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref1"]["value"], {"users": {"2": "default"}})

    def test_multiuser_properties_can_be_updated_by_owner(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}}
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}}
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
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'default'}
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "b"}})

    def test_missing_operators_are_maintained_on_owner_requests(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestRandomOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}}
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}}
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
                    'name': 'Wirecloud/TestRandomOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'a'}
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'b'}
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)

    def test_multiuser_properties_can_be_updated_by_allowed_users(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'default'},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'b'},
                        'prop2': {'hidden': True, 'readonly': False, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "a", "3": "b"}})

    def test_multiuser_properties_can_be_updated_by_allowed_users_patches(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps([
            {
                'op': "replace",
                'path': "/operators/1/properties/prop1/value",
                'value': "b"
            }
        ])

        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "a", "3": "b"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop2"]["value"], {"users": {"2": "b"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref1"]["value"], {"users": {"2": "default"}})

    def test_multiuser_secure_properties_can_be_updated_by_owner_patches(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop3': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop4': {'hidden': True, 'readonly': True, 'value': {"users": {"3": 'a'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps([
            {
                'op': "replace",
                'path': "/operators/1/properties/prop3/value",
                'value': "c"
            }
        ])

        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop4"]["value"], {"users": {"3": "a"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop3"]["value"], {"users": {"2": encrypt_value("c")}})

    def test_multiuser_secure_properties_can_be_updated_by_allowed_user_patches(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop3': {'hidden': True, 'readonly': False, 'value': {"users": {"3": 'a'}}},
                        'prop4': {'hidden': True, 'readonly': True, 'value': {"users": {"3": 'a'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps([
            {
                'op': "replace",
                'path': "/operators/1/properties/prop3/value",
                'value': "c"
            }
        ])

        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop4"]["value"], {"users": {"3": "a"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop3"]["value"], {"users": {"3": encrypt_value("c")}})

    def test_multiuser_secure_properties_are_not_updated_by_owner_puts(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop3': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a', "3": 'a'}}},
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
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop3': {'hidden': True, 'readonly': False, 'value': 'c'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop3"]["value"], {"users": {"2": "a", "3": "a"}})

    def test_multiuser_secure_properties_are_not_updated_by_allowed_user_puts(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop3': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a', "3": 'a'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop3': {'hidden': True, 'readonly': False, 'value': 'c'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop3"]["value"], {"users": {"2": "a", "3": "a"}})

    def test_multiuser_secure_preferences_are_not_updated_by_owner_puts(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}}
                    },
                    'properties': {}
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
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref2': {'hidden': True, 'readonly': False, 'value': 'b'}
                    },
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref2"]["value"], {"users": {"2": "a"}})

    def test_multiuser_secure_preferences_are_not_updated_by_allowed_user_puts(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}}
                    },
                    'properties': {}
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref2': {'hidden': True, 'readonly': False, 'value': 'b'}
                    },
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref2"]["value"], {"users": {"2": "a"}})

    def test_missing_operator_properties_cannot_be_updated_by_allowed_users(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestRandomOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestRandomOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'default'},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'b'},
                        'prop2': {'hidden': True, 'readonly': False, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)

        self.assertEqual(workspace.wiringStatus, {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestRandomOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}},
                    }
                },
            },
            'connections': [],
        })

    def test_save_wiring_by_owner(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}},
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
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'default'},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'a'},
                        'prop2': {'hidden': True, 'readonly': False, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "a"}})

    def test_save_wiring_by_allowed_users(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'default'},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'a'},
                        'prop2': {'hidden': True, 'readonly': False, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "a", "3": "a"}})
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop2"]["value"], {"users": {"2": "b"}})

    def test_save_wiring_with_missing_operator_by_allowed_users(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestRandomOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestRandomOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'default'},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'a'},
                        'prop2': {'hidden': True, 'readonly': False, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "a"}})

    def test_normal_properties_cannot_be_updated_by_allowed_users(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop2': {'hidden': True, 'readonly': False, 'value': 'c'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_preferences_cannot_be_updated_by_allowed_users(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': 'randomValue'},
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_non_owners_cannot_remove_wiring_elements(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}},
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "b"}})

    def test_non_owners_cannot_add_wiring_elements(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(len(workspace.wiringStatus["operators"]["1"]["properties"]), 0)

    def test_non_owners_cannot_modify_wiring_elements(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref2': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'b'}}},
                    },
                    'properties': {
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref2': {'hidden': True, 'readonly': True, 'value': 'b'},
                    },
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["preferences"]["pref2"]["value"], {"users": {"2": "b"}})

    def test_unauthorized_users_cannot_update_wiring_with_puts(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}}
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test3', password='test')

        data = json.dumps({
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': 'b'},
                    }
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "a"}})

    def test_unauthorized_users_cannot_update_wiring_with_patches(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.public = False
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {},
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}}
                    }
                },
            },
            'connections': [],
        }
        workspace.save()

        client = Client()
        client.login(username='test3', password='test')

        data = json.dumps([
            {
                'op': "replace",
                'path': "/operators/1/properties/prop1/value",
                'value': "c"
            }
        ])

        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 403)
        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus["operators"]["1"]["properties"]["prop1"]["value"], {"users": {"2": "a"}})

    def test_operator_added_put(self):

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
                    },
                    'properties': {}
                },
            },
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 204)

    def test_operator_added_patch_by_owner(self):
        client = Client()
        client.login(username='test', password='test')

        data = json.dumps([
            {
                'op': "add",
                'path': "/operators/1",
                'value': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': False, 'readonly': False, 'value': 'b'},
                        'pref2': {'hidden': False, 'readonly': False, 'value': 'c'},
                    },
                    'properties': {}
                },
            }
        ])
        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 204)

    def test_operator_added_patch_by_allowed_user(self):
        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps([
            {
                'op': "add",
                'path': "/operators/1",
                'value': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': False, 'readonly': False, 'value': 'b'},
                        'pref2': {'hidden': False, 'readonly': False, 'value': 'c'},
                    },
                    'properties': {}
                },
            }
        ])
        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 403)

    def test_operator_added_patch_unauthorized_user(self):
        client = Client()
        client.login(username='test3', password='test')

        data = json.dumps([
            {
                'op': "add",
                'path': "/operators/1",
                'value': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperator/1.0',
                    'preferences': {
                        'pref1': {'hidden': False, 'readonly': False, 'value': 'b'},
                        'pref2': {'hidden': False, 'readonly': False, 'value': 'c'},
                    },
                    'properties': {}
                },
            }
        ])
        response = client.patch(self.wiring_url, data, content_type='application/json-patch+json')
        self.assertEqual(response.status_code, 403)

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

    def test_remove_widget_from_workspace_with_behaviours(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = {
            'connections': [
                {
                    'source': {
                        'type': 'widget',
                        'id': '1',
                        'endpoint': 'event'
                    },
                    'target': {
                        'type': 'widget',
                        'id': '2',
                        'endpoint': 'slot'
                    },
                },
            ],
            'visualdescription': {
                'components': {
                    'widget': {
                        '1': {},
                        '2': {}
                    }
                },
                'connections': [
                    {
                        'sourcename': "widget/1/event",
                        'targetname': "widget/2/slot"
                    }
                ],
                'behaviours': [
                    {
                        'components': {
                            'widget': {
                                '1': {},
                                '2': {}
                            }
                        },
                        'connections': [
                            {
                                'sourcename': "widget/1/event",
                                'targetname': "widget/2/slot"
                            }
                        ]
                    }
                ]
            }
        }
        workspace.save()

        client = Client()
        client.login(username='test', password='test')
        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': self.workspace_id, 'tab_id': 1, 'iwidget_id': 1})
        client.delete(url)

        workspace = Workspace.objects.get(id=self.workspace_id)
        self.assertEqual(workspace.wiringStatus, {
            'connections': [],
            'visualdescription': {
                'components': {
                    'widget': {
                        '2': {}
                    }
                },
                'connections': [],
                'behaviours': [
                    {
                        'components': {
                            'widget': {
                                '2': {}
                            }
                        },
                        'connections': []
                    }
                ]
            }
        })


@patch('wirecloud.platform.core.plugins.get_version_hash', new=Mock(return_value='v1'))
@override_settings(DEBUG=False, FORCE_PROTO='http', FORCE_DOMAIN='example.com', FORCE_PORT=80, WIRECLOUD_PLUGINS=())
class OperatorCodeEntryTestCase(WirecloudTestCase, TestCase):

    fixtures = ('selenium_test_data',)
    tags = ('wirecloud-wiring', 'wirecloud-noselenium', 'wirecloud-wiring-noselenium', 'wirecloud-operator-code-transformation')
    populate = False
    use_search_indexes = False

    XML_NORMALIZATION_RE = re.compile(b'>\\s+<')
    COMPRESS_HASH_RE = re.compile(b'/[a-z0-9]{12}\.js')

    @classmethod
    def setUpClass(cls):
        plugins.clear_cache()

        super(OperatorCodeEntryTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        plugins.clear_cache()

        super(OperatorCodeEntryTestCase, cls).tearDownClass()

    def read_file(self, *filename):
        f = codecs.open(os.path.join(os.path.dirname(__file__), *filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def check_operator_code_entry_get(self):

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

        if settings.COMPRESS_ENABLED:
            final_code = self.COMPRESS_HASH_RE.sub(b'/operatorapi.js', final_code)
            expected_code = self.read_file('test-data/xhtml1-compressed-expected.xhtml')
        else:
            expected_code = self.read_file('test-data/xhtml1-expected.xhtml')
        self.assertEqual(final_code, expected_code)

    @override_settings(COMPRESS_ENABLED=False)
    def test_operator_code_entry_get(self):
        self.check_operator_code_entry_get()

    @override_settings(COMPRESS_ENABLED=True)
    def test_operator_code_entry_get_compressed(self):
        self.check_operator_code_entry_get()


@wirecloud_selenium_test_case
class WiringEditorSearchSeleniumTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium')
    populate = False

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

    def test_component_dropped_out_of_bounds_should_be_added(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.component_sidebar as sidebar:
                    self.assertIsNotNone(sidebar.add_component('operator', "Wirecloud/TestOperator", y=-20))
                    self.assertIsNotNone(sidebar.add_component('widget', "Wirecloud/Test", title="Test (1)", x=-4))
    test_component_dropped_out_of_bounds_should_be_added.tags = tags + ('wirecloud-wiring-draggable-component',)

    @uses_extra_resources(('Wirecloud_TestOperator_2.0.zip',), shared=True)
    def test_upgrade_operator(self):
        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.component_sidebar as sidebar:
                    operator = sidebar.find_component('operator', "Wirecloud/TestOperator", id=0)
                    operator.change_version("2.0")
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
    def test_upgrade_and_downgrade_widget(self):
        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                # Upgrade to v3 on the sidebar
                with wiring.component_sidebar as sidebar:
                    widget = sidebar.find_component('widget', "Wirecloud/Test", title="Test 1")
                    widget.change_version("3.0")
                    WebDriverWait(self.driver, timeout=3).until(lambda driver: widget.version == "v3.0")
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

                # Downgrade to v1 using the widget preferences
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
        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                draggable_widget = wiring.find_draggable_component('widget', title="Test 1")
                draggable_widget.change_version("3.0")

                WebDriverWait(self.driver, timeout=5).until(lambda driver: len(wiring.find_connections(extra_class="missing")) == 1)

                connection = wiring.find_connections(extra_class="missing")[0]
                connection.remove()

                self.assertIsNone(draggable_widget.find_endpoint('target', "inputendpoint"))

    @uses_extra_resources(('Wirecloud_Test_3.0.wgt',), shared=True)
    def test_missing_endpoints_cannot_be_ordered(self):
        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                draggable_widget = wiring.find_draggable_component('widget', title="Test 1")
                draggable_widget.change_version("3.0")
                draggable_widget.show_preferences().check(must_be_disabled=("Order endpoints",))

    def test_widget_uninstalled_with_tradeinfo(self):

        CatalogueResource.objects.get(vendor="Wirecloud", short_name="Test").delete()

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                self.assertEqual(len(wiring.find_draggable_components('widget', extra_class='missing')), 2)

    def test_widget_with_visualinfo_and_connections_is_not_in_workspace(self):

        # Set a new wiring configuration containing a widget only referenced in
        # the visual description of the wiring status (the widget doesn't exist
        # on the current workspace)
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = self._read_json_fixtures('wiringstatus_widget_missingtradeinfo_with_connections')
        workspace.save()

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        # WireCloud should ignore the extra widget described in the wiring
        # status
        self.assertIsNone(self.find_navbar_button("wc-show-wiring-button").badge)

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
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

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Workspace')
        self.check_wiring_badge("1")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                self._check_operator_missing(wiring, 1, 0, 0)

            with edit_session.wiring_view as wiring:
                self._check_operator_missing(wiring, 1, 0, 0)

    def test_operator_uninstalled_with_tradeinfo_and_connections(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = self._read_json_fixtures('wiringstatus_operatoruninstalled_with_tradeinfo_and_connections')
        workspace.save()

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")
        self.check_wiring_badge("4")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                self._check_operator_missing(wiring, 1, 1, 1)
                self.assertEqual(len(wiring.find_connections(extra_class="missing")), 3)

    @uses_extra_resources(('Wirecloud_TestOperator_2.0.zip',), shared=True)
    def test_upgrade_missing_operator(self):

        # Make operator with id 0 missing by uninstalling TestOperator
        CatalogueResource.objects.get(vendor="Wirecloud", short_name="TestOperator", version="1.0").delete()

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:

                # Check operator is marked as missing
                operator = wiring.find_draggable_component('operator', id=0)
                self.assertTrue(operator.has_class('missing'))

                # Upgrade it to version 2.0 and check it leaves the missing status
                operator.change_version("2.0")
                WebDriverWait(self.driver, timeout=5).until(lambda driver: not operator.has_class('missing'))

    def test_operator_install_uninstall(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/pending-events')

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_TestOperatorSelenium_1.0.zip', 'TestOperatorSelenium', shared=True)

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.component_sidebar as sidebar:
                    self.assertIsNotNone(sidebar.find_component_group('operator', "Wirecloud/TestOperatorSelenium"))

        with self.myresources_view as myresources:
            myresources.uninstall_resource("TestOperator")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                self.assertTrue(wiring.find_draggable_component('operator', id=0).has_class('missing'))

                with wiring.component_sidebar as sidebar:
                    self.assertIsNone(sidebar.find_component_group('operator', "Wirecloud/TestOperator"))
    test_operator_install_uninstall.tags = tags + ('wirecloud-wiring-components',)

    def test_operator_not_usable_after_being_deleted(self):
        self.login(username="admin", next="admin/Workspace")

        with self.myresources_view as myresources:
            myresources.delete_resource('TestOperator')

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.component_sidebar as sidebar:
                    self.assertIsNone(sidebar.find_component_group('operator', "Wirecloud/TestOperator"))
    test_operator_not_usable_after_being_deleted.tags = tags + ('wirecloud-wiring-components',)

    @uses_extra_resources(('Wirecloud_Test_NoImage_3.0.wgt',), shared=True)
    def test_widget_with_no_image(self):
        # Add a widget with no image included.
        self.login(username="admin", next="admin/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.component_sidebar as sidebar:
                    # The current version displayed should show the default no-image.
                    self.assertFalse(sidebar.find_component_group('widget', "Wirecloud/Test_NoImage").has_image())
    test_widget_with_no_image.tags = tags + ('wirecloud-wiring-components',)

    def test_operator_can_be_used_after_being_reinstalled(self):
        prefix = 'test_'
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['operators']['0']['preferences'] = {
            'prefix': {"readonly": False, "hidden": False, "value": {"users": {"4": prefix}}},
            'exception_on_event': {"readonly": False, "hidden": False, "value": {"users": {"4": 'false'}}},
            'test_logging': {"readonly": False, "hidden": False, "value": {"users": {"4": 'true'}}}
        }
        workspace.save()

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Workspace')

        # Uninstall the operator
        with self.myresources_view as myresources:
            myresources.uninstall_resource('TestOperator')

        # Reinstall the operator
        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_TestOperator_1.0.zip', 'TestOperator', shared=True)

        self._check_reinstalled_operator(prefix)

        # Uninstall the operator again
        with self.myresources_view as myresources:
            myresources.uninstall_resource('TestOperator')

        # But this time, reload the browser before reinstalling it
        self.reload()
        self.wait_wirecloud_ready()

        # Reinstall the operator
        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_TestOperator_1.0.zip', 'TestOperator', shared=True)

        self._check_reinstalled_operator(prefix)

        # TODO
        time.sleep(0.5)
    test_operator_can_be_used_after_being_reinstalled.tags = tags + ('wirecloud-wiring-components',)

    def _check_reinstalled_operator(self, prefix):
        # Check the operator leaves ghost mode
        self.assertIsNone(self.find_navbar_button("wc-show-wiring-button").badge)

        event = 'hello world!!'

        # Check operator connections are restored sucessfully
        (target_iwidget, source_iwidget) = self.widgets
        self.send_basic_event(source_iwidget, event)

        with target_iwidget:
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_id('wiringOut').text == prefix + event)

        # Check preference values has been restored to the values used before uninstalling the widget and not to the default ones
        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                modal = wiring.find_draggable_component('operator', id=0).show_settings()
                self.assertEqual(modal.get_field('prefix').value, "test_")
                self.assertFalse(modal.get_field('exception_on_event').is_selected)
                self.assertTrue(modal.get_field('test_logging').is_selected)
                modal.accept()

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
        self.login(username="admin", next="admin/api-test-mashup")
        iwidgets = self.widgets
        iwidgets_count = len(iwidgets)

        with iwidgets[1]:
            # use execute_script as we are not testing if the button is visible
            # and directly clickable without scrolling the view
            self.driver.execute_script("document.getElementById('dashboard_management_button').click();")
            # Wait until the test finish with a success message
            WebDriverWait(self.driver, timeout=16).until(lambda driver: driver.find_element_by_id('dashboard_management_test').text == 'Success!!')

        # Two widgets are created when clicking the dashboard management button
        # one of them is connected directly, the other is connected through and
        # operator. The test will drop direct connections once passed, leaving
        # the connection between the volatile operator and the volatile widget
        WebDriverWait(self.driver, timeout=5).until(lambda driver: len(self.widgets) == (iwidgets_count + 2))

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                self.assertEqual(len(wiring.find_draggable_components('operator')), 1)
                self.assertEqual(len(wiring.find_draggable_components('widget')), 3)

                with wiring.component_sidebar as sidebar:
                    # The dasboard management test creates a volatile operator,
                    self.assertEqual(len(sidebar.find_components('operator', "Wirecloud/TestOperator", state='volatile')), 1)
                    # two volatile widgets
                    self.assertEqual(len(sidebar.find_components('widget', "Wirecloud/api-test", state='volatile')), 2)

                # and a volatile connection between the operator and one the volatile widgets
                # Wiring Editor should only display the initial connections
                self.assertEqual(len(wiring.find_connections()), 2)

        # Check dynamic connections created by the dashboard_management_button works as expected
        with iwidgets[1]:
            self.driver.execute_script("document.getElementById('wiring_pushevent_button').click();")

        # Add WebDriverWait until the event arrive both widgets

        iwidgets = self.widgets
        with iwidgets[3]:
            self.assertEqual(self.driver.find_element_by_id('registercallback_test').text, 'Success!!')

        with iwidgets[4]:
            self.assertEqual(self.driver.find_element_by_id('registercallback_test').text, 'Success!!')
    test_dashboard_management_api_support.tags = tags + ('wirecloud-wiring-volatile',)


@wirecloud_selenium_test_case
class WiringEditorSeleniumTestCase(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium')
    use_search_indexes = False

    @classmethod
    def setUpClass(cls):
        super(WiringEditorSeleniumTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):  # pragma: no cover
            cls.tearDownClass()
            raise unittest.SkipTest('WiringEditorSeleniumTestCase needs to use native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_test-mashup-recommendations_1.0.wgt', shared=True)
    def test_connections_works_engine_disabled(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/test-mashup-recommendations')
        event = "hello world!!"

        tab_widget1, tab_widget2, _ = self.widgets

        # Create a new connection and check it works
        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                widget1 = wiring.find_draggable_component('widget', id=tab_widget1.id)
                widget2 = wiring.find_draggable_component('widget', id=tab_widget2.id)

                source = widget1.find_endpoint('source', "outputendpoint")
                target = widget2.find_endpoint('target', "inputendpoint")
                source.create_connection(target)

        self.send_basic_event(tab_widget1, event)

        with tab_widget2:
            element = self.driver.find_element_by_id('wiringOut')
            WebDriverWait(self.driver, timeout=2).until(
                lambda driver: element.text == event
            )

        # Now remove the connection
        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                for connection in wiring.find_connections():
                    connection.remove()

        self.send_basic_event(tab_widget1, "other")
        # Wait 5 seconds before checking no event is received
        time.sleep(5)

        with tab_widget2:
            self.assertEqual(self.driver.find_element_by_id('wiringOut').text, event)

    def test_component_preferences_in_wiring_editor(self):

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")
        pref_prefix = "prefix: "

        with self.edit_mode as edit_session:
            tab_widget = self.find_widget(title="Test 1")

            with edit_session.wiring_view as wiring:
                widget = wiring.find_draggable_component('widget', id=tab_widget.id)
                operator = wiring.find_draggable_component('operator', id=0)
                operator.wait_to_be_loaded()

                # Update widget preferences using the wiring editor interface
                modal = widget.show_settings()
                modal.get_field('text').set_value("test")
                modal.accept()

                # Update operator preferences using the wiring editor interface
                modal = operator.show_settings()
                modal.get_field('prefix').set_value(pref_prefix)
                modal.accept()

        # Check the widget has received an event with the new values
        with tab_widget:
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'test')

            # Check the operator has received the new preference value
            # The operator sends a event through the wiring to notify it
            self.assertEqual(self.driver.find_element_by_id('wiringOut').text, 'preferences changed: prefix')

        # Check the operator reads the correct value when using the
        # MashupPlatform API
        event = 'hello world!!'
        self.send_basic_event(self.widgets[1], event)

        with tab_widget:
            self.assertEqual(self.driver.find_element_by_id('wiringOut').text, pref_prefix + event)

    def test_wiring_editor_create_and_modify_connection_endpoints(self):

        if not selenium_supports_draganddrop(self.driver):  # pragma: no cover
            raise unittest.SkipTest('This test need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

        self.login(username='user_with_workspaces', next="/user_with_workspaces/WiringTests")

        # Widget1 is initially connected to widget2
        # check wiring
        widgets = self.widgets
        event1 = 'hello world!!'
        event2 = 'hello new world!!'

        self.send_basic_event(widgets[0], event1)

        with widgets[1]:
            self.assertEqual(self.driver.find_element_by_id('wiringOut').text, event1)

        with widgets[2]:
            self.assertEqual(self.driver.find_element_by_id('wiringOut').text, "")

        # Modify connection between widget1 and widget2
        # so widget1 is connected to widget3 instead
        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                widget2 = wiring.find_draggable_component('widget', title="Test (2)")
                widget3 = wiring.find_draggable_component('widget', title="Test (3)")

                old_target = widget2.find_endpoint('target', "inputendpoint")
                new_target = widget3.find_endpoint('target', "inputendpoint")

                connection = wiring.find_connection("widget/7/outputendpoint", "widget/8/inputendpoint")
                connection.change_endpoint(old_target, new_target)

        # Check new wiring configuration
        self.send_basic_event(widgets[0], event2)

        with widgets[1]:
            self.assertEqual(self.driver.find_element_by_id('wiringOut').text, event1)

        with widgets[2]:
            self.assertEqual(self.driver.find_element_by_id('wiringOut').text, event2)

    def test_operator_logging_support(self):

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
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

            with self.find_widget(title="Test 1"):
                self.assertEqual(self.driver.find_element_by_id('wiringOut').text, 'preferences changed: test_logging')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_wiring_status_change_events_from_components(self):
        self.login(username="admin", next="admin/api-test-mashup")

        with self.edit_mode as edit_session:
            tab_widget = self.find_widget(title="Wirecloud API test")

            with tab_widget:
                self.assertEqual(self.driver.find_element_by_id('wiring_hasinputconnections_test').text, "true")
                self.assertEqual(self.driver.find_element_by_id('wiring_hasoutputconnections_test').text, "false")

            with edit_session.wiring_view as wiring:

                # Make modifications into the wiring
                for connection in wiring.find_connections():
                    connection.remove()

                widget = wiring.find_draggable_component('widget', id=tab_widget.id)
                operator = wiring.find_draggable_component('operator', id=1)

                target = operator.find_endpoint('target', "input")
                source = widget.find_endpoint('source', "outputendpoint")
                source.create_connection(target)

                # Create another connection between the operator and the output widget
                widget2 = wiring.find_draggable_component('widget', title="Test (connected to the test operator)")

                source = operator.find_endpoint('source', "output")
                target = widget2.find_endpoint('target', "inputendpoint")
                source.create_connection(target)

            with tab_widget:
                self.assertEqual(self.driver.find_element_by_id('wiring_hasinputconnections_test').text, "false")
                self.assertEqual(self.driver.find_element_by_id('wiring_hasoutputconnections_test').text, "true")

            # The operator automatically sends a "wiring modified" event when it detects a wiring change
            with self.find_widget(title="Test (connected to the test operator)"):
                element = self.driver.find_element_by_id('wiringOut')
                WebDriverWait(self.driver, timeout=2).until(
                    lambda driver: element.text == "wiring modified"
                )

    def test_remove_components_with_endpoint_attached_to_more_than_one_connection(self):
        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                # Ready an endpoint with more than one connection
                operator = wiring.find_draggable_component('operator', id=0)
                target = operator.find_endpoint('source', "output")
                source = wiring.find_draggable_component('widget', title="Test 1").find_endpoint('target', "nothandled")
                source.create_connection(target)
                self.assertEqual(len(target.find_connections()), 2)

                operator.remove()
                self.assertEqual(len(wiring.find_connections()), 1)
    test_remove_components_with_endpoint_attached_to_more_than_one_connection.tags = tags + ('wirecloud-wiring-draggable-component',)

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

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:

                # Select the components using the command key
                widget1 = wiring.find_draggable_component('widget', title="Test 1")
                widget2 = wiring.find_draggable_component('widget', title="Test 2")
                operator = wiring.find_draggable_component('operator', id=1)

                wiring.select(components=(widget1, widget2, operator), key=Keys.COMMAND)

                # Remove the selection using the backspace key
                send_basic_key_event(self.driver, 8)

                modal = FormModalTester(self, self.wait_element_visible(".wc-alert-modal"))
                self.assertIn('Test 2', modal.body.text)
                self.assertNotIn('Test 1', modal.body.text)
                self.assertNotIn('TestOperator', modal.body.text)
                modal.accept()

                # Wait until the browser reacts
                time.sleep(0.4)

                self.assertIsNone(wiring.find_draggable_component('widget', title="Test 2"))
                self.assertTrue(wiring.find_draggable_component('operator', id=1).has_class('background'))
                self.assertTrue(wiring.find_draggable_component('widget', title="Test 1").has_class('background'))
    test_remove_components_using_key_delete_when_behaviour_engine_is_enabled.tags = tags + ('wirecloud-wiring-draggable-component',)

    def test_rename_widget_from_component_preferences(self):
        new_title = "New title"
        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.component_sidebar as sidebar:
                    # Rename the widget available in sidebar.
                    component = sidebar.find_component('widget', "Wirecloud/Test", title="Test 1")
                    component.scroll().rename(new_title)
                # Check if the widget draggable's title is changed too.
                self.assertIsNotNone(wiring.find_draggable_component('widget', title=new_title))
            # Check if the widget interface's title is changed too.
            self.assertIsNotNone(self.find_widget(title=new_title))

            #
            # Now rename the widget from the draggable component instead
            #
            with edit_session.wiring_view as wiring:
                # Rename the widget draggable available in wiring diagram.
                component = wiring.find_draggable_component('widget', title=new_title)
                new_title = "Other Name"
                component.rename(new_title)

                with wiring.component_sidebar as sidebar:
                    # Check if the widget 's title of in sidebar is changed too.
                    self.assertIsNotNone(sidebar.find_component('widget', "Wirecloud/Test", title=new_title))
            # Check if the widget interface's title has changed too
            self.assertIsNotNone(self.find_widget(title=new_title))
    test_rename_widget_from_component_preferences.tags = tags + ('wirecloud-wiring-draggable-component',)

    def test_components_with_readonly_connections_cannot_be_deleted(self):
        # Change the connection state to readonly
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['connections'][1]['readonly'] = True
        workspace.save()

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                # Such connection should be readonly and its button 'delete'
                # should be disabled
                connection = wiring.find_connection("widget/2/outputendpoint", "operator/0/input")
                self.assertTrue(connection.has_class('readonly'))
                self.assertTrue(connection.btn_remove.is_disabled)

                # Both components of the readonly connection should also be readonly and
                # their buttons 'delete' should be disabled
                widget = wiring.find_draggable_component('widget', id=2)
                self.assertTrue(widget.has_class('readonly'))
                self.assertTrue(widget.btn_remove.is_disabled)
                operator = wiring.find_draggable_component('operator', id=0)
                self.assertTrue(operator.has_class('readonly'))
                self.assertTrue(operator.btn_remove.is_disabled)
    test_components_with_readonly_connections_cannot_be_deleted.tags = tags + ('wirecloud-wiring-connection-management',)

    def test_modify_connection_on_active_behaviours(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/WorkspaceBehaviours')

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                operator = wiring.find_draggable_component('operator', id=0)
                target1 = operator.find_endpoint('target', 'input')
                target2 = operator.find_endpoint('target', 'nothandled')

                # The button 'cancel' corresponds to modify such connection only in the active behaviour
                connection = wiring.find_connection('widget/11/outputendpoint', 'operator/0/input')
                connection.change_endpoint(target1, target2)
                modal = FormModalTester(self, self.wait_element_visible(".wc-alert-modal"))
                modal.cancel()

                self.assertTrue(wiring.find_connection('widget/11/outputendpoint', 'operator/0/input').has_class('background'))
                connection = wiring.find_connection('widget/11/outputendpoint', 'operator/0/nothandled')
                self.assertIsNotNone(connection)
                self.assertTrue(connection.has_class('active'))

                # Connections on the background cannot be modified
                # In this case, a new connection is created
                source = operator.find_endpoint('source', 'output')

                widget = wiring.find_draggable_component('widget', title="Test 1")
                target = widget.find_endpoint('target', 'nothandled')

                connection1 = wiring.find_connection('operator/0/output', 'widget/10/inputendpoint')
                # Remove connection1 from the current behaviour (convert into a
                # background connection)
                connection1.remove().click()
                connection2 = source.create_connection(target)

                self.assertTrue(connection1.has_class('background'))
                self.assertFalse(connection1.has_class('active'))
                self.assertIsNotNone(connection2)
    test_modify_connection_on_active_behaviours.tags = tags + ('wirecloud-wiring-connection-management',)

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_test-mashup-recommendations_1.0.wgt', shared=True)
    def test_endpoints_are_recommended(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/test-mashup-recommendations')

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                # Check endpoints are recommended on mouse over
                widget1 = wiring.find_draggable_component('widget', id=self.widgets[0].id)
                widget2 = wiring.find_draggable_component('widget', id=self.widgets[1].id)
                widget3 = wiring.find_draggable_component('widget', id=self.widgets[2].id)

                target1 = widget1.find_endpoint('target', 'inputendpoint')
                source2 = widget2.find_endpoint('source', 'outputendpoint')
                target3 = widget3.find_endpoint('target', 'inputendpoint')
                source3 = widget3.find_endpoint('source', 'outputendpoint')

                source2.mouse_over(must_recommend=(target1, target3))
                target1.mouse_over(must_recommend=(source2, source3))

                # Check endpoints are recommended on connection creation
                source2.create_connection(target3, must_recommend=(target1, target3))
                target1.create_connection(source3, must_recommend=(source2, source3))
    test_endpoints_are_recommended.tags = tags + ('wirecloud-wiring-endpoint-management',)

    def test_components_can_be_collapsed_and_expanded(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/Workspace')

        # Collapse a widget and an operator
        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.component_sidebar as sidebar:
                    operators = sidebar.find_components('operator', 'Wirecloud/TestOperator', state='in use')
                    widgets = sidebar.find_components('widget', 'Wirecloud/Test', state='in use')

                operator = wiring.find_draggable_component('operator', id=operators[0].id)
                operator.collapse_endpoints()

                widget1 = wiring.find_draggable_component('widget', id=widgets[0].id)
                widget1.collapse_endpoints()

                # Check the components are expanded while creating a connection
                widget2 = wiring.find_draggable_component('widget', id=widgets[1].id)

                source = widget2.find_endpoint('source', "outputendpoint")
                target = widget1.find_endpoint('target', "inputendpoint")
                source.create_connection(target, must_expand=(operator, widget1))

            # Expand the components
            with edit_session.wiring_view as wiring:
                with wiring.component_sidebar as sidebar:
                    operators = sidebar.find_components('operator', 'Wirecloud/TestOperator', state='in use')
                    widgets = sidebar.find_components('widget', 'Wirecloud/Test', state='in use')

                wiring.find_draggable_component('operator', id=operators[0].id).expand_endpoints()
                wiring.find_draggable_component('widget', id=widgets[0].id).expand_endpoints()
    test_components_can_be_collapsed_and_expanded.tags = tags + ('wirecloud-wiring-endpoint-management',)

    def check_input_endpoint_exceptions(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/Workspace')

        iwidgets = self.widgets
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
            self.assertEqual(self.driver.find_element_by_id('wiringOut').text, '')

        # Test exception on the operator input endpoint
        source_iwidget = iwidgets[1]
        target_iwidget = iwidgets[0]

        self.send_basic_event(source_iwidget)
        self.check_wiring_badge("1")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.component_sidebar as sidebar:
                    operators = sidebar.find_components('operator', 'Wirecloud/TestOperator', state='in use')
                operator = wiring.find_draggable_component('operator', id=operators[0].id)
                modal = operator.show_logs()
                self.assertEqual(len(modal.find_alerts(state='error')), 1)
                modal.accept()

    def test_input_endpoint_exceptions(self):
        user = User.objects.get(pk=4)

        # Enable widget exceptions
        iwidget = IWidget.objects.get(pk=2)
        iwidget.set_variable_value("boolean", 'true', user)
        iwidget.save()

        # Enable operator exceptions
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['operators']['0']['preferences']['exception_on_event'] = {"readonly": False, "hidden": False, "value": {"users": {"4": 'true'}}}
        workspace.save()

        # Check exceptions
        self.check_input_endpoint_exceptions()
    test_input_endpoint_exceptions.tags = tags + ('wirecloud-wiring-endpoint-management',)

    def _check_connection_errors(self, connection, count):
        modal = connection.show_logs()
        self.assertEqual(len(modal.find_alerts(state='error')), count)
        modal.accept()

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_type_error_and_value_exceptions(self):

        self.login(username="admin", next="/admin/api-test-mashup")
        widgets = self.widgets
        widgets[0].wait_loaded()
        widgets[2].wait_loaded()

        self.send_basic_event(widgets[0], 'typeerror')
        self.send_basic_event(widgets[0], 'valueerror')

        self.send_basic_event(widgets[2], 'typeerror')
        self.send_basic_event(widgets[2], 'valueerror')

        self.check_wiring_badge("4")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                connections = wiring.find_connections(extra_class='has-error')
                self.assertEqual(len(connections), 2)
                self._check_connection_errors(connections[0], 2)
                self._check_connection_errors(connections[1], 2)

    def test_input_endpoint_no_handler_exceptions(self):

        # Update wiring connections to use the not handled input endpoints
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['connections'][0]['target']['endpoint'] = 'nothandled'
        workspace.wiringStatus['connections'][1]['target']['endpoint'] = 'nothandled'
        workspace.save()

        self.check_input_endpoint_exceptions()
    test_input_endpoint_no_handler_exceptions.tags = tags + ('wirecloud-wiring-endpoint-management',)

    def test_missing_input_and_output_endpoints(self):
        # Update wiring connections to set (1) a connection bound to missing
        # input-endpoint and (2) a connection bound to missing output-endpoint.
        # From wiring editor, those connections must be displayed.

        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus['connections'][0]['target']['endpoint'] = 'missing'
        workspace.wiringStatus['connections'][1]['source']['endpoint'] = 'missing'
        workspace.save()

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Workspace')

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                self.assertEqual(len(wiring.find_connections(extra_class='missing')), 2)
    test_missing_input_and_output_endpoints.tags = tags + ('wirecloud-wiring-endpoint-management',)

    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_test-mashup-multiendpoint_1.0.wgt', shared=True)
    def test_ordering_component_endpoints(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/test-mashup-multiendpoint')

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                operator = wiring.find_draggable_component('operator', title="TestOp. Multiendpoint")
                widget = wiring.find_draggable_component('widget', title="Test_Multiendpoint")

                source = widget.find_endpoint('source', 'output1')
                target = operator.find_endpoint('target', 'input2')
                connection = source.create_connection(target)

                operator_targets_count = len(operator.find_endpoints('target'))
                operator_sources_count = len(operator.find_endpoints('target'))
                widget_targets_count = len(widget.find_endpoints('target'))
                widget_sources_count = len(widget.find_endpoints('target'))

                with operator.order_endpoints as component_editable:
                    component_editable.move_endpoint('source', 'output1', 'output2')
                    component_editable.move_endpoint('target', 'input2', 'input3', must_change=(connection,))

                with widget.order_endpoints as component_editable:
                    component_editable.move_endpoint('source', 'output1', 'output2', must_change=(connection,))
                    component_editable.move_endpoint('target', 'input1', 'input3')

                self.assertEqual(operator_targets_count, len(operator.find_endpoints('target')))
                self.assertEqual(operator_sources_count, len(operator.find_endpoints('source')))
                self.assertEqual(widget_targets_count, len(widget.find_endpoints('target')))
                self.assertEqual(widget_sources_count, len(widget.find_endpoints('source')))

            with edit_session.wiring_view as wiring:
                operator = wiring.find_draggable_component('operator', id=operator.id)
                widget = wiring.find_draggable_component('widget', id=widget.id)

                self.assertEqual(operator_targets_count, len(operator.find_endpoints('target')))
                self.assertEqual(operator_sources_count, len(operator.find_endpoints('source')))
                self.assertEqual(widget_targets_count, len(widget.find_endpoints('target')))
                self.assertEqual(widget_sources_count, len(widget.find_endpoints('source')))

                # Ordering endpoints should be disabled for collapsed components
                operator.collapse_endpoints()

                menu_dropdown = operator.show_preferences()
                menu_dropdown.check(must_be_disabled=("Order endpoints",))
                menu_dropdown.close()
    test_ordering_component_endpoints.tags = tags + ('wirecloud-wiring-endpoint-management',)

    def test_behaviour_engine_basic_features(self):

        # Use a workspace with behaviour engine disabled
        # Enable it
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.behaviour_sidebar as sidebar:
                    sidebar.btn_enable.click()
                    self.assertFalse(sidebar.disabled)
                    # Check that there is an initial behaviour
                    self.assertEqual(len(sidebar.find_behaviours()), 1)
                    sidebar.active_behaviour.check_info("New behaviour", "No description provided.")

        # Check the change is correctly persisted
        self.reload()
        self.wait_wirecloud_ready(login=True)

        with self.edit_mode as edit_session:
            with edit_session.wiring_view as wiring:
                with wiring.behaviour_sidebar as sidebar:
                    self.assertFalse(sidebar.disabled)
                    self.assertEqual(len(sidebar.find_behaviours()), 1)
                    sidebar.active_behaviour.check_info("New behaviour", "No description provided.")
                    behaviour1 = sidebar.active_behaviour

                    # Create a new behaviour
                    behaviour2 = sidebar.create_behaviour("Title", "Description")

                    # Change behaviour order
                    sidebar.btn_order.click()
                    behaviour1.change_position(behaviour2)
                    sidebar.btn_order.click()
    test_behaviour_engine_basic_features.tags = tags + ('wirecloud-wiring-behaviour-management',)
