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

import errno
import unittest
from unittest.mock import MagicMock, Mock, patch

from django.conf import settings
from django.template import TemplateDoesNotExist
from django.test.utils import override_settings

from wirecloud.platform.themes import ActiveThemeFinder, CORE_THEMES, DEFAULT_THEME, get_active_theme_name, get_available_themes as real_get_available_themes, get_theme_chain, get_theme_metadata, TemplateLoader


class Theme(object):

    def __init__(self, id, **kwargs):
        self.id = id
        self.__file__ = "/fs/%s/__init__.py" % id.replace('.', '/')
        if 'parent' in kwargs:
            self.parent = kwargs['parent']
        if 'label' in kwargs:
            self.label = kwargs['label']

    def __repr__(self):
        return self.id


DEFAULT_THEME_MODULE = Theme(DEFAULT_THEME, parent=None)
CUSTOM_THEME_MODULE = Theme("customtheme")
CUSTOMMOD_THEME_MODULE = Theme("custommodtheme", parent="customtheme", label="My Custom Theme")
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
    elif module == "syntaxerrortheme":
        raise IndentationError('unexpected indent')
    elif module == "nameerrortheme":
        raise NameError("global name 'p' is not defined")
    elif module == "importerrortheme":
        raise ImportError("No module named wirecloud.missing")
    elif module == "missingmodule.themepython27":
        raise ImportError("No module named missingmodule.themepython27")
    elif module == "missingmodule.themepypy":
        raise ImportError("No module named themepypy")
    elif module in CORE_THEMES:
        return Theme(module)
    else:
        raise ImportError("No module named '%s'" % module.split('.', 1)[0])


get_available_themes_mock = Mock(return_value=(DEFAULT_THEME, "customtheme", "custommodtheme", "customroottheme"))


@patch.multiple('wirecloud.platform.themes', import_module=import_module_tester, get_available_themes=get_available_themes_mock)
class ThemesTestCase(unittest.TestCase):

    tags = ('wirecloud-noselenium', 'wirecloud-themes')

    def test_get_theme_metadata(self):
        metadata = get_theme_metadata('custommodtheme')
        self.assertEqual(metadata.name, 'custommodtheme')
        self.assertEqual(metadata.parent, 'customtheme')
        self.assertEqual(metadata.label, 'My Custom Theme')

    def test_get_theme_metadata_default(self):
        metadata = get_theme_metadata(DEFAULT_THEME)
        self.assertEqual(metadata.name, DEFAULT_THEME)
        self.assertIsNone(metadata.parent)

    def test_get_theme_metadata_syntax_error(self):
        self.assertRaisesRegex(ValueError, "Error loading syntaxerrortheme theme: ", get_theme_metadata, 'syntaxerrortheme')

    def test_get_theme_metadata_name_error(self):
        self.assertRaisesRegex(ValueError, "Error loading nameerrortheme theme: ", get_theme_metadata, 'nameerrortheme')

    def test_get_theme_metadata_import_error(self):
        self.assertRaisesRegex(ValueError, "No module named wirecloud.missing$", get_theme_metadata, 'importerrortheme')

    def test_get_theme_metadata_missing_python27(self):
        self.assertRaisesRegex(ValueError, "No module named missingmodule.themepython27$", get_theme_metadata, 'missingmodule.themepython27')

    def test_get_theme_metadata_missing_pypy(self):
        self.assertRaisesRegex(ValueError, "No module named themepypy$", get_theme_metadata, 'missingmodule.themepypy')

    def test_get_theme_metadata_missing(self):
        self.assertRaisesRegex(ValueError, "No module named 'missingmodule'$", get_theme_metadata, 'missingmodule.theme')

    @patch('wirecloud.platform.themes.pkg_resources')
    @override_settings(THEME_ACTIVE=DEFAULT_THEME)
    def test_get_available_themes(self, pkg_resources_mock):
        pkg_resources_mock.iter_entry_points.return_value = ()
        self.assertEqual(real_get_available_themes(), list(CORE_THEMES))

    @patch('wirecloud.platform.themes.get_theme_metadata')
    @patch('wirecloud.platform.themes.pkg_resources')
    @override_settings(THEME_ACTIVE=DEFAULT_THEME)
    def test_get_available_themes_metadata(self, pkg_resources_mock, get_theme_metadata_mock):
        pkg_resources_mock.iter_entry_points.return_value = ()

        result = real_get_available_themes(metadata=True)

        self.assertEqual(len(result), len(CORE_THEMES))
        self.assertEqual(get_theme_metadata_mock.call_count, len(CORE_THEMES))

    @patch('wirecloud.platform.themes.pkg_resources')
    @override_settings(THEME_ACTIVE="customtheme")
    def test_get_available_themes_customtheme(self, pkg_resources_mock):
        pkg_resources_mock.iter_entry_points.return_value = ()
        self.assertEqual(real_get_available_themes(), list(CORE_THEMES) + ["customtheme"])

    @patch('wirecloud.platform.themes.pkg_resources')
    @override_settings(THEME_ACTIVE=DEFAULT_THEME)
    def test_get_available_themes_third_party_themes(self, pkg_resources_mock):
        ep1_mock = Mock()
        ep1_mock.load.return_value = Mock(__name__="thridpartytheme")
        ep2_mock = Mock()
        ep2_mock.load.return_value = Mock(__name__="thridpartytheme2")

        pkg_resources_mock.iter_entry_points.return_value = (ep1_mock, ep2_mock)
        self.assertEqual(real_get_available_themes(), list(CORE_THEMES) + ["thridpartytheme", "thridpartytheme2"])

    @override_settings(THEME_ACTIVE=None)
    def test_get_active_theme_name_default(self):
        # Emulate the user didn't define a THEME_ACTIVE setting
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
