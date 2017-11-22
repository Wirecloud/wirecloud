from haystack import signals, indexes
import inspect
from importlib import import_module
from django.db import models
from wirecloud.catalogue.models import CatalogueResource


class WirecloudRealtimeSignalProcessor(signals.BaseSignalProcessor):

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

        super(WirecloudRealtimeSignalProcessor, self).__init__(connections, connection_router)

    def setup(self):

        for model in self.models:
            models.signals.post_save.connect(self.handle_save, sender=model)
            models.signals.post_delete.connect(self.handle_delete, sender=model)

        models.signals.m2m_changed.connect(self.handle_m2m_change, sender=CatalogueResource.users.through)
        models.signals.m2m_changed.connect(self.handle_m2m_change, sender=CatalogueResource.groups.through)

    def teardown(self):

        models.signals.m2m_changed.disconnect(self.handle_m2m_change, sender=CatalogueResource.users.through)
        models.signals.m2m_changed.disconnect(self.handle_m2m_change, sender=CatalogueResource.groups.through)

        for model in self.models:
            models.signals.post_save.disconnect(self.handle_save, sender=model)
            models.signals.post_delete.disconnect(self.handle_delete, sender=model)

    def handle_m2m_change(self, sender, instance, action, reverse, model, pk_set, using, **kwargs):

        if reverse or action.startswith('post_') or (pk_set is not None and len(pk_set) == 0):
            self.handle_save(instance.__class__, instance)