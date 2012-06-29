from catalogue.utils import add_resource_from_template
from commons.template import TemplateParser
from workspace.mashupTemplateGenerator import build_template_from_workspace
from wirecloud.markets.utils import MarketManager


class WirecloudCatalogueManager(MarketManager):

    def __init__(self, options):
        pass

    def publish_mashup(self, endpoint, published_workspace, user, publish_options):

        template = TemplateParser(build_template_from_workspace(publish_options, published_workspace.workspace, user))
        add_resource_from_template(published_workspace.get_template_url(), template, user)
