# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecluod.

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


import urllib2
from urllib2 import HTTPError
from urlparse import urljoin

from proxy.views import MethodRequest
from wirecloud.markets.utils import MarketManager
from wirecloud.plugins import WirecloudPlugin
from workspace.mashupTemplateGenerator import build_rdf_template_from_workspace, build_usdl_from_workspace

from wirecloud_fiware import VERSION
from marketAdaptor.marketadaptor import MarketAdaptor


class FiWareMarketManager(MarketManager):

    _options = None

    def __init__(self, options):

        self._options = options

    def publish_mashup(self, endpoint, published_workspace, user, published_options):

        market_url = self._options['url']
        store = endpoint['store']
        adaptor = MarketAdaptor(market_url)
        store_info = adaptor.get_store_info(store)

        # Create rdf template and publish it into the repository
        params = build_rdf_template_from_workspace(published_options, published_workspace.workspace, user)
        headers = {'content-type': 'application/rdf+xml; charset=utf-8'}
        opener = urllib2.build_opener()
        name = published_options.get('name')
        template_location = urljoin(store_info['url'], '/FiwareRepository/v1/collectionA/collectionB/' + name + 'Mdl')

        content = params.serialize()

        # TODO remove this lines when repository implementation works!!
        i = 0
        while i < 75:
            content += '\n'
            i += 1
        #--------------------------------------------------------------

        request = MethodRequest('PUT', template_location.encode('utf-8'), content, headers)
        response = opener.open(request)

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

        # Create usdl document and publish it into the repository
        usdl_document = build_usdl_from_workspace(published_options, published_workspace.workspace, user, template_location)
        usdl_location = urljoin(store_info['url'], '/FiwareRepository/v1/collectionA/collectionB/' + name)
        usdl_content = usdl_document.serialize()

        # TODO remove this line when repository implementation works!!
        usdl_content += '\n\n\n\n\n\n\n'
        # -----------------------------------------------------------

        request = MethodRequest('PUT', usdl_location.encode('utf-8'), usdl_content, headers)

        response = opener.open(request)

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

        # add the published service to the marketplace in the chosen store
        adaptor.add_service(store, {'name': name, 'url': usdl_location})


class FiWarePlugin(WirecloudPlugin):

    features = {
        'FiWare': '.'.join(map(str, VERSION)),
    }

    def get_market_classes(self):
        return {
            'fiware': FiWareMarketManager,
        }

    def get_scripts(self, view):

        if view == 'index':
            return (
                "js/wirecloud/FiWare.js",
                "js/wirecloud/FiWare/FiWareCatalogueView.js",
                "js/wirecloud/FiWare/FiWareCatalogue.js",
                "js/wirecloud/FiWare/FiWareCatalogueResource.js",
                "js/wirecloud/FiWare/FiWareCataloguePublishView.js",
                "js/wirecloud/FiWare/FiWareResourceDetailsView.js",
                "js/wirecloud/FiWare/FiWareResourcePainter.js",
                "js/wirecloud/FiWare/FiWareResourceDetailsExtraInfo.js",
                "js/wirecloud/FiWare/FiWareResourceDetailsPainter.js",
                "js/wirecloud/FiWare/FiWareStoreListItems.js",
            )
        else:
            return ()

    def get_ajax_endpoints(self, views):
        return (
            {'id': 'FIWARE_RESOURCES_COLLECTION', 'url': '/marketAdaptor/marketplace/#{market}/resources'},
            {'id': 'FIWARE_FULL_SEARCH', 'url': '/marketAdaptor/marketplace/#{market}/search/#{search_string}'},
            {'id': 'FIWARE_STORE_RESOURCES_COLLECTION', 'url': '/marketAdaptor/marketplace/#{market}/#{store}/resources'},
            {'id': 'FIWARE_STORE_SEARCH', 'url': '/marketAdaptor/marketplace/#{market}/search/#{store}/#{search_string}'},
            {'id': 'FIWARE_RESOURCE_ENTRY', 'url': '/marketAdaptor/marketplace/#{market}/#{store}/#{entry}'},
            {'id': 'FIWARE_STORE_COLLECTION', 'url': '/marketAdaptor/marketplace/#{market}/stores'},
            {'id': 'FIWARE_STORE_ENTRY', 'url': '/marketAdaptor/marketplace/#{market}/stores/#{store}'},
        )
