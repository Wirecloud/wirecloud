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

from wirecloud.markets.utils import MarketManager
from wirecloud.proxy.views import MethodRequest
from wirecloud.plugins import WirecloudPlugin
from wirecloud.workspace.mashupTemplateGenerator import build_rdf_template_from_workspace, build_usdl_from_workspace

import wirecloud_fiware
from wirecloud_fiware.marketAdaptor.marketadaptor import MarketAdaptor


class FiWareMarketManager(MarketManager):

    _options = None

    def __init__(self, options):

        self._options = options

    # TODO remove when repository implementation works !!!
    def _fix_repository_cuts(self, document, url):

        document_len = len(document)
        # Upload document to the repository
        headers = {'content-type': 'application/rdf+xml; charset=utf-8'}
        opener = urllib2.build_opener()
        request = MethodRequest('PUT', url.encode('utf-8'), document, headers)
        try:
            response = opener.open(request)
        except HTTPError:
            pass

        # Get the uploaded document to know how many bytes have been cutted
        headers = {'Accept': 'application/rdf+xml'}
        request = MethodRequest('GET', url.encode('utf-8'), '', headers)
        response = opener.open(request)
        body = response.read()
        cut_len = len(body)

        # Add new lines when needed
        if cut_len < document_len:
            document += ('\n' * ((document_len - cut_len) + 5))

        # Delete the uploaded document
        request = MethodRequest('DELETE', url.encode('utf-8'))
        response = opener.open(request)

        return document
    #----------------------------------------------------------

    def search_resource(self, vendor, name, version, user):
        return None

    def publish_mashup(self, endpoint, published_workspace, user, published_options, request=None):

        market_url = self._options['url']
        store = endpoint['store']
        adaptor = MarketAdaptor(market_url)
        if "store_url" in self._options:
            store_info = {'url': self._options['store_url']}
        else:
            store_info = adaptor.get_store_info(store)

        # Create rdf template and publish it into the repository
        params = build_rdf_template_from_workspace(published_options, published_workspace.workspace, user)
        headers = {'content-type': 'application/rdf+xml; charset=utf-8'}
        opener = urllib2.build_opener()
        name = published_options.get('name').replace(' ', '')
        template_location = urljoin(store_info['url'], '/FiwareRepository/v1/collectionA/collectionB/' + name + 'Mdl')

        content = params.serialize()

        content = self._fix_repository_cuts(content, template_location)

        request = MethodRequest('PUT', template_location.encode('utf-8'), content, headers)
        response = opener.open(request)

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

        # Create usdl document and publish it into the repository
        usdl_document = build_usdl_from_workspace(published_options, published_workspace.workspace, user, template_location)
        usdl_location = urljoin(store_info['url'], '/FiwareRepository/v1/collectionA/collectionB/' + name)
        usdl_content = usdl_document.serialize()

        # TODO remove this line when repository implementation works!!
        usdl_content = self._fix_repository_cuts(usdl_content, usdl_location)
        # -----------------------------------------------------------

        request = MethodRequest('PUT', usdl_location.encode('utf-8'), usdl_content, headers)

        response = opener.open(request)

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

        # add the published service to the marketplace in the chosen store
        adaptor.add_service(store, {'name': name, 'url': usdl_location})


class FiWarePlugin(WirecloudPlugin):

    features = {
        'FiWare': wirecloud_fiware.__version__,
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
                "js/wirecloud/FiWare/ui/ResourceDetailsView.js",
                "js/wirecloud/FiWare/FiWareResourceDetailsExtraInfo.js",
                "js/wirecloud/FiWare/FiWareStoreListItems.js",
            )
        else:
            return ()

    def get_ajax_endpoints(self, views):
        return (
            {'id': 'FIWARE_RESOURCES_COLLECTION', 'url': '/api/marketAdaptor/marketplace/#{market}/resources'},
            {'id': 'FIWARE_FULL_SEARCH', 'url': '/api/marketAdaptor/marketplace/#{market}/search/#{search_string}'},
            {'id': 'FIWARE_STORE_RESOURCES_COLLECTION', 'url': '/api/marketAdaptor/marketplace/#{market}/#{store}/resources'},
            {'id': 'FIWARE_STORE_SEARCH', 'url': '/api/marketAdaptor/marketplace/#{market}/search/#{store}/#{search_string}'},
            {'id': 'FIWARE_RESOURCE_ENTRY', 'url': '/api/marketAdaptor/marketplace/#{market}/#{store}/#{entry}'},
            {'id': 'FIWARE_STORE_COLLECTION', 'url': '/api/marketAdaptor/marketplace/#{market}/stores'},
            {'id': 'FIWARE_STORE_ENTRY', 'url': '/api/marketAdaptor/marketplace/#{market}/stores/#{store}'},
        )
