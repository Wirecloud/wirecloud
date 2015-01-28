#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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
from setuptools import setup
from setuptools.command.install import install
from distutils.command.install import INSTALL_SCHEMES

import wirecloud.platform

ROOT = os.path.abspath(os.path.dirname(__file__))
packages, data_files = [], []


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


class CustomInstallCommand(install):

    """Customized setuptools install command - prints info about the license of Wirecloud after installing it."""
    def run(self):
        install.run(self)

        print('')
        print(bcolors.HEADER + 'License' + bcolors.ENDC)
        print('')
        print("Wirecloud is licensed under a AGPLv3+ license with a classpath-like exception \n" +
              "that allows widgets/operators and mashups to be licensed under any propietary or \n" +
              "open source license.")
        print('')
        license_file = os.path.join(self.install_purelib, 'wirecloud', 'LICENSE')
        print('A copy of the license has been installed at: ' + bcolors.WARNING + license_file + bcolors.ENDC)


for scheme in INSTALL_SCHEMES.values():
    scheme['data'] = scheme['purelib']


def include_data_files(path):
    for dirpath, dirnames, filenames in os.walk(path):
        # Ignore dirnames that start with '.'
        for i, dirname in enumerate(dirnames):
            if dirname.startswith('.'):
                del dirnames[i]
        if '__init__.py' not in filenames:
            data_files.append([dirpath, [os.path.join(dirpath, f) for f in filenames]])

data_files.append(['wirecloud', ['LICENSE']])
include_data_files('wirecloud')

setup(
    name='wirecloud',
    version=wirecloud.platform.__version__,
    description='Widgets Container and Mashup edition tools for composing end-user centric mashup applications.',
    long_description='',
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
    data_files=data_files,
    install_requires=(
        'Django>=1.4.2,<1.7',
        'south>=1.0,<2.0',
        'lxml>=2.3',
        'django_compressor>=1.4',
        'rdflib>=3.2.0',
        'requests>=2.1.0',
        'gevent>=1.0.0,<2.0.0',
        'selenium>=2.41',
        'pytz',
        'django_relatives',
        'user-agents',
        'regex',
        'markdown',
        'whoosh>=2.5.6',
        'pycrypto',
        'pyScss>=1.3.4,<2.0',
        'Pygments',
        'mock>=1.0,<2.0',
    ),
    tests_require=('django-nose'),
    classifiers=(
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: GNU Affero General Public License v3 or later (AGPLv3+)',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.6',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: JavaScript',
        'Topic :: Software Development :: Libraries :: Python Modules',
    ),
    cmdclass={
        'install': CustomInstallCommand,
    },
)
