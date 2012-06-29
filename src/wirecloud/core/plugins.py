from wirecloud import VERSION
from wirecloud.plugins import WirecloudPlugin

from wirecloud.core.catalogue_manager import WirecloudCatalogueManager


class WirecloudCorePlugin(WirecloudPlugin):

    features = {
        'Wirecloud': '.'.join(map(str, VERSION)),
    }

    def get_market_classes(self):
        return {
            'wirecloud': WirecloudCatalogueManager,
        }

    def get_ajax_endpoints(self, views):
        return (
            {'id': 'MARKET_COLLECTION', 'url': '/markets'},
            {'id': 'MARKET_ENTRY', 'url': '/market/#{market}'},
            {'id': 'WIRING_ENTRY', 'url': '/workspace/#{id}/wiring'},
        )
