# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

import json

from django.db.models import Q

from wirecloud.platform.models import Market
from wirecloud.platform.plugins import get_plugins


class MarketManager:

    def __init__(self, user, name, options):
        pass

    def publish_mashup(self, endpoint, published_workspace, user, publish_options):
        pass


_market_classes = None
_local_catalogue = None


def get_market_classes():
    global _market_classes

    if _market_classes is None:
        _market_classes = {}
        plugins = get_plugins()

        for plugin in plugins:
            _market_classes.update(plugin.get_market_classes())

    return _market_classes


def get_local_catalogue():
    global _local_catalogue

    if _local_catalogue is None:

        manager_classes = get_market_classes()
        _local_catalogue = manager_classes['wirecloud'](None, 'local', {'name': 'local', 'type': 'wirecloud', 'url': None})

    return _local_catalogue


def get_market_managers(user):

    manager_classes = get_market_classes()

    managers = {}
    for market in Market.objects.filter(Q(user=None) | Q(user=user)):
        options = json.loads(market.options)
        if market.user is None:
            user = None
        else:
            user = market.user.username

        if options['type'] in manager_classes:
            managers[unicode(market)] = manager_classes[options['type']](user, market.name, options)

    return managers
