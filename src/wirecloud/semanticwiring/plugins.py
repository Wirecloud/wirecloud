from wirecloud.platform.plugins import WirecloudPlugin

class SemanticWiringPlugin(WirecloudPlugin):

    features = {
        'SemanticWiring': '0.1',
    }

    def get_scripts(self, view):
        if view == 'index':
            return (
                'js/wirecloud/ui/SemanticRecommendations.js',
            )
        else:
            return ()

    def get_ajax_endpoints(self, view):

        from django.conf import settings
        if view == 'index':
            return (
                {'id': 'SEMANTIC_MATCHING_SERVICE', 'url': settings.SEMANTIC_MATCHING_SERVICE},
            )
        else:
            return ()
