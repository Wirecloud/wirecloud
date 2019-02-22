# -*- coding: utf-8 -*-

# Copyright 2008-2017 Universidad Politécnica de Madrid

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

from django.contrib.auth.signals import user_logged_in
from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.iwidget.models import IWidget
from wirecloud.platform.widget.models import Widget
from wirecloud.platform.preferences.models import update_session_lang
from wirecloud.platform.widget.utils import create_widget_from_wgt


@receiver(user_logged_in)
def setup_language_from_preferences(sender, **kwargs):
    update_session_lang(kwargs['request'], kwargs['user'])


@receiver(post_save, sender=CatalogueResource)
def create_widget_on_resource_creation(sender, instance, created, raw, **kwargs):

    if not created or raw:
        return

    resource = instance
    if resource.resource_type() == 'widget':
        try:
            resource.widget
        except Widget.DoesNotExist:
            base_dir = catalogue.wgt_deployer.get_base_dir(resource.vendor, resource.short_name, resource.version)
            wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))
            resource.widget = create_widget_from_wgt(wgt_file, resource.creator)

        # Restore any iwidget associated with this widget
        IWidget.objects.filter(widget_uri=resource.local_uri_part).update(widget=resource.widget)


@receiver(pre_delete, sender=CatalogueResource)
def delete_widget_on_resource_deletion(sender, instance, using, **kwargs):
    if instance.resource_type() == 'widget':
        try:
            instance.widget.delete()
        except Widget.DoesNotExist:
            pass
