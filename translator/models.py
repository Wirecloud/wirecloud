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

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.utils.translation import get_language, ugettext as  _

from commons.translation_utils import get_trans_index


class TranslatedModel(object):

    __instance = None

    def __init__(self, instance, data):
        self.__instance = instance
        for attr in data:
            setattr(self, attr, data[attr])

    def __getattr__(self, attr):
        return getattr(self.__instance, attr)

    def __setattribute(self, attr):
        raise AttributeError('TranslatedModel object is read-only')


class TransModel(models.Model):

    def get_translated_model(self):
        language = get_language()[:2]
        pk = self.pk
        table = self.__class__.__module__ + "." + self.__class__.__name__

        index_mapping = {}
        for field in iter(self._meta.fields):
            index = get_trans_index(getattr(self, field.attname))
            if index:
                index_mapping[index] = field.attname

        data = {}

        # add default values
        attr_trans = Translation.objects.filter(element_id=pk, table=table, default=True)
        for element in attr_trans:
            if element.text_id in index_mapping:
                attname = index_mapping[element.text_id]
                data[attname] = element.value

        # add specific values
        attr_trans = Translation.objects.filter(element_id=pk, table=table, language=language)
        for element in attr_trans:
            if element.text_id in index_mapping:
                attname = index_mapping[element.text_id]
                data[attname] = element.value

        return TranslatedModel(self, data)

    class Meta:
        abstract = True


class Translation(models.Model):

    text_id = models.CharField(_('Text Identifier'), max_length=250)
    element_id = models.IntegerField(_('Object Identifier'))
    table = models.CharField(_('Model'), max_length=250)
    language = models.CharField(_('Language'), choices=settings.LANGUAGES, max_length=2, blank=False)
    default = models.BooleanField(_('Default Value'), default=False)
    value = models.TextField(_('Value'), blank=True)

    def __unicode__(self):
        return u"%s - %s.%d -> %s" % (self.text_id, self.table, self.element_id, self.language)
