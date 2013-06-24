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

import json
import os
import urllib2
from urlparse import urljoin

from django.utils.encoding import iri_to_uri

from wirecloud.catalogue.models import CatalogueResource
import wirecloud.catalogue.utils as catalogue_utils
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.proxy.views import MethodRequest
from wirecloud.platform.localcatalogue.utils import install_resource_to_user
from wirecloud.platform.markets.utils import MarketManager


class WirecloudCatalogueManager(MarketManager):

    _options = None

    def __init__(self, options):
        self._options = options

    def search_resource(self, vendor, name, version, user):

        if self._options['name'] == 'local':
            resources = CatalogueResource.objects.filter(vendor=vendor, short_name=name, version=version)[:1]

            if len(resources) == 1:
                resource = resources[0]

                if resource.template_uri.startswith(('http://', 'https://')):
                    downloaded_file = downloader.download_http_content(resource.template_uri, user=user)
                else:
                    base_dir = catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version)
                    downloaded_file = downloader.download_http_content('file://' + os.path.join(base_dir, resource.template_uri), user=user)

                return {
                    'downloaded_file': downloaded_file,
                    'template_url': resource.template_uri,
                    'packaged': resource.fromWGT
                }
            else:
                return None
        else:

            opener = urllib2.build_opener()
            path = '/'.join(('catalogue', 'resource', vendor, name, version))
            url = iri_to_uri(urljoin(self._options['url'], path))
            request = MethodRequest('GET', url)
            response = opener.open(request)

            if response.code == 200:
                data = json.loads(response.read())
                downloaded_file = downloader.download_http_content(data['uriTemplate'], user=user)
                return {
                    'downloaded_file': downloaded_file,
                    'template_url': data['uriTemplate'],
                    'packaged': data['packaged']
                }
            else:
                return None

    def publish(self, endpoint, wgt_file, user, request=None, template=None):

        if self._options['name'] == 'local':

            if template is None:
                template = TemplateParser(wgt_file.get_template())

            install_resource_to_user(user, file_contents=wgt_file, packaged=True, raise_conflicts=True)
        else:
            raise Exception('TODO')
