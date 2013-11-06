# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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
import zipfile
from lxml import etree
from shutil import rmtree
from urllib import pathname2url

from wirecloud.commons.utils.template import TemplateParser


class InvalidContents(Exception):
    pass


class WgtFile(object):

    _template_filename = 'config.xml'

    def __init__(self, _file):
        self._zip = zipfile.ZipFile(_file)

    def get_underlying_file(self):
        return self._zip.fp

    def read(self, path):
        return self._zip.read(path)

    def get_template(self):
        return self.read(self._template_filename)

    def extract_file(self, file_name, output_path, recreate_=False):
        contents = self.read(file_name)

        dir_path = os.path.dirname(output_path)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)

        f = open(output_path, 'wb')
        f.write(contents)
        f.close()

    def extract(self, path):

        if not os.path.exists(path) or not os.path.isdir(path):
            os.mkdir(path, 0777)

        for name in self._zip.namelist():
            listnames = name.split("/")[:-1]
            folder = path
            if name.endswith("/"):
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if (not os.path.exists(folder)
                        or (os.path.exists(folder) and not os.path.isdir(folder))):
                        os.mkdir(folder)
            else:
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if not os.path.exists(folder) or not os.path.isdir(folder):
                        os.mkdir(folder)
                outfile = open(os.path.join(path, name.replace("/", os.sep)), 'wb')
                outfile.write(self._zip.read(name))
                outfile.close()

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
