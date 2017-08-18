# -*- coding: utf-8 -*-

# Copyright (c) 2013 Conwet Lab., Universidad Politécnica de Madrid
# Copyright (c) 2013 Center for Open Middleware

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

import logging

from django.dispatch import receiver

from wirecloud.platform.localcatalogue.signals import resource_installed, resource_uninstalled
from wirecloud.semanticwiring.semantics import add_widget_semantic_data, remove_widget_semantic_data


@receiver(resource_installed)
def resource_installed(sender, **kwargs):

    user = kwargs.get('user', None)
    if sender.resource_type() != 'widget' or user is None:
        return

    # add semantic relations
    try:
        add_widget_semantic_data(user, sender)
    except:
        logger = logging.getLogger('wirecloud.semanticwiring')
        logger.exception('Error adding widget to the semantic status')


@receiver(resource_uninstalled)
def resource_uninstalled(sender, **kwargs):

    user = kwargs.get('user', None)
    if sender.resource_type() != 'widget' or user is None:
        return

    # remove semantic relations
    try:
        remove_widget_semantic_data(user, sender)
    except:
        logger = logging.getLogger('wirecloud.semanticwiring')
        logger.exception('Error removing widget from the semantic status')
