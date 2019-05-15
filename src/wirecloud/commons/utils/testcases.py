# -*- coding: utf-8 -*-

# Copyright (c) 2008-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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
import copy
from http.cookies import SimpleCookie
from io import BytesIO
import mimetypes
import os
import requests
import shutil
import stat
import sys
from tempfile import mkdtemp
import time
from unittest import mock
from urllib.error import URLError, HTTPError
from urllib.parse import unquote, urlparse

from django.apps import apps
from django.contrib.auth.models import Group, User
from django.contrib.staticfiles import finders
from django.core import management
from django.test import LiveServerTestCase, TestCase
from django.test.client import Client
from django.utils import translation
import haystack

from wirecloud.platform.localcatalogue.utils import fix_dev_version, install_resource
from wirecloud.platform.widget import utils as showcase
from wirecloud.platform.workspace.utils import create_workspace
from wirecloud.catalogue import utils as catalogue
from wirecloud.commons.utils.http import REASON_PHRASES
from wirecloud.commons.utils.remote import WirecloudRemoteTestCase, FieldTester
from wirecloud.commons.utils.wgt import WgtFile


def cleartree(path):

    if os.path.islink(path):
        # symlinks to directories are forbidden, see bug #1669
        raise OSError("Cannot call cleartree on a symbolic link")

    names = []
    try:
        names = os.listdir(path)
    except os.error:
        pass

    for name in names:
        fullname = os.path.join(path, name)
        try:
            mode = os.lstat(fullname).st_mode
        except os.error:
            mode = 0
        if stat.S_ISDIR(mode):
            shutil.rmtree(fullname, ignore_errors=True)
        else:
            try:
                os.remove(fullname)
            except os.error:
                pass


def restoretree(backup_path, dest_path):
    cleartree(dest_path)

    names = []
    try:
        names = os.listdir(backup_path)
    except os.error:
        pass

    for name in names:
        srcname = os.path.join(backup_path, name)
        dstname = os.path.join(dest_path, name)

        try:
            mode = os.lstat(srcname).st_mode
        except os.error:
            mode = 0

        if stat.S_ISDIR(mode):
            shutil.copytree(srcname, dstname)
        else:
            shutil.copy2(srcname, dstname)


class RealWebServer(object):

    def __init__(self):
        self._request_method = requests.request

    def request(self, method, url, *args, **kwargs):
        response = self._request_method(method, url, *args, **kwargs)

        if 'Content-Encoding' in response.headers:
            # We have decode the body
            del response.headers['Content-Encoding']
            response.headers['Content-Length'] = len(response.content)

        return {
            'status_code': response.status_code,
            'headers': response.headers,
            'content': response.content,
            'cookies': response.cookies
        }


class DynamicWebServer(object):

    responses = {}

    def __init__(self, fallback=None):

        self.fallback = fallback

    def add_response(self, method, path, response_body):

        if path not in self.responses:
            self.responses[path] = {}

        self.responses[path][method] = response_body

    def clear(self):
        self.responses = {}

    def request(self, method, url, *args, **kwargs):

        if 'data' not in kwargs or kwargs['data'] is None:
            kwargs['data'] = BytesIO(b'')

        parsed_url = urlparse(url)
        if parsed_url.path not in self.responses or method not in self.responses[parsed_url.path]:

            if self.fallback is not None:
                return self.fallback.request(method, url, *args, **kwargs)
            else:
                return {'status_code': 404, 'reason': 'Not Found'}

        response = self.responses[parsed_url.path][method]

        if callable(response):
            response = response(method, url, *args, **kwargs)

        return response


class LiveServer(object):

    def __init__(self):
        self._client = Client()

    def request(self, method, url, *args, **kwargs):

        parsed_url = urlparse(url)
        if parsed_url.path.startswith('/static/'):
            if method != 'GET':
                raise HTTPError('url', '405', 'Method not allowed', None, None)

            final_path = finders.find(parsed_url.path[8:])
            f = codecs.open(final_path, 'rb')
            contents = f.read()
            f.close()

            return {
                'headers': {
                    'Content-Type': mimetypes.guess_type(final_path, strict=False)[0],
                    'Content-Length': len(contents),
                },
                'content': contents,
            }
        else:
            return getattr(self._client, method.lower())(url)


class LocalFileSystemServer(object):

    def __init__(self, base_path):

        self.base_path = os.path.abspath(base_path)

    def request(self, method, url, *args, **kwargs):

        if method != 'GET':
            raise HTTPError('url', '405', 'Method not allowed', None, None)

        parsed_url = urlparse(url)
        final_path = os.path.normpath(os.path.join(self.base_path, unquote(parsed_url.path[1:])))
        if final_path.startswith(self.base_path) and os.path.isfile(final_path):
            f = codecs.open(final_path, 'rb')
            contents = f.read()
            f.close()

            return {
                'headers': {
                    'Content-Type': mimetypes.guess_type(final_path, strict=False)[0],
                    'Content-Length': len(contents),
                },
                'content': contents,
            }
        else:
            return {'status_code': 404, 'reason': 'Not Found'}


class StreamContent(object):

    def __init__(self, content):

        if isinstance(content, str):
            content = content.encode('utf8')

        self._content = BytesIO(content)

    def stream(self, *args, **kwargs):

        return self._content.__iter__()


class FakeNetwork(object):

    old_download_function = None
    old_requests_request = None
    old_requests_get = None
    old_requests_post = None

    def __init__(self, servers={}):
        self._servers = servers

    def __call__(self, method, url, *args, **kwargs):
        parsed_url = urlparse(url)

        if parsed_url.scheme not in self._servers or parsed_url.netloc not in self._servers[parsed_url.scheme]:
            raise URLError('not valid')

        server = self._servers[parsed_url.scheme][parsed_url.netloc]
        return server.request(method, url, *args, **kwargs)

    def _prepare_response(self, res_info, url):

        res = requests.Response()
        res.url = res_info.get('url', url)
        res.status_code = res_info.get('status_code', 200)
        res.reason_phrase = res_info.get('reason_phrase', REASON_PHRASES.get(res.status_code, 'UNKNOWN STATUS CODE'))

        if 'reason' in res_info:
            res.reason = res_info['reason']

        if 'headers' in res_info:
            res.headers.update(res_info['headers'])

            if 'Set-Cookie' in res_info['headers'] and 'cookies' not in res_info:
                cookies = SimpleCookie()
                for entry in res_info['headers']['Set-Cookie'].split(','):
                    cookies.load(str(entry))
                res.cookies.update(cookies)

        if 'cookies' in res_info:
            res.cookies.update(res_info['cookies'])

        res.raw = StreamContent(res_info.get('content', ''))

        return res

    def mock_requests(self):

        def request_mock(method, url, *args, **kwargs):
            res_info = self(method.upper(), url, *args, **kwargs)
            return self._prepare_response(res_info, url)

        def get_mock(url, *args, **kwargs):
            res_info = self('GET', url, *args, **kwargs)
            return self._prepare_response(res_info, url)

        def post_mock(url, *args, **kwargs):
            res_info = self('POST', url, *args, **kwargs)
            return self._prepare_response(res_info, url)

        self.patcher = mock.patch.multiple('requests', get=get_mock, post=post_mock, request=request_mock)
        self.patcher.start()

    def unmock_requests(self):
        self.patcher.stop()


def prepare_temporal_resource_directories(cls):

    cls.tmp_dir = mkdtemp()

    # catalogue deployer
    cls.old_catalogue_deployer = catalogue.wgt_deployer._root_dir
    cls.catalogue_tmp_dir_backup = os.path.join(cls.tmp_dir, 'catalogue_backup')
    cls.catalogue_tmp_dir = os.path.join(cls.tmp_dir, 'catalogue')
    catalogue.wgt_deployer._root_dir = cls.catalogue_tmp_dir

    # showcase deployer
    cls.old_deployer = showcase.wgt_deployer._root_dir
    cls.localcatalogue_tmp_dir_backup = os.path.join(cls.tmp_dir, 'localcatalogue_backup')
    cls.localcatalogue_tmp_dir = os.path.join(cls.tmp_dir, 'localcatalogue')
    showcase.wgt_deployer._root_dir = cls.localcatalogue_tmp_dir

    # deploy resource files
    for resource_file in cls.base_resources:
        resource_file = open(os.path.join(cls.shared_test_data_dir, resource_file), 'rb')
        resource_wgt = WgtFile(resource_file)
        catalogue.add_packaged_resource(resource_file, None, wgt_file=resource_wgt, deploy_only=True)
        showcase.wgt_deployer.deploy(resource_wgt)
        resource_file.close()

    # And freeze the resource files backup directories
    if os.path.exists(cls.localcatalogue_tmp_dir):
        os.rename(cls.localcatalogue_tmp_dir, cls.localcatalogue_tmp_dir_backup)
    else:
        os.mkdir(cls.localcatalogue_tmp_dir_backup)

    if os.path.exists(cls.catalogue_tmp_dir):
        os.rename(cls.catalogue_tmp_dir, cls.catalogue_tmp_dir_backup)
    else:
        os.mkdir(cls.catalogue_tmp_dir_backup)


DEFAULT_TEST_HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'wirecloud.commons.haystack_backends.whoosh_backend.WhooshEngine'
    }
}


class WirecloudTestCase(object):

    base_resources = ()
    populate = True
    use_search_indexes = True
    clear_search_indexes = None

    @classmethod
    def setUpClass(cls):

        if cls.use_search_indexes is False:
            cls.clear_search_indexes = False
        elif cls.clear_search_indexes is None and issubclass(cls, TestCase):
            cls.clear_search_indexes = False
        elif cls.clear_search_indexes is None:
            cls.clear_search_indexes = True

        # Setup languages
        from django.conf import settings

        cls.old_LANGUAGES = settings.LANGUAGES
        cls.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        cls.old_DEFAULT_LANGUAGE = settings.DEFAULT_LANGUAGE
        settings.LANGUAGES = (('en', 'English'), ('es', 'Spanish'))
        settings.LANGUAGE_CODE = 'en'
        settings.DEFAULT_LANGUAGE = 'en'

        cls.shared_test_data_dir = os.path.join(os.path.dirname(__file__), '../test-data')

        # Mock network requests
        cls.network = FakeNetwork(getattr(cls, 'servers', {
            'http': {
                'localhost:8001': LocalFileSystemServer(os.path.join(os.path.dirname(__file__), '..', 'test-data', 'src')),
                'macs.example.com': LocalFileSystemServer(os.path.join(os.path.dirname(__file__), '..', 'test-data')),
                'example.com': DynamicWebServer(),
            },
        }))
        cls.network.mock_requests()

        prepare_temporal_resource_directories(cls)

        # Prepare haystack configuration
        if cls.use_search_indexes:
            cls.old_haystack_conf = settings.HAYSTACK_CONNECTIONS
            try:
                settings.HAYSTACK_CONNECTIONS = copy.deepcopy(settings.TEST_HAYSTACK_CONNECTIONS)
                # Update whoosh index dir if not set by user
                if settings.HAYSTACK_CONNECTIONS['default']['ENGINE'] == 'wirecloud.commons.haystack_backends.whoosh_backend.WhooshEngine' and settings.HAYSTACK_CONNECTIONS['default'].get("PATH") is None:
                    settings.HAYSTACK_CONNECTIONS['default']['PATH'] = os.path.join(cls.tmp_dir, 'test_whoosh_indexes')
            except Exception:
                settings.HAYSTACK_CONNECTIONS = copy.deepcopy(DEFAULT_TEST_HAYSTACK_CONNECTIONS)
                settings.HAYSTACK_CONNECTIONS['default']['PATH'] = os.path.join(cls.tmp_dir, 'test_whoosh_indexes')

            # Reload the connection
            haystack.connections.connections_info = settings.HAYSTACK_CONNECTIONS
            haystack.connections.reload('default')
        else:
            apps.get_app_config('haystack').signal_processor.teardown()

        super(WirecloudTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):

        # Remove temporal directory
        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

        # deployers
        catalogue.wgt_deployer._root_dir = cls.old_catalogue_deployer
        showcase.wgt_deployer._root_dir = cls.old_deployer

        # Restore previous language configuration
        from django.conf import settings

        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        # Restore old haystack configuration
        if not cls.use_search_indexes:
            apps.get_app_config('haystack').signal_processor.setup()
        else:
            if not cls.clear_search_indexes:
                # If self.clear_search_indexes is True, this step is done in a per
                # test basis in the tearDown method
                management.call_command('clear_index', interactive=False, verbosity=0)

            settings.HAYSTACK_CONNECTIONS = cls.old_haystack_conf

        # Clear cache
        from django.core.cache import cache
        cache.clear()

        # Unmock network requests
        cls.network.unmock_requests()

        super(WirecloudTestCase, cls).tearDownClass()

    def setUp(self):

        # deployers
        restoretree(self.localcatalogue_tmp_dir_backup, self.localcatalogue_tmp_dir)
        restoretree(self.catalogue_tmp_dir_backup, self.catalogue_tmp_dir)

        # clean example.com responses
        try:
            self.network._servers['http']['example.com'].clear()
        except Exception:
            pass

        # cache
        from django.core.cache import cache
        cache.clear()

        # Restore English as the default language
        self.changeLanguage('en')

        super(WirecloudTestCase, self).setUp()

        # Populate initial db
        if self.populate:
            management.call_command('populate', verbosity=0, interactive=False)

    def tearDown(self):

        from django.conf import settings

        if self.clear_search_indexes:
            management.call_command('clear_index', interactive=False, verbosity=0)

            # Reload the connection
            haystack.connections.connections_info = settings.HAYSTACK_CONNECTIONS
            haystack.connections.reload('default')

        super(WirecloudTestCase, self).tearDown()

    def changeLanguage(self, new_language):

        from django.conf import settings

        settings.LANGUAGE_CODE = new_language
        settings.DEFAULT_LANGUAGE = new_language
        translation.activate(new_language)


def uses_extra_resources(resources, shared=False, public=True, users=(), groups=(), deploy_only=False, creator=None):

    def wrap(test_func):

        def wrapper(self, *args, **kwargs):

            if shared:
                base = self.shared_test_data_dir
            else:
                base = self.test_data_dir

            final_creator = User.objects.get(username=creator) if creator is not None else None

            final_users = tuple(User.objects.get(username=user) for user in users)
            final_groups = tuple(Group.objects.get(name=group) for group in groups)

            for resource in resources:
                wgt_file = open(os.path.join(base, resource), 'rb')
                wgt = WgtFile(wgt_file)

                fix_dev_version(wgt, final_creator)
                if deploy_only:
                    catalogue.add_packaged_resource(wgt.get_underlying_file(), final_creator, wgt_file=wgt, deploy_only=True)
                    wgt_file.close()
                    continue

                resource = install_resource(wgt, final_creator)

                if public:
                    resource.public = True
                    resource.save()

                resource.users.add(*final_users)
                resource.groups.add(*final_groups)

                wgt_file.close()

            return test_func(self, *args, **kwargs)

        wrapper.__name__ = test_func.__name__
        return wrapper

    return wrap


def uses_extra_workspace(owner, file_name, shared=False, public=False, users=(), groups=()):

    def wrap(test_func):

        def wrapper(self, *args, **kwargs):

            owner_user = User.objects.get(username=owner)

            if shared:
                base = self.shared_test_data_dir
            else:
                base = self.test_data_dir

            with open(os.path.join(base, file_name), 'rb') as f:
                create_workspace(owner_user, f)

            return test_func(self, *args, **kwargs)

        wrapper.__name__ = test_func.__name__
        return wrapper

    return wrap


class WirecloudSeleniumTestCase(LiveServerTestCase, WirecloudRemoteTestCase):

    fixtures = ('selenium_test_data',)
    base_resources = ('Wirecloud_TestOperator_1.0.zip', 'Wirecloud_Test_1.0.wgt', 'Wirecloud_test-mashup_1.0.wgt')
    __test__ = False

    # Only affecting Django 1.11+
    host = os.environ.get('DJANGO_LIVE_TEST_SERVER_HOST', 'localhost')

    populate = True
    use_search_indexes = True
    clear_search_indexes = True

    @classmethod
    def setUpClass(cls):

        from django.conf import settings

        WirecloudRemoteTestCase.setUpClass.__func__(cls)

        cls.old_LANGUAGES = settings.LANGUAGES
        cls.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        cls.old_DEFAULT_LANGUAGE = settings.DEFAULT_LANGUAGE
        settings.LANGUAGES = (('en', 'English'),)
        settings.LANGUAGE_CODE = 'en'
        settings.DEFAULT_LANGUAGE = 'en'

        # Mock network requests
        cls.network = FakeNetwork(getattr(cls, 'servers', {
            'http': {
                'localhost:8001': LocalFileSystemServer(os.path.join(os.path.dirname(__file__), '..', 'test-data', 'src')),
                'macs.example.com': LocalFileSystemServer(os.path.join(os.path.dirname(__file__), '..', 'test-data')),
                'example.com': DynamicWebServer(),
            },
        }))
        cls.network.mock_requests()

        prepare_temporal_resource_directories(cls)

        # Prepare haystack configuration
        if cls.use_search_indexes:
            cls.old_haystack_conf = settings.HAYSTACK_CONNECTIONS
            try:
                settings.HAYSTACK_CONNECTIONS = copy.deepcopy(settings.TEST_HAYSTACK_CONNECTIONS)
                # Update whoosh index dir if not set by user
                if settings.HAYSTACK_CONNECTIONS['default']['ENGINE'] == 'wirecloud.commons.haystack_backends.whoosh_backend.WhooshEngine' and settings.HAYSTACK_CONNECTIONS['default'].get("PATH") is None:
                    settings.HAYSTACK_CONNECTIONS['default']['PATH'] = os.path.join(cls.tmp_dir, 'test_whoosh_indexes')
            except Exception:
                settings.HAYSTACK_CONNECTIONS = copy.deepcopy(DEFAULT_TEST_HAYSTACK_CONNECTIONS)
                settings.HAYSTACK_CONNECTIONS['default']['PATH'] = os.path.join(cls.tmp_dir, 'test_whoosh_indexes')

            # Reload the connection
            haystack.connections.connections_info = settings.HAYSTACK_CONNECTIONS
            haystack.connections.reload('default')
        else:
            apps.get_app_config('haystack').signal_processor.teardown()

        # Browsers doesn't use content negotiation using ETags with HTTP 1.0 servers
        # Force Django to use HTTP 1.1 when using the runserver command
        from wsgiref import simple_server
        simple_server.ServerHandler.http_version = "1.1"

        LiveServerTestCase.setUpClass.__func__(cls)

        cls.network._servers['http'][cls.server_thread.host + ':' + str(cls.server_thread.port)] = LiveServer()

    @classmethod
    def tearDownClass(cls):

        from django.conf import settings

        WirecloudRemoteTestCase.tearDownClass.__func__(cls)

        # Unmock network requests
        cls.network.unmock_requests()

        # Remove temporal directory
        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

        # deployers
        catalogue.wgt_deployer._root_dir = cls.old_catalogue_deployer
        showcase.wgt_deployer._root_dir = cls.old_deployer

        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        # Restore old haystack configuration
        if not cls.use_search_indexes:
            apps.get_app_config('haystack').signal_processor.setup()
        else:
            if not cls.clear_search_indexes:
                # If self.clear_search_indexes is True, this step is done in a per
                # test basis in the tearDown method
                management.call_command('clear_index', interactive=False, verbosity=0)

            settings.HAYSTACK_CONNECTIONS = cls.old_haystack_conf

        super(WirecloudSeleniumTestCase, cls).tearDownClass()

    def setUp(self):

        haystack.connections.reload('default')
        management.call_command('rebuild_index', interactive=False, verbosity=0)

        from django.core.cache import cache

        restoretree(self.localcatalogue_tmp_dir_backup, self.localcatalogue_tmp_dir)
        restoretree(self.catalogue_tmp_dir_backup, self.catalogue_tmp_dir)
        cache.clear()
        try:
            self.network._servers['http']['example.com'].clear()
        except Exception:
            pass

        LiveServerTestCase.setUp(self)
        WirecloudRemoteTestCase.setUp(self)
        management.call_command('populate', verbosity=0, interactive=False)

    def tearDown(self):

        from django.conf import settings
        if self.clear_search_indexes:
            management.call_command('clear_index', interactive=False, verbosity=0)

            # Reload the connection
            haystack.connections.connections_info = settings.HAYSTACK_CONNECTIONS
            haystack.connections.reload('default')

            time.sleep(0.2)

        LiveServerTestCase.tearDown(self)
        WirecloudRemoteTestCase.tearDown(self)

    def send_basic_event(self, widget, event="hello world!!"):
        with widget:
            field = FieldTester(self, self.driver.find_element_by_css_selector("#send input"))
            field.set_value(event)
            self.driver.find_element_by_css_selector("#send button").click()


DEFAULT_BROWSER_CONF = {
    'Firefox': {
        'CLASS': 'selenium.webdriver.Firefox',
    },
}


def get_configured_browsers():

    from django.conf import settings

    return getattr(settings, 'WIRECLOUD_SELENIUM_TEST_BROWSERS', DEFAULT_BROWSER_CONF)


def wirecloud_selenium_test_case(klass_instance, browsers=None):

    if browsers is None:
        browsers = get_configured_browsers()

    for browser_name in browsers:
        browser = browsers[browser_name]
        tests_class_name = browser_name + klass_instance.__name__

        new_klass = type(
            tests_class_name,
            (klass_instance,),
            {
                '__test__': True,
                '_webdriver_class': browser['CLASS'],
                '_webdriver_args': browser.get('ARGS', None),
            }
        )

        klass_namespace = sys.modules[klass_instance.__module__]

        try:
            setattr(klass_namespace, tests_class_name, new_klass)
        except AttributeError:
            klass_namespace[tests_class_name] = new_klass

    return klass_instance


wirecloud_selenium_test_case.__test__ = False
