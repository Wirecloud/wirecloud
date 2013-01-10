#!/usr/bin/env python

import os
from setuptools import setup
from distutils.command.install import INSTALL_SCHEMES

import wirecloud.platform

ROOT = os.path.abspath(os.path.dirname(__file__))
packages, data_files = [], []


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

include_data_files('wirecloud')

setup(
    name='wirecloud',
    version=wirecloud.platform.__version__,
    description='Widgets Container and Mashup edition tools for composing end-user centric mashup applications.',
    long_description='',
    author='CoNWeT Lab',
    author_email='wirecloud@conwet.com',
    url='http://github.com/Wirecloud/wirecloud',
    license='AGPL3',
    packages=('wirecloud',),
    include_package_data=True,
    data_files=data_files,
    install_requires=('Django>=1.3', 'south', 'lxml', 'BeautifulSoup', 'django-compressor>=1.2', 'rdflib>=3.2.0'),
    tests_require=('django-nose', 'selenium'),
    classifiers=(
        'Development Status :: 3 - Alpha',
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
    )
)
