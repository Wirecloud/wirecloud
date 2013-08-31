# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

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

try:
    from django.conf.urls import patterns, include, url
except ImportError:  # pragma: no cover
    # for Django version less than 1.4
    from django.conf.urls.defaults import patterns, url
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.platform.markets.utils import MarketManager
from wirecloud.platform.plugins import WirecloudPlugin, build_url_template

import wirecloud.fiware
from wirecloud.fiware.marketAdaptor.marketadaptor import MarketAdaptor
from wirecloud.fiware.marketAdaptor.views import get_market_adaptor, get_market_user_data


class FiWareMarketManager(MarketManager):

    _options = None

    def __init__(self, options):

        self._options = options

    def search_resource(self, vendor, name, version, user):
        return None

    def download_resource(self, user, url, endpoint):

        store = endpoint['store']
        adaptor = get_market_adaptor(None, self._options['name'])
        user_data = get_market_user_data(user, self._options['user'], self._options['name'])
        storeclient = adaptor.get_store(store)

        store_token_key = store + '/token'
        if store_token_key in user_data:
            token = user_data[store_token_key]
        else:
            token = user_data['idm_token']

        return storeclient.download_resource(url, token)

    def publish(self, endpoint, wgt_file, user, request=None, template=None):

        if template is None:
            template = TemplateParser(wgt_file.get_template())

        resource_info = template.get_resource_info()

        mimetypes = {
            'widget': 'application/x-widget+mashable-application-component',
            'operator': 'application/x-operator+mashable-application-component',
            'mashup': 'application/x-mashup+mashable-application-component',
        }

        store = endpoint['store']
        adaptor = get_market_adaptor(self._options.get('user', None), self._options['name'])
        user_data = get_market_user_data(user, self._options['user'], self._options['name'])
        storeclient = adaptor.get_store(store)

        store_token_key = store + '/token'
        if store_token_key in user_data:
            token = user_data[store_token_key]
        else:
            token = user_data['idm_token']

        storeclient.upload_resource(
            resource_info['display_name'],
            resource_info['version'],
            "_".join((resource_info['vendor'], resource_info['name'], resource_info['version'])) + '.wgt',
            resource_info['description'],
            mimetypes[resource_info['type']],
            wgt_file.get_underlying_file(),
            token
        )


class FiWarePlugin(WirecloudPlugin):

    features = {
        'FiWare': wirecloud.fiware.__version__,
        'NGSI': '1.0',
        'ObjectStorage': '0.5',
    }

    def get_market_classes(self):
        return {
            'fiware': FiWareMarketManager,
        }

    def get_scripts(self, view):

        common = (
            'js/NGSI/NGSI.js',
            'js/NGSI/eventsource.js',
            'js/NGSI/NGSIManager.js',
        )

        if view == 'index':
            return common + (
                "js/wirecloud/FiWare.js",
                "js/wirecloud/FiWare/FiWareCatalogueView.js",
                "js/wirecloud/FiWare/FiWareCatalogue.js",
                "js/wirecloud/FiWare/FiWareCatalogueResource.js",
                "js/wirecloud/FiWare/ui/ResourceDetailsView.js",
                "js/wirecloud/FiWare/ui/OfferingPainter.js",
                "js/wirecloud/FiWare/ui/OfferingResourcesPainter.js",
                "js/wirecloud/FiWare/FiWareResourceDetailsExtraInfo.js",
            )
        else:
            return common

    def get_urls(self):
            return patterns('',
                (r'^api/marketAdaptor/', include('wirecloud.fiware.marketAdaptor.urls')),
            )

    def get_templates(self, view):
        if view == 'index':
            return {
                "fiware_marketplace_search_interface": "wirecloud/fiware/marketplace/search_interface.html",
                "fiware_catalogue_resource_details_template": "wirecloud/fiware/marketplace/resource_details.html",
                "fiware_resource": "wirecloud/fiware/marketplace/resource.html",
                "fiware_resource_parts": "wirecloud/fiware/marketplace/resource_parts.html",
                "fiware_main_details_template": "wirecloud/fiware/marketplace/main_resource_details.html",
                "legal_template": "wirecloud/fiware/marketplace/legal/legal_template.html",
                "legal_clause_template": "wirecloud/fiware/marketplace/legal/legal_clause_template.html",
                "service_level_template": "wirecloud/fiware/marketplace/sla/service_level_template.html",
                "sla_expresion_template": "wirecloud/fiware/marketplace/sla/sla_expresion_template.html",
                "sla_variable_template": "wirecloud/fiware/marketplace/sla/sla_variable_template.html",
                "pricing_template": "wirecloud/fiware/marketplace/pricing/pricing_template.html",
                "price_component_template": "wirecloud/fiware/marketplace/pricing/price_component_template.html",
                "fiware_catalogue_publish_interface": "wirecloud/fiware/marketplace/publish_template.html",
            }
        else:
            return {}

    def get_ajax_endpoints(self, views):
        return (
            {'id': 'FIWARE_RESOURCES_COLLECTION', 'url': build_url_template('wirecloud.fiware.market_resource_collection', ['market_user', 'market_name'])},
            {'id': 'FIWARE_FULL_SEARCH', 'url': build_url_template('wirecloud.fiware.market_full_search', ['market_user', 'market_name', 'search_string'])},
            {'id': 'FIWARE_STORE_RESOURCES_COLLECTION', 'url': build_url_template('wirecloud.fiware.store_resource_collection', ['market_user', 'market_name', 'store'])},
            {'id': 'FIWARE_STORE_SEARCH', 'url': build_url_template('wirecloud.fiware.store_search', ['market_user', 'market_name', 'store', 'search_string'])},
            {'id': 'FIWARE_STORE_COLLECTION', 'url': build_url_template('wirecloud.fiware.store_collection', ['market_user', 'market_name'])},
            {'id': 'FIWARE_STORE_START_PURCHASE', 'url': build_url_template('wirecloud.fiware.store_start_purchase', ['market_user', 'market_name', 'store'])},
        )

    def get_widget_api_extensions(self, view):
        return (
            'js/WirecloudAPI/NGSIAPI.js',
            'js/ObjectStorage/ObjectStorageAPI.js',
        )

    def get_operator_api_extensions(self, view):
        return (
            'js/WirecloudAPI/NGSIAPI.js',
            'js/ObjectStorage/ObjectStorageAPI.js',
        )
