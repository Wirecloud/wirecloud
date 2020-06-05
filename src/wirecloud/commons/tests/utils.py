# -*- coding: utf-8 -*-

# Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from io import BytesIO
import os
from unittest.mock import DEFAULT, patch, Mock, ANY
import zipfile

import django
from django.http import Http404, UnreadablePostError
from django.test import TestCase
from django.test.utils import override_settings

from wirecloud.commons.exceptions import ErrorResponse
from wirecloud.commons.utils.html import clean_html, filter_changelog
from wirecloud.commons.utils.http import build_downloadfile_response, build_sendfile_response, get_absolute_static_url, get_current_domain, get_current_scheme, get_content_type, normalize_boolean_param, produces, validate_url_param
from wirecloud.commons.utils.log import SkipUnreadablePosts
from wirecloud.commons.utils.mimeparser import best_match, InvalidMimeType, parse_mime_type
from wirecloud.commons.utils.version import Version
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.core.plugins import get_version_hash


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


class HTMLCleanupTestCase(TestCase):

    tags = ('wirecloud-utils', 'wirecloud-html-cleanup', 'wirecloud-noselenium')

    def test_scripts_are_removed(self):
        self.assertEqual(clean_html('<script>asdfas</script>'), '')
        self.assertEqual(clean_html('start content <script>asdfas</script> valid content'), 'start content  valid content')

    def test_event_attributes_are_removed(self):
        self.assertEqual(clean_html('<div onclick="evil_script();" class="alert">content</div>'), '<div class="alert">content</div>')

    def test_processing_instructions_are_removed(self):
        self.assertEqual(clean_html('<div class="alert"><?php echo "<p>Hello World</p>"; ?>content</div>'), '<div class="alert">content</div>')

    def test_audio_elements_are_removed(self):
        initial_code = '<div class="alert"><audio controls="controls"><source src="sound.ogg" type="audio/ogg"/><source src="sound.mp3" type="audio/mpeg"/>Your browser does not support the audio tag.</audio>content</div>'
        self.assertEqual(clean_html(initial_code), '<div class="alert">content</div>')

    def test_video_elements_need_controls(self):
        initial_code = '<video><source src="movie.mp4" type="video/mp4"/><source src="movie.ogg" type="video/ogg"/>Your browser does not support the video tag.</video>content'
        expected_code = '<video controls="controls"><source src="movie.mp4" type="video/mp4"/><source src="movie.ogg" type="video/ogg"/>Your browser does not support the video tag.</video>content'
        self.assertEqual(clean_html(initial_code), expected_code)

    def test_links_are_forced_to_target_blank(self):
        self.assertEqual(clean_html('<div class="alert">Follow this <a href="http://example.com">link</a></div>'), '<div class="alert">Follow this <a href="http://example.com" target="_blank">link</a></div>')

    def test_relative_links_are_removed(self):
        initial_code = '<div class="alert">Follow this <a href="files/insecure_content.exe">link</a></div>'
        expected_code = '<div class="alert">Follow this link</div>'
        self.assertEqual(clean_html(initial_code), expected_code)

    def test_relative_image_urls(self):
        initial_code = 'Example image: <img src="images/example.png"/>'
        expected_code = 'Example image: <img src="http://example.com/images/example.png"/>'
        self.assertEqual(clean_html(initial_code, base_url='http://example.com'), expected_code)

    def test_filter_changelog(self):
        initial_code = '<h1>1.0.2</h1><p>1.0.2 change list</p><h1>1.0.1</h1><p>1.0.1 change list</p><h1>1.0.0</h1><p>Initial release</p>'
        expected_code = '<h1>1.0.2</h1><p>1.0.2 change list</p>'
        self.assertEqual(filter_changelog(initial_code, Version('1.0.1')), expected_code)

    def test_filter_changelog_headers_with_extra_content(self):
        initial_code = '<h1>1.0.2 (2015-05-01)</h1><p>1.0.2 change list</p><h1>1.0.1 (2015-04-01)</h1><p>1.0.1 change list</p><h1>1.0.0 (2015-03-01)</h1><p>Initial release</p>'
        expected_code = '<h1>1.0.2 (2015-05-01)</h1><p>1.0.2 change list</p>'
        self.assertEqual(filter_changelog(initial_code, Version('1.0.1')), expected_code)

    def test_filter_changelog_version_not_found(self):
        initial_code = '<h1>1.0.2</h1><p>1.0.2 change list</p><h1>1.0.1</h1><p>1.0.1 change list</p><h1>1.0.0</h1><p>Initial release</p>'
        expected_code = initial_code
        self.assertEqual(filter_changelog(initial_code, Version('0.9.0')), expected_code)

    def test_filter_changelog_not_exact_version(self):
        # Filter html, exact version not found, but there is a lower version.
        initial_code = '<h1>1.0.2</h1><p>1.0.2 change list</p><h1>1.0.1</h1><p>1.0.1 change list</p><h1>1.0.0</h1><p>Initial release</p>'
        expected_code = '<h1>1.0.2</h1><p>1.0.2 change list</p><h1>1.0.1</h1><p>1.0.1 change list</p>'
        self.assertEqual(filter_changelog(initial_code, Version('1.0.0.1')), expected_code)

    def test_filter_changelog_no_changes(self):
        # Filter html, exact version not found, but there is a lower version.
        initial_code = '<h1>1.0.2</h1><p>1.0.2 change list</p><h1>1.0.1</h1><p>1.0.1 change list</p><h1>1.0.0</h1><p>Initial release</p>'
        expected_code = ''
        self.assertEqual(filter_changelog(initial_code, Version('1.0.3')), expected_code)

    def test_filter_changelog_no_changes_v(self):
        # Filter html, exact version found, but there are no change info before
        initial_code = '<h2>v1.0.2</h2> tail <p>v1.0.2 change list</p><h2>v1.0.1</h2><p>v1.0.1 change list</p><h2>v1.0.0</h2><p>Initial release</p> tail'
        expected_code = ''
        self.assertEqual(filter_changelog(initial_code, Version('1.0.2')), expected_code)

    def test_filter_changelog_nested(self):
        # Filter html, exact version found, there is extra info before that must be discarded
        initial_code = '<h1>My Widgets changes</h1> my intro<h2>v1.0.2</h2><p>v1.0.2 change list</p><h2>v1.0.1</h2><p>v1.0.1 change list</p><h2>v1.0.0</h2><p>Initial release</p>'
        expected_code = '<h2>v1.0.2</h2><p>v1.0.2 change list</p>'
        self.assertEqual(filter_changelog(initial_code, Version('1.0.1')), expected_code)

    def test_filter_changelog_mixed(self):
        # Filter html, there are mixed sections between version sections
        initial_code = '<h2>v1.0.2</h2><p>v1.0.2 change list</p><h2>Extra header</h2><p>my extra info</p><h2>v1.0.1</h2><p>v1.0.1 change list</p><h2>v1.0.0</h2><p>Initial release</p>'
        expected_code = '<h2>v1.0.2</h2><p>v1.0.2 change list</p><h2>Extra header</h2><p>my extra info</p>'
        self.assertEqual(filter_changelog(initial_code, Version('1.0.1')), expected_code)

    def test_filter_changelog_headers_with_extra_content_v(self):
        initial_code = '<h1>v1.0.2 (2015-05-01)</h1><p>v1.0.2 change list</p><h1>v1.0.1 (2015-04-01)</h1><p>v1.0.1 change list</p><h1>v1.0.0 (2015-03-01)</h1><p>Initial release</p>'
        expected_code = '<h1>v1.0.2 (2015-05-01)</h1><p>v1.0.2 change list</p>'
        self.assertEqual(filter_changelog(initial_code, Version('1.0.1')), expected_code)

    def test_filter_changelog_not_exact_version_v(self):
        # Filter html, exact version not found, but there is a lower version.
        initial_code = '<h1>v1.0.2</h1><p>v1.0.2 change list</p><h1>v1.0.1</h1><p>v1.0.1 change list</p><h1>v1.0.0</h1><p>Initial release</p>'
        expected_code = '<h1>v1.0.2</h1><p>v1.0.2 change list</p><h1>v1.0.1</h1><p>v1.0.1 change list</p>'
        self.assertEqual(filter_changelog(initial_code, Version('1.0.0.1')), expected_code)


class GeneralUtilsTestCase(TestCase):

    tags = ('wirecloud-utils', 'wirecloud-general-utils', 'wirecloud-noselenium')

    def test_skipunreadableposts_filter(self):

        record = Mock()
        record.exc_info = (None, UnreadablePostError())
        filter = SkipUnreadablePosts()
        self.assertFalse(filter.filter(record))

    def test_skipunreadableposts_filter_should_ignore_general_exceptions(self):

        record = Mock()
        record.exc_info = (None, Exception())
        filter = SkipUnreadablePosts()
        self.assertTrue(filter.filter(record))

    def test_skipunreadableposts_filter_should_ignore_records_without_exc_info(self):

        record = Mock()
        record.exc_info = None
        filter = SkipUnreadablePosts()
        self.assertTrue(filter.filter(record))

    def test_mimeparser_parse_mime_type(self):

        self.assertEqual(parse_mime_type('application/xhtml;q=0.5'), ('application/xhtml', {'q': '0.5'}))

    def test_mimeparser_parse_mime_type_should_accept_single_wildcard(self):

        self.assertEqual(parse_mime_type('*;q=0.5'), ('*/*', {'q': '0.5'}))

    def test_mimeparser_parse_mime_type_split_type(self):

        self.assertEqual(parse_mime_type('application/xhtml;q=0.5', split_type=True), ('application', 'xhtml', {'q': '0.5'}))

    def test_mimeparser_parse_mime_type_invalid_too_few_slashes(self):

        self.assertRaises(InvalidMimeType, parse_mime_type, 'application;q=0.5')

    def test_mimeparser_parse_mime_type_invalid_too_many_slashes(self):

        self.assertRaises(InvalidMimeType, parse_mime_type, 'application/xhtml/x;q=0.5')

    def test_mimeparser_best_match_should_ignore_blank_media_ranges(self):

        self.assertEqual(best_match(['application/xbel+xml', 'text/xml'], 'text/*;q=0.5, , */*; q=0.1'), 'text/xml')

    def test_mimeparser_best_match_should_ignore_blank_media_ranges_params(self):

        self.assertEqual(best_match(['application/xbel+xml; a=1; b=2', 'application/xml'], 'application/*, application/xbel+xml; a=1; b=2'), 'application/xbel+xml; a=1; b=2')

    def test_mimeparser_best_match_should_ignore_invalid_mime_types(self):

        self.assertEqual(best_match(['application/xbel+xml', 'text/xml'], 'text/*;q=0.5, application, application/xbel+xml/2, */*; q=0.1'), 'text/xml')

    def test_version_order(self):

        self.assertLess(Version('1.0'), Version('1.11a1'))
        self.assertLess(Version('1.11a1'), Version('1.11a2'))
        self.assertLess(Version('1.11a2'), Version('1.11b1'))
        self.assertLess(Version('1.11b1'), Version('1.11rc1'))
        self.assertLess(Version('1.11rc1'), Version('1.11'))
        self.assertLess(Version('1.11'), Version('1.11.5.1'))
        self.assertLess(Version('1.11.5.1'), Version('1.11.5.4'))
        self.assertLess(Version('1.11.5.4'), Version('1.100'))
        self.assertLess(Version('1.0.0-dev'), Version("1.0.1-dev"))
        self.assertLess(Version('1.0.0-dev'), Version("1.0.0"))

        self.assertGreater(Version('1.0'), Version('1.0a1'))
        self.assertGreater(Version('1.0', reverse=True), Version('1.11a1', reverse=True))
        self.assertGreater(Version('1.11b1', reverse=True), Version('1.11rc1', reverse=True))
        self.assertGreater(Version('1.0.0'), Version("1.0.0-dev"))

        self.assertEqual(Version('1'), '1.0.0')
        self.assertEqual(Version('1.0'), '1.0.0')
        self.assertEqual(Version('1.0'), Version('1.0.0'))
        self.assertEqual(Version('1.0', reverse=True), Version('1.0.0', reverse=True))

    def test_version_ge(self):
        self.assertGreaterEqual(Version('1'), '1.0.0')
        self.assertGreaterEqual(Version('1'), Version('1.0.0'))
        self.assertGreaterEqual(Version('1'), '0.9')
        self.assertGreaterEqual(Version('1'), Version('0.9'))

        self.assertFalse(Version('1') >= '1.1')
        self.assertFalse(Version('1') >= Version('1.1'))

    def test_version_le(self):
        self.assertLessEqual(Version('1'), '1')
        self.assertLessEqual(Version('1'), '1.0.0')
        self.assertLessEqual(Version('1'), Version('1.0.0'))
        self.assertLessEqual(Version('1'), '1.1')
        self.assertLessEqual(Version('1'), Version('1.1'))

        self.assertFalse(Version('1') <= '0.9')
        self.assertFalse(Version('1') <= Version('0.9'))

    def test_version_ne(self):
        self.assertNotEqual(Version('1'), '1.1')
        self.assertNotEqual(Version('1'), Version('1.1'))
        self.assertNotEqual(Version('1'), '0.9')
        self.assertNotEqual(Version('1'), Version('0.9'))
        self.assertNotEqual(Version('1.0.0'), Version('1.0.0-dev'))

        self.assertFalse(Version('1') != '1.0')
        self.assertFalse(Version('1') != Version('1'))

    def test_version_invalid_values(self):

        self.assertRaises(ValueError, Version, '-0')
        self.assertRaises(ValueError, Version, '0.a')
        self.assertRaises(ValueError, Version('1.0').__eq__, None)
        self.assertRaises(ValueError, Version('1.0').__eq__, 5)
        self.assertRaises(ValueError, Version('1.0').__eq__, {})


class WGTTestCase(TestCase):

    tags = ('wirecloud-utils', 'wirecloud-wgt', 'wirecloud-noselenium')

    def build_simple_wgt(self, other_files=()):

        f = BytesIO()
        zf = zipfile.ZipFile(f, 'w')
        zf.writestr('config.xml', b'')
        zf.writestr('test.html', b'')
        for of in other_files:
            zf.writestr(of, b'')
        zf.close()
        return WgtFile(f)

    def test_extract_inexistent_dir(self):

        with patch('wirecloud.commons.utils.wgt.os', autospec=True) as os_mock:
            with patch('wirecloud.commons.utils.wgt.open', create=True) as open_mock:
                os_mock.path.normpath = os.path.normpath
                wgt_file = self.build_simple_wgt()
                self.assertRaises(KeyError, wgt_file.extract_dir, 'doc', '/tmp/test')
                self.assertEqual(os_mock.makedirs.call_count, 0)
                self.assertEqual(os_mock.mkdir.call_count, 0)
                self.assertEqual(open_mock.call_count, 0)

    def test_extract_empty_dir(self):

        with patch('wirecloud.commons.utils.wgt.os', autospec=True) as os_mock:
            with patch('wirecloud.commons.utils.wgt.open', create=True) as open_mock:
                os_mock.path.normpath = os.path.normpath
                os_mock.path.exists.return_value = False
                wgt_file = self.build_simple_wgt(other_files=('doc/',))
                wgt_file.extract_dir('doc', '/tmp/test')

                self.assertEqual(os_mock.makedirs.call_count, 1)
                self.assertEqual(os_mock.mkdir.call_count, 0)
                self.assertEqual(open_mock.call_count, 0)

    def test_extract_empty_dir_existing_output_dir(self):

        with patch('wirecloud.commons.utils.wgt.os', autospec=True) as os_mock:
            with patch('wirecloud.commons.utils.wgt.open', create=True) as open_mock:
                os_mock.path.normpath = os.path.normpath
                os_mock.path.exists.return_value = True
                wgt_file = self.build_simple_wgt(other_files=('doc/',))
                wgt_file.extract_dir('doc', '/tmp/test')

                self.assertEqual(os_mock.makedirs.call_count, 0)
                self.assertEqual(open_mock.call_count, 0)

    def test_extract_dir(self):

        def exists_side_effect(path):
            if path != '/tmp/test/folder1':
                return False
            else:
                result = not exists_side_effect.first_time
                exists_side_effect.first_time = False
                return result
        exists_side_effect.first_time = True

        with patch('wirecloud.commons.utils.wgt.os', autospec=True) as os_mock:
            with patch('wirecloud.commons.utils.wgt.open', create=True) as open_mock:

                os_mock.path.normpath = os.path.normpath
                os_mock.path.exists.side_effect = exists_side_effect
                os_mock.sep = '/'
                wgt_file = self.build_simple_wgt(other_files=('doc/folder1/', 'doc/folder1/file1', 'doc/folder1/file2', 'doc/folder2/folder3/file3'))
                wgt_file.extract_dir('doc/', '/tmp/test')

                self.assertEqual(os_mock.makedirs.call_count, 1)
                self.assertEqual(os_mock.mkdir.call_count, 3)
                self.assertEqual(open_mock.call_count, 3)

    def test_extract(self):

        with patch('wirecloud.commons.utils.wgt.os', autospec=True) as os_mock:
            with patch('wirecloud.commons.utils.wgt.open', create=True) as open_mock:
                os_mock.path.normpath = os.path.normpath
                os_mock.path.exists.return_value = False
                os_mock.sep = '/'
                wgt_file = self.build_simple_wgt(other_files=('folder1/', 'folder2/'))
                wgt_file.extract('/tmp/test')
                self.assertEqual(os_mock.mkdir.call_count, 3)
                self.assertEqual(open_mock.call_count, 2)

    def test_extract_inexistent_file(self):

        with patch('wirecloud.commons.utils.wgt.os', autospec=True) as os_mock:
            with patch('wirecloud.commons.utils.wgt.open', create=True) as open_mock:
                os_mock.path.normpath = os.path.normpath
                wgt_file = self.build_simple_wgt()
                self.assertRaises(KeyError, wgt_file.extract_file, 'doc/index.md', '/tmp/test')
                self.assertEqual(os_mock.makedirs.call_count, 0)
                self.assertEqual(os_mock.mkdir.call_count, 0)
                self.assertEqual(open_mock.call_count, 0)

    def test_invalid_file(self):

        with self.assertRaises(ValueError):
            self.build_simple_wgt(other_files=('../../invalid1.html',))

        with self.assertRaises(ValueError):
            self.build_simple_wgt(other_files=('folder1/../../invalid2.html',))

        with self.assertRaises(ValueError):
            self.build_simple_wgt(other_files=('/invalid3.html',))

    @patch('wirecloud.commons.utils.wgt.open', create=True)
    def test_update_config_using_string_content(self, open_mock):
        wgt_file = self.build_simple_wgt()
        old_file = wgt_file.get_underlying_file()
        new_contents = 'new config.xml contents á'
        with patch('wirecloud.commons.utils.wgt.zipfile.ZipFile.writestr', autospec=True) as zip_write_mock:
            wgt_file.update_config(new_contents)
            self.assertNotEqual(wgt_file.get_underlying_file(), old_file)
            zip_write_mock.assert_any_call(ANY, ANY, new_contents.encode('utf-8'))

    @patch('wirecloud.commons.utils.wgt.open', create=True)
    def test_update_config_using_bytes_content(self, open_mock):
        wgt_file = self.build_simple_wgt()
        old_file = wgt_file.get_underlying_file()
        new_contents = 'new config.xml contents á'.encode('utf-8')
        with patch('wirecloud.commons.utils.wgt.zipfile.ZipFile.writestr', autospec=True) as zip_write_mock:
            wgt_file.update_config(new_contents)
            self.assertNotEqual(wgt_file.get_underlying_file(), old_file)
            zip_write_mock.assert_any_call(ANY, ANY, new_contents)


class HTTPUtilsTestCase(TestCase):

    tags = ('wirecloud-utils', 'wirecloud-general-utils', 'wirecloud-http-utils', 'wirecloud-noselenium')

    def _prepare_request_mock(self):

        request = Mock()
        request.get_host.return_value = 'example.com'
        request.META = {
            'HTTP_ACCEPT': 'application/json',
            'SERVER_PROTOCOL': 'http',
            'SERVER_PORT': '80',
            'REMOTE_ADDR': '127.0.0.1',
            'HTTP_HOST': 'localhost',
        }

        return request

    def _prepare_site_mock(self):

        site = Mock()
        site.domain = 'site.example.com:8000'

        return site

    def test_build_sendfile_response(self):

        with patch('wirecloud.commons.utils.http.os.path.isfile', return_value=True):
            response = build_sendfile_response('file.js', '/folder')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response['X-Sendfile'], '/folder/file.js')

    def test_build_sendfile_response_remove_extra_path_separators(self):

        with patch('wirecloud.commons.utils.http.os.path.isfile', return_value=True) as isfile_mock:
            response = build_sendfile_response('js///file.js', '/folder')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response['X-Sendfile'], '/folder/js/file.js')
            isfile_mock.assert_called_once_with('/folder/js/file.js')

    def test_build_sendfile_response_not_found(self):

        with patch('wirecloud.commons.utils.http.os.path.isfile', return_value=False):
            self.assertRaises(Http404, build_sendfile_response, 'js/notfound.js', '/folder')

    def test_build_sendfile_response_redirect_on_invalid_path(self):

        response = build_sendfile_response('../a/../file.js', '/folder')
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response['Location'], 'file.js')

    @override_settings(USE_XSENDFILE=False)
    def test_build_downloadfile_response(self):

        request = self._prepare_request_mock()
        with patch('django.views.static.serve') as serve_mock:
            response = build_downloadfile_response(request, 'manage.py', '/')
            self.assertNotEqual(response, None)
            serve_mock.assert_called_once_with(request, 'manage.py', document_root='/')

    @override_settings(USE_XSENDFILE=True)
    def test_build_downloadfile_response_sendfile(self):

        request = self._prepare_request_mock()
        with patch('wirecloud.commons.utils.http.build_sendfile_response') as serve_mock:
            response = build_downloadfile_response(request, 'manage.py', '/')
            self.assertNotEqual(response, None)
            serve_mock.assert_called_once_with('manage.py', '/')

    def test_normalize_boolean_param_string(self):

        request = self._prepare_request_mock()
        normalize_boolean_param(request, 'param', 'true')

    def test_normalize_boolean_param_boolean(self):

        request = self._prepare_request_mock()
        normalize_boolean_param(request, 'param', True)

    def test_normalize_boolean_param_number(self):

        request = self._prepare_request_mock()
        try:
            normalize_boolean_param(request, 'param', 5)
            self.fail('ErrorResponse not raised by normalize_boolean_param')
        except ErrorResponse as e:
            self.assertEqual(e.response.status_code, 422)

    def test_normalize_boolean_param_invalid_string(self):

        request = self._prepare_request_mock()
        try:
            normalize_boolean_param(request, 'param', 'invalid')
            self.fail('ErrorResponse not raised by normalize_boolean_param')
        except ErrorResponse as e:
            self.assertEqual(e.response.status_code, 422)

    def test_validate_url_param_string(self):

        request = self._prepare_request_mock()
        validate_url_param(request, 'param', 'index.html', force_absolute=False)

    def test_validate_url_param_string_empty_and_required(self):

        request = self._prepare_request_mock()
        try:
            validate_url_param(request, 'param', '', force_absolute=False, required=True)
            self.fail('ErrorResponse not raised by validate_url_param')
        except ErrorResponse as e:
            self.assertEqual(e.response.status_code, 422)

    def test_validate_url_param_string_force_absolute(self):

        request = self._prepare_request_mock()
        validate_url_param(request, 'param', 'http://example.com/index.html', force_absolute=True)

    def test_validate_url_param_string_invalid_schema(self):

        request = self._prepare_request_mock()
        try:
            validate_url_param(request, 'param', 'file:///etc/password', force_absolute=False)
            self.fail('ErrorResponse not raised by validate_url_param')
        except ErrorResponse as e:
            self.assertEqual(e.response.status_code, 422)

    def test_validate_url_param_string_relative_urls_not_allowed(self):
        request = self._prepare_request_mock()
        try:
            validate_url_param(request, 'param', 'index.html', force_absolute=True)
            self.fail('ErrorResponse not raised by validate_url_param')
        except ErrorResponse as e:
            self.assertEqual(e.response.status_code, 422)

    def test_validate_url_param_none_and_required(self):
        request = self._prepare_request_mock()
        try:
            validate_url_param(request, 'param', None, force_absolute=False, required=True)
            self.fail('ErrorResponse not raised by validate_url_param')
        except ErrorResponse as e:
            self.assertEqual(e.response.status_code, 422)

    def test_validate_url_param_number(self):
        request = self._prepare_request_mock()
        try:
            validate_url_param(request, 'param', 5, force_absolute=False)
            self.fail('ErrorResponse not raised by validate_url_param')
        except ErrorResponse as e:
            self.assertEqual(e.response.status_code, 422)

    def test_produces_decorator_supported_accept_header(self):
        func = Mock()
        wrapped_func = produces(('application/json',))(func)

        request = self._prepare_request_mock()
        wrapped_func(Mock(), request)

        self.assertEqual(func.call_count, 1)

    def test_produces_decorator_unsupported_accept_header(self):
        func = Mock()
        wrapped_func = produces(('application/xml',))(func)

        request = self._prepare_request_mock()
        result = wrapped_func(Mock(), request)

        self.assertEqual(func.call_count, 0)
        self.assertEqual(result.status_code, 406)

    def test_get_content_type(self):
        request = self._prepare_request_mock()
        request.META['CONTENT_TYPE'] = 'application/json'
        self.assertEqual(get_content_type(request), ('application/json', {}))

    def test_get_content_type_no_provided(self):
        request = self._prepare_request_mock()
        self.assertEqual(get_content_type(request), ('', {}))

    def test_get_content_type_invalid_mime_type(self):
        request = self._prepare_request_mock()
        request.META['CONTENT_TYPE'] = 'application/json/ji'
        self.assertEqual(get_content_type(request), ('', {}))

    @override_settings(STATIC_URL="/static/")
    @patch("wirecloud.commons.utils.http.get_current_scheme")
    @patch("wirecloud.commons.utils.http.get_current_domain")
    def test_get_absolute_static_url_unversioned(self, get_current_domain, get_current_scheme):
        request = self._prepare_request_mock()
        get_current_scheme.return_value = "http"
        get_current_domain.return_value = "dashboards.example.org"

        self.assertEqual(get_absolute_static_url("/path", request=request), 'http://dashboards.example.org/path')

        get_current_scheme.assert_called_once_with(request)
        get_current_domain.assert_called_once_with(request)

    @override_settings(STATIC_URL="/static/")
    @patch("wirecloud.commons.utils.http.get_current_scheme")
    @patch("wirecloud.commons.utils.http.get_current_domain")
    def test_get_absolute_static_url_versioned(self, get_current_domain, get_current_scheme):
        request = self._prepare_request_mock()
        get_current_scheme.return_value = "http"
        get_current_domain.return_value = "dashboards.example.org"
        self.assertEqual(get_absolute_static_url("/path", request=request, versioned=True), 'http://dashboards.example.org/path?v=' + get_version_hash())

        get_current_scheme.assert_called_once_with(request)
        get_current_domain.assert_called_once_with(request)

    @override_settings(FORCE_PROTO=None)
    def test_get_current_scheme_http(self):
        request = self._prepare_request_mock()
        request.is_secure.return_value = False
        self.assertEqual(get_current_scheme(request), 'http')

    @override_settings(FORCE_PROTO=None)
    def test_get_current_scheme_https(self):
        request = self._prepare_request_mock()
        request.is_secure.return_value = True
        self.assertEqual(get_current_scheme(request), 'https')

    @override_settings(FORCE_PROTO='https')
    def test_get_current_scheme_forced_https(self):
        request = self._prepare_request_mock()
        request.is_secure.return_value = False
        self.assertEqual(get_current_scheme(request), 'https')

    @override_settings(FORCE_PROTO='http')
    def test_get_current_scheme_forced_http(self):
        request = self._prepare_request_mock()
        request.is_secure.return_value = True
        self.assertEqual(get_current_scheme(request), 'http')

    @override_settings(FORCE_PROTO=None)
    def test_get_current_scheme_fallback(self):
        self.assertEqual(get_current_scheme(None), 'http')

    @override_settings(FORCE_PROTO=None, FORCE_DOMAIN=None, FORCE_PORT=None)
    def test_get_current_domain(self):
        request = self._prepare_request_mock()
        with patch('django.contrib.sites.shortcuts.get_current_site') as get_current_site_mock:
            with patch.multiple('wirecloud.commons.utils.http', socket=DEFAULT, get_current_scheme=DEFAULT, _servername=None) as mocks:
                get_current_site_mock.return_value = self._prepare_site_mock()
                mocks['get_current_scheme'].return_value = 'http'
                self.assertEqual(get_current_domain(request), 'site.example.com:8000')
                self.assertEqual(mocks['socket'].getfqdn.call_count, 0)

    @override_settings(FORCE_PROTO=None, FORCE_DOMAIN='myserver.com', FORCE_PORT=8080)
    def test_get_current_domain_forced(self):
        request = self._prepare_request_mock()
        with patch('django.contrib.sites.shortcuts.get_current_site') as get_current_site_mock:
            with patch.multiple('wirecloud.commons.utils.http', socket=DEFAULT, get_current_scheme=DEFAULT, _servername=None) as mocks:
                mocks['get_current_scheme'].return_value = 'http'
                self.assertEqual(get_current_domain(request), 'myserver.com:8080')
                self.assertEqual(mocks['socket'].getfqdn.call_count, 0)
                self.assertEqual(get_current_site_mock.call_count, 0)

    @override_settings(FORCE_PROTO=None, FORCE_DOMAIN='forced.example.com', FORCE_PORT=8000)
    def test_get_current_domain_forced_domain(self):
        request = self._prepare_request_mock()
        with patch('django.contrib.sites.shortcuts.get_current_site') as get_current_site_mock:
            with patch.multiple('wirecloud.commons.utils.http', socket=DEFAULT, get_current_scheme=DEFAULT, _servername=None) as mocks:
                get_current_site_mock.return_value = self._prepare_site_mock()
                mocks['get_current_scheme'].return_value = 'http'
                self.assertEqual(get_current_domain(request), 'forced.example.com:8000')
                self.assertEqual(mocks['socket'].getfqdn.call_count, 0)

    @override_settings(FORCE_PROTO=None, FORCE_DOMAIN=None, FORCE_PORT=81)
    def test_get_current_domain_forced_port(self):
        request = self._prepare_request_mock()
        with patch('django.contrib.sites.shortcuts.get_current_site') as get_current_site_mock:
            with patch.multiple('wirecloud.commons.utils.http', socket=DEFAULT, get_current_scheme=DEFAULT, _servername=None) as mocks:
                get_current_site_mock.return_value = self._prepare_site_mock()
                mocks['get_current_scheme'].return_value = 'http'
                self.assertEqual(get_current_domain(request), 'site.example.com:81')
                self.assertEqual(mocks['socket'].getfqdn.call_count, 0)

    @override_settings(FORCE_PROTO=None, FORCE_DOMAIN=None, FORCE_PORT=80)
    def test_get_current_domain_fallback_http(self):
        request = self._prepare_request_mock()
        with patch('django.contrib.sites.shortcuts.get_current_site') as get_current_site_mock:
            with patch.multiple('wirecloud.commons.utils.http', socket=DEFAULT, get_current_scheme=DEFAULT, _servername=None) as mocks:
                get_current_site_mock.side_effect = Exception
                mocks['socket'].getfqdn.return_value = 'fqdn.example.com'
                mocks['get_current_scheme'].return_value = 'http'
                self.assertEqual(get_current_domain(request), 'fqdn.example.com')

    @override_settings(FORCE_PROTO=None, FORCE_DOMAIN=None, FORCE_PORT=81)
    def test_get_current_domain_fallback_http_custom_port(self):
        request = self._prepare_request_mock()
        with patch('django.contrib.sites.shortcuts.get_current_site') as get_current_site_mock:
            with patch.multiple('wirecloud.commons.utils.http', socket=DEFAULT, get_current_scheme=DEFAULT, _servername=None) as mocks:
                get_current_site_mock.side_effect = Exception
                mocks['socket'].getfqdn.return_value = 'fqdn.example.com'
                mocks['get_current_scheme'].return_value = 'http'
                self.assertEqual(get_current_domain(request), 'fqdn.example.com:81')

    @override_settings(FORCE_DOMAIN=None, FORCE_PORT=443)
    def test_get_current_domain_fallback_https(self):
        request = self._prepare_request_mock()
        with patch('django.contrib.sites.shortcuts.get_current_site') as get_current_site_mock:
            with patch.multiple('wirecloud.commons.utils.http', socket=DEFAULT, get_current_scheme=DEFAULT, _servername=None) as mocks:
                get_current_site_mock.side_effect = Exception
                mocks['socket'].getfqdn.return_value = 'fqdn.example.com'
                mocks['get_current_scheme'].return_value = 'https'
                self.assertEqual(get_current_domain(request), 'fqdn.example.com')

    @override_settings(FORCE_DOMAIN=None, FORCE_PORT=8443)
    def test_get_current_domain_fallback_https_custom_port(self):
        request = self._prepare_request_mock()
        with patch('django.contrib.sites.shortcuts.get_current_site') as get_current_site_mock:
            with patch.multiple('wirecloud.commons.utils.http', socket=DEFAULT, get_current_scheme=DEFAULT, _servername=None) as mocks:
                get_current_site_mock.side_effect = Exception
                mocks['socket'].getfqdn.return_value = 'example.com'
                mocks['get_current_scheme'].return_value = 'http'
                self.assertEqual(get_current_domain(request), 'example.com:8443')
