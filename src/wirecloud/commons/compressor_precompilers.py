# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from itertools import product
import os

from compressor.filters.css_default import CssAbsoluteFilter
from django.contrib.staticfiles import finders

import scss


_SASSCompiler = None


def get_scss_compiler():
    global _SASSCompiler

    if _SASSCompiler is None:

        from django.conf import settings

        _SASSCompiler = DJangoSCSSCompiler(
            scss_opts = {
                'compress': False,
                'debug_info': settings.DEBUG,
            }
        )

    return _SASSCompiler


class DJangoSCSSCompiler(scss.Scss):

    def get_possible_import_paths(self, source_file, path):
        """
        Returns an iterable of possible paths for an import.
        """
        paths = []

        dirname, filename = os.path.split(path)
        name, ext = os.path.splitext(filename)
        if ext:
            search_exts = (ext,)
        else:
            search_exts = ('.scss', '.sass')

        for prefix, suffix in product(('_', ''), search_exts):
            paths.append(os.path.join(dirname, prefix + name + suffix))

        current_module = getattr(source_file, 'module', '')
        if current_module != '':
            for prefix, suffix in product(('_', ''), search_exts):
                paths.append(os.path.join(current_module, dirname, prefix + name + suffix))

        return paths

    def _do_import(self, rule, scope, block):
        """
        Implements @import
        Load and import mixins and functions and rules
        """
        # Protect against going to prohibited places...
        if any(scary_token in block.argument for scary_token in ('..', '://', 'url(')):
            rule.properties.append((block.prop, None))
            return

        full_filename = None
        names = block.argument.split(',')
        for name in names:
            name = scss.util.dequote(name.strip())

            source_file = None
            full_filename, module = self._find_import(rule, name)

            if full_filename is None:
                i_codestr = self._do_magic_import(rule, scope, block)

                if i_codestr is not None:
                    source_file = scss.SourceFile.from_string(i_codestr)

            elif full_filename in self.source_file_index:
                source_file = self.source_file_index[full_filename]

            else:
                with open(full_filename) as f:
                    source = f.read()
                source_file = scss.SourceFile(
                    full_filename,
                    source,
                    parent_dir=os.path.dirname(full_filename),
                )
                source_file.module = module

                self.source_files.append(source_file)
                self.source_file_index[full_filename] = source_file

            if source_file is None:
                scss.log.warn("File to import not found or unreadable: '%s' (%s)", name, rule.file_and_line)
                continue

            import_key = (name, source_file.parent_dir)
            if rule.namespace.has_import(import_key):
                # If already imported in this scope, skip
                continue

            _rule = scss.SassRule(
                source_file=source_file,
                lineno=block.lineno,
                import_key=import_key,
                unparsed_contents=source_file.contents,

                # rule
                options=rule.options,
                properties=rule.properties,
                extends_selectors=rule.extends_selectors,
                ancestry=rule.ancestry,
                namespace=rule.namespace,
            )
            rule.namespace.add_import(import_key, rule.import_key, rule.file_and_line)
            self.manage_children(_rule, scope)



    def _find_import(self, rule, filename, **kwargs):
        paths = self.get_possible_import_paths(rule.source_file, filename)

        scss.log.debug('Searching for %s in %s', filename, paths)
        for name in paths:
            result = finders.find(os.path.join('css', name))

            if result is not None:
                return result, os.path.dirname(name)

        return None, None


class SCSSPrecompiler(object):

    def __init__(self, content, attrs, filter_type=None, filename=None, charset=None):
        self.filename = filename
        self.content = content

    def input(self, filename=None, basename=None, **kwargs):

        content = get_scss_compiler().compile(scss_string=self.content, filename=self.filename)
        return CssAbsoluteFilter(content).input(filename, basename, **kwargs)
