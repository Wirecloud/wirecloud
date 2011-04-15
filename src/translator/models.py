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
from django.db import models
from django.utils.translation import get_language, ugettext as  _

from commons.translation_utils import get_trans_index


# translated models cache
_translated_models_cache = {}


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

                if not index in index_mapping:
                    index_mapping[index] = []

                index_mapping[index].append(field.attname)

        data = {}

        if table not in _translated_models_cache:
            _translated_models_cache[table] = {
                'default': {},
            }
            for attr_trans in Translation.objects.filter(table=table):
                if attr_trans.default:
                    try:
                        _translated_models_cache[table]['default'][attr_trans.element_id].append(attr_trans)
                    except KeyError:
                        _translated_models_cache[table]['default'][attr_trans.element_id] = [attr_trans]

                if attr_trans.language not in _translated_models_cache[table]:
                    _translated_models_cache[table][attr_trans.language] = {}

                try:
                    _translated_models_cache[table][attr_trans.language][attr_trans.element_id].append(attr_trans)
                except KeyError:
                    _translated_models_cache[table][attr_trans.language][attr_trans.element_id] = [attr_trans]

        elif pk not in _translated_models_cache[table]['default']:
            for attr_trans in Translation.objects.filter(table=table, element_id=pk):
                if attr_trans.default:
                    try:
                        _translated_models_cache[table]['default'][attr_trans.element_id].append(attr_trans)
                    except KeyError:
                        _translated_models_cache[table]['default'][attr_trans.element_id] = [attr_trans]

                if attr_trans.language not in _translated_models_cache[table]:
                    _translated_models_cache[table][attr_trans.language] = {}

                try:
                    _translated_models_cache[table][attr_trans.language][attr_trans.element_id].append(attr_trans)
                except KeyError:
                    _translated_models_cache[table][attr_trans.language][attr_trans.element_id] = [attr_trans]

        # add default values
        try:
            attr_trans = _translated_models_cache[table]['default'][pk]
            for element in attr_trans:
                if element.text_id in index_mapping:
                    attnames = index_mapping[element.text_id]
                    for attname in attnames:
                        data[attname] = element.value
        except KeyError:
            pass  # no data in default language

        # add specific values
        try:
            attr_trans = _translated_models_cache[table][language][pk]
            for element in attr_trans:
                if element.text_id in index_mapping:
                    attnames = index_mapping[element.text_id]
                    for attname in attnames:
                        data[attname] = element.value
        except KeyError:
            pass  # no data in language

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
