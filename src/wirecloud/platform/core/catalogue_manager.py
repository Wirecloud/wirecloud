# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import json
import os
import requests
from six.moves.urllib.parse import urljoin

from django.utils.encoding import iri_to_uri

from wirecloud.catalogue.models import CatalogueResource
import wirecloud.catalogue.utils as catalogue_utils
from wirecloud.commons.utils.downloader import download_http_content, download_local_file
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.platform.localcatalogue.utils import install_resource_to_user
from wirecloud.platform.markets.utils import MarketManager


class WirecloudCatalogueManager(MarketManager):

    _user = None
    _name = None
    _options = None

    def __init__(self, user, name, options):

        self._user = user
        self._name = name
        self._options = options

    def search_resource(self, vendor, name, version, user):

        if self._name == 'local':
            resources = CatalogueResource.objects.filter(vendor=vendor, short_name=name, version=version)[:1]

            if len(resources) == 1:
                resource = resources[0]
                base_dir = catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version)
                downloaded_file = download_local_file(os.path.join(base_dir, resource.template_uri))

                return {
                    'downloaded_file': downloaded_file,
                }
            else:
                return None
        else:

            path = '/'.join(('catalogue', 'resource', vendor, name, version))
            url = iri_to_uri(urljoin(self._options['url'], path))
            response = requests.get(url)

            if response.status_code == 200:
                data = json.loads(response.content)
                downloaded_file = download_http_content(data['uriTemplate'], user=user)
                return {
                    'downloaded_file': downloaded_file,
                    'template_url': data['uriTemplate'],
                    'packaged': data['packaged']
                }
            else:
                return None

    def publish(self, endpoint, wgt_file, user, request=None, template=None):

        if self._name == 'local':

            if template is None:
                template = TemplateParser(wgt_file.get_template())

            return install_resource_to_user(user, file_contents=wgt_file, packaged=True, raise_conflicts=True)
        else:
            raise Exception('TODO')
