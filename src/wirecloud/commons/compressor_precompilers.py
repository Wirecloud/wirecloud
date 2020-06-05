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

import fnmatch
from itertools import product
from pathlib import Path
import os

from compressor.filters.css_default import CssAbsoluteFilter
from django.contrib.staticfiles import finders

import scss


def django_finder(glob):
    for finder in finders.get_finders():
        for path, storage in finder.list([]):
            if getattr(storage, 'prefix', None) is not None:
                fullpath = "%s%s%s" % (storage.prefix, os.sep, path)
            else:
                fullpath = path
            if fnmatch.fnmatchcase(fullpath, glob):
                yield path, storage


scss.config.IMAGES_ROOT = django_finder


def get_scss_compiler(namespace, relpath):

    namespace.set_variable('$theme', scss.types.String.unquoted(relpath.split('/')[1]))
    compiler = scss.compiler.Compiler(
        namespace=namespace,
        extensions=(scss.extension.core.CoreExtension, scss.extension.compass.CompassExtension, DjangoSCSSExtension)
    )
    compiler.base_path = '/'.join(relpath.split('/')[:3])
    return compiler


class DjangoSCSSExtension(scss.extension.Extension):

    def _get_possible_import_paths(self, source_file, path):
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

    def handle_import(self, filename, compilation, rule):
        paths = self._get_possible_import_paths(rule.source_file, filename)

        scss.log.debug('Searching for %s in %s', filename, paths)

        for name in paths:
            result = finders.find(os.path.join(compilation.compiler.base_path, name))

            if result:
                origin = Path(result[:-len(name)])
                relpath = Path(name)

                return scss.source.SourceFile.read(origin, relpath)

        return None


class SCSSPrecompiler(object):

    def __init__(self, content, attrs, filter_type=None, filename=None, charset=None):
        self.filename = filename
        self.content = content
        self.namespace = scss.namespace.Namespace()
        self.namespace.set_variable('$context', scss.types.String.unquoted(attrs.get('context', 'platform')))

    def input(self, filename=None, basename=None, **kwargs):

        compiler = get_scss_compiler(self.namespace, basename)
        source = scss.source.SourceFile.from_string(self.content, relpath=basename)
        content = compiler.compile_sources(source)
        return CssAbsoluteFilter(content).input(filename, basename, **kwargs)
