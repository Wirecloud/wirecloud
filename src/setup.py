#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.

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

from distutils.cmd import Command
from distutils.command.install import INSTALL_SCHEMES
import os
from setuptools import setup
from distutils.command.build import build as distutils_build
from setuptools.command.build_py import build_py
from setuptools.command.install import install as setuptools_install
from setuptools.command.sdist import sdist as setuptools_sdist
from shutil import copyfile

import wirecloud.platform
from wirecloud.commons.utils.git import get_git_info


VERSION_METADATA_FILE = 'wirecloud/platform/__init__.py'


class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'

    def disable(self):
        self.HEADER = ''
        self.OKBLUE = ''
        self.OKGREEN = ''
        self.WARNING = ''
        self.FAIL = ''
        self.ENDC = ''


def add_git_metadata(base_dir):

    GIT_REVISION, RELEASE_DATE, GIT_DIRTY = get_git_info()

    with open(os.path.join(base_dir, VERSION_METADATA_FILE), "a") as f:
        f.write('__git_hash__ = "%s"\n__git_dirty__ = %s\n__release_date__ = "%s"\n' % (GIT_REVISION, GIT_DIRTY, RELEASE_DATE))


class build_wirecloud(build_py):

    def run(self):

        # distutils uses old-style classes, so no super()
        build_py.run(self)

        # Use a fresh version of the python file
        copyfile(VERSION_METADATA_FILE, os.path.join(self.build_lib, VERSION_METADATA_FILE))
        add_git_metadata(self.build_lib)


class build(distutils_build):

    """Customized setuptools build command - compile po files before creating the distribution package."""

    sub_commands = [('compiletranslations', None), ('compilemonaco', None)] + distutils_build.sub_commands


class sdist(setuptools_sdist):

    """
    Customized setuptools sdist command

    - compile po files before creating the distribution package.
    - add git metadata into wirecloud/platform/__init__.py
    """

    def make_release_tree(self, base_dir, files):
        setuptools_sdist.make_release_tree(self, base_dir, files)

        add_git_metadata(base_dir)

    sub_commands = [('compiletranslations', None)] + setuptools_sdist.sub_commands


class compiletranslations(Command):

    description = 'compile message catalogs to MO files via django compilemessages'
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):

        try:
            from django.core.management import call_command
        except Exception:
            import pip
            pip.main(['install', 'Django>=2.0,<2.3'])

            from django.core.management import call_command

        oldwd = os.getcwd()
        wirecloud_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'wirecloud'))
        for subpath in os.listdir(wirecloud_path):
            current_path = os.path.join(wirecloud_path, subpath)
            if os.path.isdir(os.path.join(current_path, 'locale')):
                os.chdir(current_path)
                try:
                    call_command('compilemessages')
                except Exception as e:
                    print('Error compiling translations for module %(module)s: %(error)s' % {'module': subpath.replace('/', '.'), 'error': e})

        os.chdir(oldwd)

class compilemonaco(Command):

    description = 'compile monaco editor'
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        import subprocess

        try:
            subprocess.check_call(['npm', 'install'])
        except subprocess.CalledProcessError as e:
            raise Exception('Error compiling monaco editor: %s' % e)

class install(setuptools_install):

    """Customized setuptools install command - prints info about the license of WireCloud after installing it."""
    def run(self):
        setuptools_install.run(self)

        print('')
        print(bcolors.HEADER + 'License' + bcolors.ENDC)
        print('')
        print("WireCloud is licensed under a AGPLv3+ license with a classpath-like exception")
        print("that allows widgets/operators and mashups to be licensed under any propietary or")
        print("open source license.")
        print('')
        license_file = os.path.join(self.install_purelib, 'wirecloud', 'LICENSE')
        print('A copy of the license has been installed at: ' + bcolors.WARNING + license_file + bcolors.ENDC)


def read(fname):
    with open(os.path.join(os.path.dirname(__file__), fname)) as f:
        return f.read()


for scheme in INSTALL_SCHEMES.values():
    scheme['data'] = scheme['purelib']


setup(
    name='wirecloud',
    version=wirecloud.platform.__version__,
    description='Widgets Container and Mashup edition tools for composing end-user centric mashup applications.',
    long_description=read('README.md'),
    long_description_content_type="text/markdown",
    author='CoNWeT Lab',
    author_email='wirecloud@conwet.com',
    url='http://github.com/Wirecloud/wirecloud',
    license='AGPLv3+ with classpath-like exception',
    packages=('wirecloud',),
    entry_points={
        'console_scripts': (
            'wirecloud-admin = wirecloud.commons.wirecloud_admin:execute_from_command_line',
        ),
    },
    include_package_data=True,
    install_requires=read('./requirements.txt'),
    tests_require=read('./requirements-dev.txt'),
    setup_requires=(
        'wheel>=0.24',
    ),
    classifiers=(
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: GNU Affero General Public License v3 or later (AGPLv3+)',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: JavaScript',
        'Topic :: Software Development :: Libraries :: Python Modules',
    ),
    cmdclass={
        'build': build,
        'build_py': build_wirecloud,
        'install': install,
        'sdist': sdist,
        'compiletranslations': compiletranslations,
        'compilemonaco': compilemonaco,
    },
)
