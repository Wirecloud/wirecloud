# -*- coding: utf-8 -*-

from django.db import models
from django.utils.translation import gettext_lazy as _


class Constant(models.Model):

    scope = models.CharField(_('Scope'), max_length=20, null=False, blank=False)
    concept = models.CharField(_('Concept'), max_length=255, null=False, blank=False)
    value = models.CharField(_('Value'), max_length=256)

    class Meta:
        unique_together = (('scope', 'concept'),)
        app_label = 'platform'
        db_table = 'wirecloud_constant'

    def __unicode__(self):
        return self.concept.concept
