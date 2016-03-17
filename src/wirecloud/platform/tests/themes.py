# -*- coding: utf-8 -*-

# Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import errno
import unittest

from django.conf import settings
from django.template import TemplateDoesNotExist
from django.test.utils import override_settings
from mock import MagicMock, Mock, patch

from wirecloud.platform.themes import ActiveThemeFinder, DEFAULT_THEME, get_active_theme_name, get_theme_chain, TemplateLoader


class Theme(object):

    def __init__(self, id, **kwargs):
        self.id = id
        self.__file__ = "/fs/%s/__init__.py" % id.replace('.', '/')
        if 'parent' in kwargs:
            self.parent = kwargs['parent']

    def __repr__(self):
        return self.id


DEFAULT_THEME_MODULE = Theme(DEFAULT_THEME, parent=None)
CUSTOM_THEME_MODULE = Theme("customtheme")
CUSTOMMOD_THEME_MODULE = Theme("custommodtheme", parent="customtheme")
CUSTOM_ROOT_THEME_MODULE = Theme("customroottheme", parent=None)


def import_module_tester(module):
    if module == DEFAULT_THEME:
        return DEFAULT_THEME_MODULE
    elif module == "customtheme":
        return CUSTOM_THEME_MODULE
    elif module == "custommodtheme":
        return CUSTOMMOD_THEME_MODULE
    elif module == "customroottheme":
        return CUSTOM_ROOT_THEME_MODULE
    else:
        raise ImportError


get_available_themes_mock = Mock(return_value = (DEFAULT_THEME, "customtheme", "custommodtheme", "customroottheme"))


@patch.multiple('wirecloud.platform.themes', import_module=import_module_tester, get_available_themes=get_available_themes_mock)
class ThemesTestCase(unittest.TestCase):

    tags = ('wirecloud-noselenium', 'wirecloud-themes')

    @override_settings(THEME_ACTIVE=None)
    def test_get_active_theme_name_default(self):
        del settings.THEME_ACTIVE
        self.assertEqual(get_active_theme_name(), "wirecloud.defaulttheme")

    @override_settings(THEME_ACTIVE="customtheme")
    def test_get_active_theme_name_custom_value(self):
        self.assertEqual(get_active_theme_name(), "customtheme")

    @override_settings(THEME_ACTIVE=DEFAULT_THEME)
    def test_get_theme_chain_default(self):
        self.assertEqual(get_theme_chain(), [DEFAULT_THEME_MODULE])

    @override_settings(THEME_ACTIVE="customtheme")
    def test_get_theme_chain_basic_default_theme_modification(self):
        self.assertEqual(get_theme_chain(), [CUSTOM_THEME_MODULE, DEFAULT_THEME_MODULE])

    @override_settings(THEME_ACTIVE="customroottheme")
    def test_get_theme_chain_basic_custom_root_theme(self):
        self.assertEqual(get_theme_chain(), [CUSTOM_ROOT_THEME_MODULE])

    @override_settings(THEME_ACTIVE="invalidtheme")
    def test_get_theme_chain_basic_import_error(self):
        self.assertRaises(ValueError, get_theme_chain)

    @override_settings(THEME_ACTIVE="customtheme")
    def test_get_template_sources_basic(self):
        loader = TemplateLoader(Mock())

        expected_paths = ['/fs/customtheme/templates/a.html', '/fs/wirecloud/defaulttheme/templates/a.html']
        self.assertEqual([origin.name for origin in loader.get_template_sources("a.html")], expected_paths)

    @override_settings(THEME_ACTIVE="customtheme")
    def test_get_template_sources_abs_template_name(self):
        loader = TemplateLoader(Mock())

        expected_paths = ['/fs/customtheme/templates/a.html']
        self.assertEqual([origin.name for origin in loader.get_template_sources("/fs/customtheme/templates/a.html")], expected_paths)

    @override_settings(THEME_ACTIVE="customtheme")
    def test_get_template_sources_force_theme(self):
        loader = TemplateLoader(Mock())

        expected_paths = ['/fs/customroottheme/templates/a.html']
        self.assertEqual([origin.name for origin in loader.get_template_sources("customroottheme:a.html")], expected_paths)

    @override_settings(THEME_ACTIVE="customtheme")
    def test_get_template_sources_invalid_theme(self):
        loader = TemplateLoader(Mock())

        expected_paths = []
        self.assertEqual([origin.name for origin in loader.get_template_sources("invalid:a.html")], expected_paths)

    @override_settings(THEME_ACTIVE="customtheme")
    @patch('wirecloud.platform.themes.io.open')
    def test_get_contents(self, open_mock):
        open_mock().__enter__().read.return_value = 'contents'

        loader = TemplateLoader(Mock())
        self.assertEqual(loader.get_contents(Mock()), 'contents')

    @override_settings(THEME_ACTIVE="customtheme")
    @patch('wirecloud.platform.themes.io.open')
    def test_get_contents_ENOENT(self, open_mock):
        open_mock.side_effect = IOError(errno.ENOENT, 'No such file or directory')

        loader = TemplateLoader(Mock())
        self.assertRaises(TemplateDoesNotExist, loader.get_contents, Mock())

    @override_settings(THEME_ACTIVE="customtheme")
    @patch('wirecloud.platform.themes.io.open')
    def test_get_contents_generic_IOError(self, open_mock):
        open_mock.side_effect = IOError(errno.EIO, 'I/O error')

        loader = TemplateLoader(Mock())
        self.assertRaises(IOError, loader.get_contents, Mock())

    @override_settings(THEME_ACTIVE="customtheme")
    @patch('wirecloud.platform.themes.io.open')
    def test_load_template_source_first_source_path(self, open_mock):
        open_mock().__enter__().read.return_value = 'file_content'

        loader = TemplateLoader(Mock())
        self.assertEqual(loader.load_template_source("a.html"), ('file_content', '/fs/customtheme/templates/a.html'))

    @override_settings(THEME_ACTIVE="customtheme")
    @patch('wirecloud.platform.themes.io.open')
    def test_load_template_source_second_source_path(self, open_mock):
        file_mock = MagicMock()
        file_mock.__enter__().read.return_value = "file_content"
        open_mock.side_effect = (IOError(errno.ENOENT, 'No such file or directory'), file_mock)

        loader = TemplateLoader(Mock())
        self.assertEqual(loader.load_template_source("a.html"), ('file_content', '/fs/wirecloud/defaulttheme/templates/a.html'))

    @override_settings(THEME_ACTIVE="customtheme")
    @patch('wirecloud.platform.themes.io.open')
    def test_load_template_source_not_found(self, open_mock):
        open_mock.side_effect = IOError(errno.ENOENT, 'No such file or directory')

        loader = TemplateLoader(Mock())
        self.assertRaises(TemplateDoesNotExist, loader.load_template_source, "a.html")

    @override_settings(THEME_ACTIVE="customtheme")
    @patch('wirecloud.platform.themes.get_available_themes', return_value=[DEFAULT_THEME, 'customtheme'])
    def test_staticfiles_finder_support_missing_static_folder(self, get_available_themes_mock):
        with patch('wirecloud.platform.themes.utils') as utils_mock:
            finder = ActiveThemeFinder()
            self.assertEqual(tuple(finder.list()), ())
            self.assertFalse(utils_mock.get_files.called)
