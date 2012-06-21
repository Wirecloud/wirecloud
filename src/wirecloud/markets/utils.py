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

import json

from ezweb.plugins import get_plugins
from wirecloud.models import Market


class MarketManager:

    def __init__(self, options):
        pass

    def publish_mashup(self, endpoint, published_workspace, user, publish_options):
        pass



_market_classes = None

def get_market_classes():
    global _market_classes

    if _market_classes == None:
        _market_classes = {}
        plugins = get_plugins()

        for plugin in plugins:
            _market_classes.update(plugin.get_market_classes())

    return _market_classes

_managers = None

def get_market_managers():
    global _managers

    manager_classes = get_market_classes()

    _managers = {}
    for market in Market.objects.all():
        options = json.loads(market.options)
        if options['type'] in manager_classes:
            _managers[market.name] = manager_classes[options['type']](options)

    return _managers
