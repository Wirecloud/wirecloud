# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#

from django.db import models
from django.utils.translation import gettext_lazy as _


class Concept(models.Model):

    concept = models.CharField(_('Concept'), max_length=255, primary_key=True)
    SOURCE = (
        ('PLAT', _('Platform')),
        ('ADAP', _('Adaptor')),
    )
    source = models.CharField(_('Source'), max_length=4, choices=SOURCE)
    TYPE = (
        ('CCTX', _('Constant')),
        ('ECTX', _('External')),
        ('GCTX', _('iWidget')),
    )
    type = models.CharField(_('Type'), max_length=4, choices=TYPE)
    label = models.CharField(_('Label'), max_length=50, blank=False)
    description = models.TextField(_('Description'), blank=True)
    adaptor = models.CharField(_('Adaptor'), max_length=256, null=True)

    class Meta:
        app_label = 'wirecloud'

    def __unicode__(self):
        return unicode(self.concept) + ' ' + unicode(self.adaptor)


class ConceptName(models.Model):

    name = models.CharField(_('Name'), max_length=256)
    concept = models.ForeignKey(Concept, verbose_name=_('Concept'))

    class Meta:
        app_label = 'wirecloud'

    def __unicode__(self):
        return self.name


class Constant(models.Model):
    concept = models.ForeignKey(Concept, verbose_name=_('Concept'), unique=True, null=False)
    value = models.CharField(_('Value'), max_length=256)

    class Meta:
        app_label = 'wirecloud'

    def __unicode__(self):
        return self.concept.concept
