# -*- coding: utf-8 -*-

# Copyright (c) 2008-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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


import os
import codecs
import shutil
import stat
from tempfile import mkdtemp
from urllib2 import URLError, HTTPError
from urlparse import urlparse

try:
    from django.test import LiveServerTestCase
except:
    class LiveServerTestCase(object):
        pass
from django.utils.importlib import import_module
from django.test import TransactionTestCase
from django.test.client import Client
from django.utils import translation

from wirecloud.platform.localcatalogue.utils import install_resource_to_all_users
from wirecloud.platform.widget import utils as showcase
from wirecloud.proxy.tests import FakeDownloader as ProxyFakeDownloader
from wirecloud.proxy.views import WIRECLOUD_PROXY
from wirecloud.catalogue import utils as catalogue
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.remote import WirecloudRemoteTestCase
from wirecloud.commons.utils.wgt import WgtDeployer, WgtFile


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


class FakeDownloader(object):

    def __init__(self):
        self.reset()

    def reset(self):
        self._responses = {}
        self._exceptions = {}

    def set_response(self, url, response):
        self._responses[url] = response

    def set_exception(self, url, exception):
        self._exceptions[url] = exception

    def set_http_error(self, url):
        self.set_exception(url, HTTPError('url', '404', 'Not Found', None, None))

    def set_url_error(self, url):
        self.set_exception(url, URLError('not valid'))

    def __call__(self, *args, **kwargs):
        url = args[0]

        if url in self._exceptions:
            raise self._exceptions[url]

        if url in self._responses:
            return self._responses[url]
        else:
            raise HTTPError('url', '404', 'Not Found', None, None)


class LocalDownloader(object):

    def __init__(self, servers):
        self._servers = servers
        self._client = Client()
        self._live_netloc = None

    def set_live_server(self, host, port):
        self._live_netloc = host + ':' + str(port)

    def __call__(self, url, *args, **kwargs):
        parsed_url = urlparse(url)

        if parsed_url.scheme == 'file':
            f = codecs.open(parsed_url.path, 'rb')
            contents = f.read()
            f.close()
            return contents

        if self._live_netloc is not None and parsed_url.netloc == self._live_netloc:
            return self._client.get(url).content

        if parsed_url.scheme not in self._servers or parsed_url.netloc not in self._servers[parsed_url.scheme]:
            raise URLError('not valid')

        base_path = self._servers[parsed_url.scheme][parsed_url.netloc]
        final_path = os.path.normpath(os.path.join(base_path, parsed_url.path[1:]))

        if final_path.startswith(base_path) and os.path.isfile(final_path):
            f = codecs.open(final_path, 'rb')
            contents = f.read()
            f.close()

            return contents
        else:
            raise HTTPError('url', '404', 'Not Found', None, None)


class WirecloudTestCase(TransactionTestCase):

    @classmethod
    def setUpClass(cls):

        from django.conf import settings

        cls.old_LANGUAGES = settings.LANGUAGES
        cls.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        cls.old_DEFAULT_LANGUAGE = settings.DEFAULT_LANGUAGE
        settings.LANGUAGES = (('en', 'English'),)
        settings.LANGUAGE_CODE = 'en'
        settings.DEFAULT_LANGUAGE = 'en'

        cls.shared_test_data_dir = os.path.join(os.path.dirname(__file__), '../test-data')

        super(WirecloudTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):

        from django.conf import settings

        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        from django.core.cache import cache
        cache.clear()

        super(WirecloudTestCase, cls).tearDownClass()

    def setUp(self):

        from django.core.cache import cache
        cache.clear()


class LocalizedTestCase(TransactionTestCase):

    @classmethod
    def setUpClass(cls):

        from django.conf import settings

        cls.old_LANGUAGES = settings.LANGUAGES
        cls.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        cls.old_DEFAULT_LANGUAGE = settings.DEFAULT_LANGUAGE
        settings.LANGUAGES = (('en', 'English'), ('es', 'Spanish'))

        super(LocalizedTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):

        from django.conf import settings

        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        super(LocalizedTestCase, cls).tearDownClass()

    def setUp(self):
        super(LocalizedTestCase, self).setUp()

        self.changeLanguage('en')

    def changeLanguage(self, new_language):

        from django.conf import settings

        settings.LANGUAGE_CODE = new_language
        settings.DEFAULT_LANGUAGE = new_language
        translation.activate(new_language)


def uses_extra_resources(resources, shared=False):

    def wrap(test_func):

        def wrapper(self, *args, **kwargs):

            if shared:
                base = self.shared_test_data_dir
            else:
                base = self.test_data_dir

            for resource in resources:
                wgt_file = open(os.path.join(base, resource), 'rb')
                wgt = WgtFile(wgt_file)
                resource = install_resource_to_all_users(file_contents=wgt, packaged=True)
                wgt_file.close()

            return test_func(self, *args, **kwargs)

        wrapper.func_name = test_func.func_name
        return wrapper

    return wrap


class WirecloudSeleniumTestCase(LiveServerTestCase, WirecloudRemoteTestCase):

    fixtures = ('initial_data', 'selenium_test_data')
    __test__ = False

    @classmethod
    def setUpClass(cls):

        from django.conf import settings

        WirecloudRemoteTestCase.setUpClass.im_func(cls)

        cls.old_LANGUAGES = settings.LANGUAGES
        cls.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        cls.old_DEFAULT_LANGUAGE = settings.DEFAULT_LANGUAGE
        settings.LANGUAGES = (('en', 'English'),)
        settings.LANGUAGE_CODE = 'en'
        settings.DEFAULT_LANGUAGE = 'en'

        # downloader
        cls._original_download_function = staticmethod(downloader.download_http_content)
        downloader.download_http_content = LocalDownloader(getattr(cls, 'servers', {
            'http': {
                'localhost:8001': os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'test-data', 'src')),
            },
        }))
        cls._original_proxy_do_request_function = WIRECLOUD_PROXY._do_request
        WIRECLOUD_PROXY._do_request = ProxyFakeDownloader()
        WIRECLOUD_PROXY._do_request.set_response('http://example.com/success.html', 'remote makerequest succeded')

        # catalogue deployer
        cls.old_catalogue_deployer = catalogue.wgt_deployer
        cls.catalogue_tmp_dir_backup = mkdtemp()
        cls.catalogue_tmp_dir = mkdtemp()
        catalogue.wgt_deployer = WgtDeployer(cls.catalogue_tmp_dir)

        # showcase deployer
        cls.old_deployer = showcase.wgt_deployer
        cls.localcatalogue_tmp_dir_backup = mkdtemp()
        cls.tmp_dir = mkdtemp()
        showcase.wgt_deployer = WgtDeployer(cls.tmp_dir)

        # deploy resource files
        operator_wgt_file = open(os.path.join(cls.shared_test_data_dir, 'Wirecloud_TestOperator_1.0.zip'), 'rb')
        operator_wgt = WgtFile(operator_wgt_file)
        catalogue.add_widget_from_wgt(operator_wgt_file, None, wgt_file=operator_wgt, deploy_only=True)
        operator_wgt_file.close()

        widget_wgt_file = open(os.path.join(cls.shared_test_data_dir, 'Wirecloud_Test_1.0.wgt'))
        widget_wgt = WgtFile(widget_wgt_file)
        catalogue.add_widget_from_wgt(widget_wgt_file, None, wgt_file=widget_wgt, deploy_only=True)
        showcase.wgt_deployer.deploy(widget_wgt)
        widget_wgt_file.close()

        restoretree(cls.tmp_dir, cls.localcatalogue_tmp_dir_backup)
        restoretree(cls.catalogue_tmp_dir, cls.catalogue_tmp_dir_backup)

        super(WirecloudSeleniumTestCase, cls).setUpClass()

        downloader.download_http_content.set_live_server(cls.server_thread.host, cls.server_thread.port)

    @classmethod
    def tearDownClass(cls):

        from django.conf import settings

        WirecloudRemoteTestCase.tearDownClass.im_func(cls)

        # downloader
        downloader.download_http_content = cls._original_download_function
        WIRECLOUD_PROXY._do_request = cls._original_proxy_do_request_function

        # deployers
        catalogue.wgt_deployer = cls.old_catalogue_deployer
        shutil.rmtree(cls.catalogue_tmp_dir_backup, ignore_errors=True)
        shutil.rmtree(cls.catalogue_tmp_dir, ignore_errors=True)
        showcase.wgt_deployer = cls.old_deployer
        shutil.rmtree(cls.localcatalogue_tmp_dir_backup, ignore_errors=True)
        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        super(WirecloudSeleniumTestCase, cls).tearDownClass()

    def setUp(self):

        from django.core.cache import cache

        restoretree(self.localcatalogue_tmp_dir_backup, self.tmp_dir)
        restoretree(self.catalogue_tmp_dir_backup, self.catalogue_tmp_dir)
        cache.clear()
        super(WirecloudSeleniumTestCase, self).setUp()

DEFAULT_BROWSER_CONF = {
    'Firefox': {
        'CLASS': 'selenium.webdriver.Firefox',
    },
    'GoogleChrome': {
        'CLASS': 'selenium.webdriver.Chrome',
    },
}

def get_configured_browsers():

    from django.conf import settings

    return getattr(settings, 'WIRECLOUD_SELENIUM_BROWSER_COMMANDS', DEFAULT_BROWSER_CONF)

def build_selenium_test_cases(classes, namespace, browsers=None):

    if browsers is None:
        browsers = get_configured_browsers()

    for class_name in classes:
        for browser_name in browsers:
            browser = browsers[browser_name]

            if isinstance(class_name, basestring):
                module_name, klass_name = class_name.rsplit('.', 1)
                tests_class_name = browser_name + klass_name
                module = import_module(module_name)
                klass_instance = getattr(module, klass_name)
            else:
                tests_class_name = browser_name + class_name.__name__
                klass_instance = class_name

            namespace[tests_class_name] = type(
                tests_class_name,
                (klass_instance,),
                {
                    '__test__': True,
                    '_webdriver_class': browser['CLASS'],
                    '_webdriver_args': browser.get('ARGS', None),
                }
            )
build_selenium_test_cases.__test__ = False
