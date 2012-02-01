# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import os
import zipfile
from lxml import etree

from commons.template import TemplateParser


class WgtFile(object):

    def __init__(self, _file):
        self._zip = zipfile.ZipFile(_file)
        self._parse_config_file()

    def _parse_config_file(self):
        config = self._zip.read('config.xml')
        doc = etree.fromstring(config)
        self._template_filename = doc.get('id')

    def read(self, path):
        return self._zip.read(path)

    def get_template(self):
        return self.read(self._template_filename)

    def extract_file(self, file_name, output_path, recreate_=False):
        dir_path = os.path.dirname(output_path)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)

        f = open(output_path, 'wb')
        contents = self.read(file_name)
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

    def deploy(self, wgt_file, user):

        template_content = wgt_file.get_template()
        template_parser = TemplateParser(template_content)

        gadget_dir = os.path.join(self._root_dir,
            user.username,
            template_parser.get_resource_vendor(),
            template_parser.get_resource_name(),
            template_parser.get_resource_version(),
        )
        template_parser.set_base(gadget_dir)

        self._create_folders(gadget_dir)
        wgt_file.extract(gadget_dir)

        return template_parser

    def _create_folders(self, gadget_dir):

        self._create_folder(self._root_dir)
        self._create_folder(gadget_dir)

    def _create_folder(self, folder):
        if not os.path.isdir(folder):
            os.makedirs(folder)
