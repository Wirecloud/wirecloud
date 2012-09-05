# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

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

from catalogue.utils import add_resource_from_template
from wirecloud.workspace.mashupTemplateGenerator import build_template_from_workspace
from wirecloud.markets.utils import MarketManager
from wirecloudcommons.utils.template import TemplateParser


class WirecloudCatalogueManager(MarketManager):

    def __init__(self, options):
        pass

    def publish_mashup(self, endpoint, published_workspace, user, publish_options, request=None):

        template = TemplateParser(build_template_from_workspace(publish_options, published_workspace.workspace, user))
        add_resource_from_template(published_workspace.get_template_url(request), template, user)
