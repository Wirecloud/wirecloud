# -*- coding: utf-8 -*-

# Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.wgt import WgtFile


@receiver(post_save, sender=CatalogueResource)
def deploy_operators_on_resource_creation(sender, instance, created, raw, **kwargs):

    from wirecloud.catalogue import utils as catalogue_utils
    import wirecloud.platform.widget.utils as showcase_utils

    resource = instance
    if not created or raw or resource.resource_type() != 'operator':
        return

    base_dir = catalogue_utils.wgt_deployer.get_base_dir(resource.vendor, resource.short_name, resource.version)
    wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))

    showcase_utils.wgt_deployer.deploy(wgt_file)


@receiver(post_delete, sender=CatalogueResource)
def undeploy_operators_on_resource_deletion(sender, instance, **kwargs):

    import wirecloud.platform.widget.utils as showcase_utils

    resource = instance
    if resource.resource_type() != 'operator':
        return

    try:
        showcase_utils.wgt_deployer.undeploy(resource.vendor, resource.short_name, resource.version)
    except:
        # TODO log this error
        pass  # ignore errors
