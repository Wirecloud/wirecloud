# -*- coding: utf-8 -*-

# Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

import inspect
from importlib import import_module

from haystack import signals, indexes
from django.contrib.auth.models import User
from django.db import models

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.models import Organization
from wirecloud.platform.models import Workspace


class WirecloudSignalProcessor(signals.BaseSignalProcessor):

    def __init__(self, connections, connection_router):
        from django.conf import settings

        self.models = []
        for app in settings.INSTALLED_APPS:

            search_indexes = '%s.search_indexes' % app
            try:
                mod = import_module(search_indexes)
            except (NameError, ImportError, SyntaxError):
                continue
            self.models += [cls.model for name, cls in mod.__dict__.items() if inspect.isclass(cls) and issubclass(cls, indexes.SearchIndex) and issubclass(cls, indexes.Indexable)]

        super(WirecloudSignalProcessor, self).__init__(connections, connection_router)

    def handle_org(self, *args, **kwargs):
        kwargs["instance"] = kwargs['instance'].user
        kwargs["sender"] = User
        self.handle_save(*args, **kwargs)

    def setup(self):

        from django.conf import settings

        for model in self.models:
            models.signals.post_save.connect(self.handle_save, sender=model)
            models.signals.post_delete.connect(self.handle_delete, sender=model)

        # TODO manual list of m2m relations => automate field discovering
        models.signals.post_save.connect(self.handle_org, sender=Organization)

        if "wirecloud.catalogue" in settings.INSTALLED_APPS:
            models.signals.m2m_changed.connect(self.handle_m2m_change, sender=CatalogueResource.users.through)
            models.signals.m2m_changed.connect(self.handle_m2m_change, sender=CatalogueResource.groups.through)

        if "wirecloud.platform" in settings.INSTALLED_APPS:
            models.signals.m2m_changed.connect(self.handle_m2m_change, sender=Workspace.users.through)
            models.signals.m2m_changed.connect(self.handle_m2m_change, sender=Workspace.groups.through)

    def teardown(self):

        from django.conf import settings

        # TODO manual list of m2m relations => automate field discovering
        if "wirecloud.platform" in settings.INSTALLED_APPS:
            models.signals.m2m_changed.disconnect(self.handle_m2m_change, sender=Workspace.users.through)
            models.signals.m2m_changed.disconnect(self.handle_m2m_change, sender=Workspace.groups.through)

        if "wirecloud.catalogue" in settings.INSTALLED_APPS:
            models.signals.m2m_changed.disconnect(self.handle_m2m_change, sender=CatalogueResource.users.through)
            models.signals.m2m_changed.disconnect(self.handle_m2m_change, sender=CatalogueResource.groups.through)

        models.signals.post_save.disconnect(self.handle_org, sender=Organization)

        for model in self.models:
            models.signals.post_save.disconnect(self.handle_save, sender=model)
            models.signals.post_delete.disconnect(self.handle_delete, sender=model)

    def handle_m2m_change(self, sender, instance, action, reverse, model, pk_set, using, **kwargs):

        if reverse or action.startswith('post_') or (pk_set is not None and len(pk_set) == 0):
            self.handle_save(instance.__class__, instance)
