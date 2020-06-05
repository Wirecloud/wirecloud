# -*- coding: utf-8 -*-

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

from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue.utils import wgt_deployer


@receiver(pre_delete, sender=CatalogueResource)
def delete_file_on_resource_deletion(sender, instance, **kwargs):
    # Undeploy the resource from the filesystem
    try:
        wgt_deployer.undeploy(instance.vendor, instance.short_name, instance.version)
    except Exception:
        # TODO log this error
        pass  # ignore errors

    instance.invalidate_cache()


@receiver(post_save, sender=CatalogueResource)
def delete_files_on_resource_trahsing(sender, instance, created, raw, **kwargs):
    if not created and instance.template_uri == "":
        delete_file_on_resource_deletion(sender, instance)
