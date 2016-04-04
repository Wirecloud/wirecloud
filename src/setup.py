#!/usr/bin/env python
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

from distutils.cmd import Command
from distutils.command.install import INSTALL_SCHEMES
import os
import re
from setuptools import setup
from distutils.command.build import build as distutils_build
from setuptools.command.install import install as setuptools_install
from setuptools.command.sdist import sdist as setuptools_sdist

import wirecloud.platform

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


class build(distutils_build):

    """Customized setuptools build command - compile po files before creating the distribution package."""

    sub_commands = [('compiletranslations', None)] + distutils_build.sub_commands


class sdist(setuptools_sdist):

    """Customized setuptools sdist command - compile po files before creating the distribution package."""

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
        except:
            import pip
            pip.main(['install', 'Django>=1.6,<1.10'])

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


class install(setuptools_install):

    """Customized setuptools install command - prints info about the license of Wirecloud after installing it."""
    def run(self):
        setuptools_install.run(self)

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
    install_requires=(
        'Django>=1.6,<1.10',
        'south>=1.0,<2.0',
        'lxml>=2.3',
        'django-appconf>=1.0.1,<2.0',
        'django_compressor>=1.4,<3.0',
        'rdflib>=3.2.0',
        'requests>=2.1.0',
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
        'pillow',
    ),
    extras_require={
        ":python_version < '3.2'": ('futures>=2.1.3',),
    },
    tests_require=(
        'django-nose',
        'mock>=1.0,<2.0',
    ),
    setup_requires={
        'wheel>=0.24',
    },
    classifiers=(
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: GNU Affero General Public License v3 or later (AGPLv3+)',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: JavaScript',
        'Topic :: Software Development :: Libraries :: Python Modules',
    ),
    cmdclass={
        'build': build,
        'install': install,
        'sdist': sdist,
        'compiletranslations': compiletranslations
    },
)
