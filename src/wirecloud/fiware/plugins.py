# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 Conwet Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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
from django.conf.urls import url
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.cache import cache_page

from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.core.plugins import get_version_hash
from wirecloud.platform.localcatalogue.utils import install_component
from wirecloud.platform.markets.utils import MarketManager
from wirecloud.platform.models import CatalogueResource
from wirecloud.platform.plugins import WirecloudPlugin
from wirecloud.platform.workspace.utils import create_workspace, delete_workspace

import wirecloud.fiware

try:
    from social_django.utils import BACKENDS, get_backend, load_strategy
    FIWARE_SOCIAL_AUTH_BACKEND = get_backend(BACKENDS, 'fiware')(load_strategy())

    IDM_SUPPORT_ENABLED = 'wirecloud.fiware' in settings.INSTALLED_APPS and 'social_django' in settings.INSTALLED_APPS \
        and getattr(settings, 'SOCIAL_AUTH_FIWARE_KEY', None) is not None and getattr(settings, 'SOCIAL_AUTH_FIWARE_SECRET', None) is not None

except:
    IDM_SUPPORT_ENABLED = False


BASE_PATH = os.path.dirname(__file__)
BAE_BROWSER_WIDGET = os.path.join(BASE_PATH, 'initial', 'CoNWeT_bae-browser_0.1.1.wgt')
BAE_DETAILS_WIDGET = os.path.join(BASE_PATH, 'initial', 'CoNWeT_bae-details_0.1.1.wgt')
BAE_SEARCH_FILTERS_WIDGET = os.path.join(BASE_PATH, 'initial', 'CoNWeT_bae-search-filters_0.1.1.wgt')
BAE_MASHUP = os.path.join(BASE_PATH, 'initial', 'CoNWeT_bae-marketplace_0.1.1.wgt')


def auth_fiware_token(auth_type, token):

    from social_django.models import UserSocialAuth
    user_data = FIWARE_SOCIAL_AUTH_BACKEND.user_data(token)
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


class FiWarePlugin(WirecloudPlugin):

    features = {
        'FIWARE': wirecloud.fiware.__version__,
        'NGSI': '1.2.1',
        'ObjectStorage': '0.5',
    }

    def get_market_classes(self):
        return {
            'fiware-bae': FIWAREBAEManager,
        }

    def get_scripts(self, view):

        common = (
            'js/NGSI/NGSI.min.js',
            'js/NGSI/NGSIManager.js',
            'js/ObjectStorage/OpenStackManager.js',
        )

        if view == 'classic':
            return common + (
                "js/wirecloud/FiWare.js",
                "js/wirecloud/FiWare/BusinessAPIEcosystemView.js",
            )
        else:
            return common

    def get_urls(self):

        if IDM_SUPPORT_ENABLED:
            from wirecloud.fiware.views import oauth_discovery
            return (
                url('^.well-known/oauth$', cache_page(7 * 24 * 60 * 60, key_prefix='well-known-oauth-%s' % get_version_hash())(oauth_discovery), name='oauth.discovery'),
            )
        else:
            return ()

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
            global FIWARE_SOCIAL_AUTH_BACKEND
            import wirecloud.fiware.social_auth_backend
            constants["FIWARE_OFFICIAL_PORTAL"] = getattr(settings, "FIWARE_OFFICIAL_PORTAL", False)
            constants["FIWARE_IDM_SERVER"] = FIWARE_SOCIAL_AUTH_BACKEND.FIWARE_IDM_SERVER

        return constants

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
        if not IDM_SUPPORT_ENABLED:
            return ()

        return ('wirecloud.fiware.proxy.IDMTokenProcessor',)

    def get_django_template_context_processors(self):
        context = {
            "FIWARE_HOME": getattr(settings, "FIWARE_HOME", wirecloud.fiware.DEFAULT_FIWARE_HOME),
            "FIWARE_OFFICIAL_PORTAL": getattr(settings, "FIWARE_OFFICIAL_PORTAL", False),
            "FIWARE_PORTALS": getattr(settings, "FIWARE_PORTALS", ()),
        }

        if IDM_SUPPORT_ENABLED:
            context["FIWARE_IDM_SERVER"] = getattr(settings, "FIWARE_IDM_SERVER", wirecloud.fiware.social_auth_backend.FIWARE_LAB_IDM_SERVER)
            context["FIWARE_IDM_PUBLIC_URL"] = getattr(settings, "FIWARE_IDM_PUBLIC_URL", wirecloud.fiware.social_auth_backend.FIWARE_LAB_IDM_SERVER)
        else:
            context["FIWARE_IDM_SERVER"] = None
            context["FIWARE_IDM_PUBLIC_URL"] = None

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
            install_component(WgtFile(BAE_BROWSER_WIDGET), public=True)
            log('DONE', 1)

        if not CatalogueResource.objects.filter(vendor="CoNWeT", short_name="bae-details", version="0.1.1", public=True).exists():
            updated = True
            log('Installing bae-details widget... ', 1, ending='')
            install_component(WgtFile(BAE_DETAILS_WIDGET), public=True)
            log('DONE', 1)

        if not CatalogueResource.objects.filter(vendor="CoNWeT", short_name="bae-search-filters", version="0.1.1", public=True).exists():
            updated = True
            log('Installing bae-search-filters widget... ', 1, ending='')
            install_component(WgtFile(BAE_SEARCH_FILTERS_WIDGET), public=True)
            log('DONE', 1)

        if not CatalogueResource.objects.filter(vendor="CoNWeT", short_name="bae-marketplace", version="0.1.1", public=True).exists():
            updated = True
            log('Installing bae-marketplace mashup... ', 1, ending='')
            install_component(WgtFile(BAE_MASHUP), public=True)
            log('DONE', 1)

        return updated
