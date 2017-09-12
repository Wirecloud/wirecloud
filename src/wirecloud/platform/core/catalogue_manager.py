# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

import json
import os
import requests
from six.moves.urllib.parse import urljoin

from django.utils.encoding import iri_to_uri
from django.utils.translation import ugettext as _

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

    def publish(self, endpoint, wgt_file, user, request=None, template=None):

        if self._name == 'local':

            if template is None:
                template = TemplateParser(wgt_file.get_template())

            added, resource = install_resource_to_user(user, file_contents=wgt_file, packaged=True, raise_conflicts=True)
            if not added:
                raise Exception(_('Resource already exists %(resource_id)s') % {'resource_id': resource.local_uri_part})

            return resource
        else:
            raise Exception('TODO')
