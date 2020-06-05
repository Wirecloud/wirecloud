# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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
import re
from shutil import rmtree
from urllib.request import pathname2url
import zipfile

from wirecloud.commons.utils.template import TemplateParser


class InvalidContents(Exception):

    def __init__(self, message, details=None):
        self.message = message
        self.details = details

    def __str__(self):
        return self.message


class WgtFile(object):

    _template_filename = 'config.xml'

    def __init__(self, _file):
        self._zip = zipfile.ZipFile(_file)
        for filename in self._zip.namelist():
            normalized_filename = os.path.normpath(filename)
            if normalized_filename.startswith('../'):
                raise ValueError('Invalid file name: %s', filename)
            if normalized_filename.startswith('/'):
                raise ValueError('Invalid absolute file name: %s', filename)

    @property
    def namelist(self):
        return self._zip.namelist

    def get_underlying_file(self):
        return self._zip.fp

    def read(self, path):
        return self._zip.read(path)

    def get_template(self):
        try:
            return self.read(self._template_filename)
        except KeyError:
            raise InvalidContents('Missing config.xml at the root of the zipfile (wgt)')

    def extract_file(self, file_name, output_path, recreate_=False):
        contents = self.read(file_name)

        dir_path = os.path.dirname(output_path)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)

        with open(output_path, 'wb') as f:
            f.write(contents)

    def extract_localized_files(self, file_name, output_dir):

        (file_root, ext) = os.path.splitext(file_name)
        search_re = re.compile(re.escape(file_root) + r'(?:.\w\w(?:-\w\w)?)?' + re.escape(ext))
        for name in self._zip.namelist():
            if search_re.match(name):
                self.extract_file(name, os.path.join(output_dir, os.path.basename(name)))

    def extract_dir(self, dir_name, output_path):

        if not dir_name.endswith('/'):
            dir_name += '/'

        files = tuple(name for name in self._zip.namelist() if name.startswith(dir_name))

        if len(files) == 0:
            raise KeyError("There is no directory named '%s' in the archive" % dir_name)

        if not os.path.exists(output_path):
            os.makedirs(output_path)

        for name in files:

            local_name = name[len(dir_name):]
            listnames = local_name.split("/")[:-1]
            folder = output_path
            if name.endswith("/"):
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if not os.path.exists(folder) or (os.path.exists(folder) and not os.path.isdir(folder)):
                        os.mkdir(folder)
            else:
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if not os.path.exists(folder) or not os.path.isdir(folder):
                        os.mkdir(folder)
                outfile = open(os.path.join(output_path, local_name.replace("/", os.sep)), 'wb')
                outfile.write(self._zip.read(name))
                outfile.close()

    def extract(self, path):

        if not os.path.exists(path) or not os.path.isdir(path):
            os.mkdir(path, 0o777)

        for name in self._zip.namelist():
            listnames = name.split("/")[:-1]
            folder = path
            if name.endswith("/"):
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if not os.path.exists(folder) or (os.path.exists(folder) and not os.path.isdir(folder)):
                        os.mkdir(folder)
            else:
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if not os.path.exists(folder) or not os.path.isdir(folder):
                        os.mkdir(folder)
                outfile = open(os.path.join(path, name.replace("/", os.sep)), 'wb')
                outfile.write(self._zip.read(name))
                outfile.close()

    def update_config(self, contents):

        # Encode contents if needed
        if isinstance(contents, str):
            contents = contents.encode('utf-8')

        new_fp = BytesIO()

        # Copy every file from the original zipfile to the new one
        # excluding the config.xml file, that will be replaced
        filename = 'config.xml'
        with zipfile.ZipFile(new_fp, 'w') as zout:
            zout.comment = self._zip.comment  # preserve the comment

            for item in self._zip.infolist():
                # Copy new config.xml contents
                if item.filename == filename:
                    zout.writestr(item, contents)
                # Copy original files
                else:
                    zout.writestr(item, self._zip.read(item.filename))

        # Reopen in read only mode
        self._zip = zipfile.ZipFile(new_fp)

    def close(self):
        self._zip.close()


class WgtDeployer(object):

    def __init__(self, root_dir):

        self._root_dir = root_dir

    @property
    def root_dir(self):
        return self._root_dir

    def get_base_dir(self, vendor, name, version):
        return os.path.join(
            self._root_dir,
            vendor,
            name,
            version,
        )

    def deploy(self, wgt_file):

        template_content = wgt_file.get_template()
        template_parser = TemplateParser(template_content)

        widget_rel_dir = os.path.join(
            template_parser.get_resource_vendor(),
            template_parser.get_resource_name(),
            template_parser.get_resource_version(),
        )
        widget_dir = os.path.join(self._root_dir, widget_rel_dir)
        template_parser.set_base(pathname2url(widget_rel_dir) + '/')

        self._create_folders(widget_dir)
        wgt_file.extract(widget_dir)

        return template_parser

    def undeploy(self, vendor, name, version):

        base_dir = self.get_base_dir(vendor, name, version)

        if os.path.isdir(base_dir):
            rmtree(base_dir)

    def _create_folders(self, widget_dir):

        self._create_folder(self._root_dir)
        self._create_folder(widget_dir)

    def _create_folder(self, folder):
        if not os.path.isdir(folder):
            os.makedirs(folder)
