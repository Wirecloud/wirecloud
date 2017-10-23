# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 Conwet Lab., Universidad Politécnica de Madrid

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

from django.conf import settings
from django.conf.urls import include, url
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.cache import cache_page
import requests

from wirecloud.commons.utils.template import TemplateParser
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.core.plugins import get_version_hash
from wirecloud.platform.localcatalogue.utils import install_resource_to_all_users
from wirecloud.platform.markets.utils import MarketManager
from wirecloud.platform.models import CatalogueResource
from wirecloud.platform.plugins import WirecloudPlugin, build_url_template
from wirecloud.platform.workspace.utils import create_workspace, delete_workspace

import wirecloud.fiware
from wirecloud.fiware.marketAdaptor.views import get_market_adaptor, get_market_user_data
from wirecloud.fiware.storeclient import UnexpectedResponse

try:
    from social_django.utils import BACKENDS, get_backend
    FIWARE_SOCIAL_AUTH_BACKEND = get_backend(BACKENDS, 'fiware')

    IDM_SUPPORT_ENABLED = 'wirecloud.fiware' in settings.INSTALLED_APPS and 'social_django' in settings.INSTALLED_APPS
except:
    IDM_SUPPORT_ENABLED = False


BASE_PATH = os.path.dirname(__file__)
BAE_BROWSER_WIDGET = os.path.join(BASE_PATH, 'initial', 'CoNWeT_bae-browser_0.1.1.wgt')
BAE_DETAILS_WIDGET = os.path.join(BASE_PATH, 'initial', 'CoNWeT_bae-details_0.1.1.wgt')
BAE_SEARCH_FILTERS_WIDGET = os.path.join(BASE_PATH, 'initial', 'CoNWeT_bae-search-filters_0.1.1.wgt')
BAE_MASHUP = os.path.join(BASE_PATH, 'initial', 'CoNWeT_bae-marketplace_0.1.1.wgt')


def auth_fiware_token(auth_type, token):

    from social_django.models import UserSocialAuth
    user_data = FIWARE_SOCIAL_AUTH_BACKEND._user_data(token)
    return UserSocialAuth.objects.get(provider='fiware', uid=user_data['username']).user


class FIWAREBAEManager(MarketManager):

    _user = None
    _name = None
    _options = None

    def __init__(self, user, name, options):

        self._user = user
        self._name = name
        self._options = options

    def create(self, user):
        create_workspace(
            user,
            mashup="CoNWeT/bae-marketplace/0.1.1",
            new_name=self._options['name'],
            preferences={'server_url': self._options['url']},
            searchable=False,
            public=self._options['public']
        )

    def delete(self):
        delete_workspace(user=self._user, name=self._name)

    def download_resource(self, user, url, endpoint):

        store = endpoint['store']
        user_data = get_market_user_data(user, self._user, self._name)

        store_token_key = store + '/token'
        if store_token_key in user_data:
            token = user_data[store_token_key]
        else:
            token = user_data['idm_token']

        headers = {
            'Authorization': 'Bearer ' + token,
        }

        response = requests.get(url, headers=headers)

        if response.status_code not in (200, 201, 204):
            raise Exception(response)

        return response.content


class FiWareMarketManager(MarketManager):

    _user = None
    _name = None
    _options = None

    def __init__(self, user, name, options):

        self._user = user
        self._name = name
        self._options = options

    def download_resource(self, user, url, endpoint):

        store = endpoint['store']
        adaptor = get_market_adaptor(self._user, self._name)
        user_data = get_market_user_data(user, self._user, self._name)
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

        resource_info = template.get_resource_processed_info(lang='en')

        mimetypes = {
            'widget': 'application/x-widget+mashable-application-component',
            'operator': 'application/x-operator+mashable-application-component',
            'mashup': 'application/x-mashup+mashable-application-component',
        }

        store = endpoint['store']
        adaptor = get_market_adaptor(self._user, self._name)
        user_data = get_market_user_data(user, self._user, self._name)
        storeclient = adaptor.get_store(store)

        store_token_key = store + '/token'
        if store_token_key in user_data:
            token = user_data[store_token_key]
        else:
            token = user_data['idm_token']

        wirecloud_plugin_supported = False
        try:
            supported_plugins = storeclient.get_supported_plugins(token)
            for plugin in supported_plugins:
                if plugin.get('name', '').lower() == 'wirecloud component':
                    wirecloud_plugin_supported = True
        except UnexpectedResponse as e:
            if e.status != 404:
                raise e

        if wirecloud_plugin_supported:
            storeclient.upload_resource(
                resource_info['title'],
                resource_info['version'],
                "_".join((resource_info['vendor'], resource_info['name'], resource_info['version'])) + '.wgt',
                resource_info['description'],
                "Mashable application component",
                wgt_file.get_underlying_file(),
                token,
                resource_type="Wirecloud component"
            )
        else:
            storeclient.upload_resource(
                resource_info['title'],
                resource_info['version'],
                "_".join((resource_info['vendor'], resource_info['name'], resource_info['version'])) + '.wgt',
                resource_info['description'],
                mimetypes[resource_info['type']],
                wgt_file.get_underlying_file(),
                token
            )


class FiWarePlugin(WirecloudPlugin):

    features = {
        'FIWARE': wirecloud.fiware.__version__,
        'NGSI': '1.0.2',
        'ObjectStorage': '0.5',
    }

    def get_market_classes(self):
        return {
            'fiware': FiWareMarketManager,
            'fiware-bae': FIWAREBAEManager,
        }

    def get_scripts(self, view):

        common = (
            'js/NGSI/NGSI.min.js',
            'js/NGSI/eventsource.js',
            'js/NGSI/NGSIManager.js',
            'js/ObjectStorage/OpenStackManager.js',
        )

        if view == 'classic':
            return common + (
                "js/wirecloud/FiWare.js",
                "js/wirecloud/FiWare/FiWareCatalogueView.js",
                "js/wirecloud/FiWare/BusinessAPIEcosystemView.js",
                "js/wirecloud/FiWare/Marketplace.js",
                "js/wirecloud/FiWare/Offering.js",
                "js/wirecloud/FiWare/ui/OfferingDetailsView.js",
                "js/wirecloud/FiWare/ui/OfferingPainter.js",
                "js/wirecloud/FiWare/ui/OfferingResourcesPainter.js",
                "js/wirecloud/FiWare/FiWareResourceDetailsExtraInfo.js",
            )
        else:
            return common

    def get_urls(self):
        urls = (
            url(r'^api/marketAdaptor/', include('wirecloud.fiware.marketAdaptor.urls')),
        )

        if IDM_SUPPORT_ENABLED:
            from wirecloud.fiware.views import oauth_discovery
            urls += (
                url('^.well-known/oauth$', cache_page(7 * 24 * 60 * 60, key_prefix='well-known-oauth-%s' % get_version_hash())(oauth_discovery), name='oauth.discovery'),
            )

        return urls

    def get_platform_context_definitions(self):
        return {
            'fiware_version': {
                'label': _('FIWARE version'),
                'description': _('FIWARE version of the platform'),
            },
            'fiware_token_available': {
                'label': _('FIWARE token available'),
                'description': _('Indicates if the current user has associated a FIWARE auth token that can be used for accessing other FIWARE resources'),
            },
        }

    def get_platform_context_current_values(self, user):
        # Work around bug when running manage.py compress
        import wirecloud.fiware

        fiware_token_available = IDM_SUPPORT_ENABLED and user.is_authenticated() and user.social_auth.filter(provider='fiware').exists()
        return {
            'fiware_version': wirecloud.fiware.__version__,
            'fiware_token_available': fiware_token_available
        }

    def get_constants(self):
        # Work around bug when running manage.py compress
        import wirecloud.fiware

        constants = {
            "FIWARE_HOME": getattr(settings, "FIWARE_HOME", wirecloud.fiware.DEFAULT_FIWARE_HOME),
            'FIWARE_PORTALS': getattr(settings, "FIWARE_PORTALS", ())
        }

        if IDM_SUPPORT_ENABLED:
            import wirecloud.fiware.social_auth_backend
            constants["FIWARE_OFFICIAL_PORTAL"] = getattr(settings, "FIWARE_OFFICIAL_PORTAL", False)
            constants["FIWARE_IDM_SERVER"] = getattr(settings, "FIWARE_IDM_SERVER", wirecloud.fiware.social_auth_backend.FIWARE_LAB_IDM_SERVER)

        return constants

    def get_templates(self, view):
        if view == 'classic':
            return [
                "wirecloud/fiware/marketplace/search_interface",
                "wirecloud/fiware/marketplace/resource_details",
                "wirecloud/fiware/marketplace/resource",
                "wirecloud/fiware/marketplace/main_resource_details",
                "wirecloud/fiware/marketplace/legal/legal_template",
                "wirecloud/fiware/marketplace/legal/legal_clause_template",
                "wirecloud/fiware/marketplace/sla/service_level_template",
                "wirecloud/fiware/marketplace/sla/sla_expresion_template",
                "wirecloud/fiware/marketplace/sla/sla_variable_template",
                "wirecloud/fiware/marketplace/pricing/pricing_template",
                "wirecloud/fiware/marketplace/pricing/price_component_template",
            ]
        else:
            return {}

    def get_ajax_endpoints(self, views):
        return (
            {'id': 'FIWARE_RESOURCES_COLLECTION', 'url': build_url_template('wirecloud.fiware.market_resource_collection', ['market_user', 'market_name'])},
            {'id': 'FIWARE_OFFERING_ENTRY', 'url': build_url_template('wirecloud.fiware.market_offering_entry', ['market_user', 'market_name', 'store', 'offering_id'])},
            {'id': 'FIWARE_FULL_SEARCH', 'url': build_url_template('wirecloud.fiware.market_full_search', ['market_user', 'market_name', 'search_string'])},
            {'id': 'FIWARE_STORE_RESOURCES_COLLECTION', 'url': build_url_template('wirecloud.fiware.store_resource_collection', ['market_user', 'market_name', 'store'])},
            {'id': 'FIWARE_STORE_SEARCH', 'url': build_url_template('wirecloud.fiware.store_search', ['market_user', 'market_name', 'store', 'search_string'])},
            {'id': 'FIWARE_STORE_COLLECTION', 'url': build_url_template('wirecloud.fiware.store_collection', ['market_user', 'market_name'])},
            {'id': 'FIWARE_STORE_START_PURCHASE', 'url': build_url_template('wirecloud.fiware.store_start_purchase', ['market_user', 'market_name', 'store'])},
        )

    def get_widget_api_extensions(self, view, features):
        files = []

        if 'NGSI' in features:
            files.append('js/WirecloudAPI/NGSIAPI.js')

        if 'ObjectStorage' in features:
            files.append('js/ObjectStorage/ObjectStorageAPI.js')

        return files

    def get_operator_api_extensions(self, view, features):
        files = []

        if 'NGSI' in features:
            files.append('js/WirecloudAPI/NGSIAPI.js')

        if 'ObjectStorage' in features:
            files.append('js/ObjectStorage/ObjectStorageAPI.js')

        return files

    def get_proxy_processors(self):
        return ('wirecloud.fiware.proxy.IDMTokenProcessor',)

    def get_django_template_context_processors(self):
        context = {
            "FIWARE_HOME": getattr(settings, "FIWARE_HOME", wirecloud.fiware.DEFAULT_FIWARE_HOME),
            "FIWARE_OFFICIAL_PORTAL": getattr(settings, "FIWARE_OFFICIAL_PORTAL", False),
            "FIWARE_PORTALS": getattr(settings, "FIWARE_PORTALS", ()),
        }

        if IDM_SUPPORT_ENABLED:
            context["FIWARE_IDM_SERVER"] = getattr(settings, "FIWARE_IDM_SERVER", wirecloud.fiware.social_auth_backend.FIWARE_LAB_IDM_SERVER)
        else:
            context["FIWARE_IDM_SERVER"] = None

        return context

    def get_api_auth_backends(self):

        if IDM_SUPPORT_ENABLED:
            return {
                'Bearer': auth_fiware_token,
            }
        else:
            return {}

    def populate(self, wirecloud_user, log):
        updated = False

        if not CatalogueResource.objects.filter(vendor="CoNWeT", short_name="bae-browser", version="0.1.1", public=True).exists():
            updated = True
            log('Installing bae-browser widget... ', 1, ending='')
            install_resource_to_all_users(file_contents=WgtFile(BAE_BROWSER_WIDGET))
            log('DONE', 1)

        if not CatalogueResource.objects.filter(vendor="CoNWeT", short_name="bae-details", version="0.1.1", public=True).exists():
            updated = True
            log('Installing bae-details widget... ', 1, ending='')
            install_resource_to_all_users(file_contents=WgtFile(BAE_DETAILS_WIDGET))
            log('DONE', 1)

        if not CatalogueResource.objects.filter(vendor="CoNWeT", short_name="bae-search-filters", version="0.1.1", public=True).exists():
            updated = True
            log('Installing bae-search-filters widget... ', 1, ending='')
            install_resource_to_all_users(file_contents=WgtFile(BAE_SEARCH_FILTERS_WIDGET))
            log('DONE', 1)

        if not CatalogueResource.objects.filter(vendor="CoNWeT", short_name="bae-marketplace", version="0.1.1", public=True).exists():
            updated = True
            log('Installing bae-marketplace mashup... ', 1, ending='')
            install_resource_to_all_users(file_contents=WgtFile(BAE_MASHUP))
            log('DONE', 1)

        return updated
