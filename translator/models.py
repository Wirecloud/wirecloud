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
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

from django.utils.translation import get_language, ugettext as  _
from commons.translation_utils import get_trans_index
class TransModel(models.Model):
    
    def __getattribute__(self, attr):
        language_ = get_language()[:2]
        value = object.__getattribute__(self, attr)
        index = get_trans_index(value)
        if index:
            # retrieve the translation
            try:
                id_ = object.__getattribute__(self, "id")
                table_ = object.__getattribute__(self, "__class__").__module__+"."+object.__getattribute__(self, "__class__").__name__
                attr_trans = Translation.objects.filter(text_id=index,element_id=id_, table=table_, language=language_)
                if (attr_trans.count() > 0):
                    return attr_trans[0].value
                else:
                    #get the default value
                    attr_trans = Translation.objects.filter(text_id=index, element_id=id_, table=table_, default=True)
                    if (attr_trans.count() > 0):
                        return attr_trans[0].value
                    # there isn't a default value -> it musn't be possible because it is ensured during the template parser 
                    return value
            except ObjectDoesNotExist, e:
                # this attribute doesn't exist
                raise AttributeError
        else:
             # the element don't need to be translated
             return value
    
#===============================================================================
#    def get_translate_fields(self):
#        id_ = object.__getattribute__(self, "id")
#        table_ = object.__getattribute__(self, "__class__").__module__+"."+object.__getattribute__(self, "__class__").__name_
#        attr_trans = Translation.objects.filter(element_id=id_,table=table_)
#        
#        #retrieve the values
#        fields_per_lang = {}
#        for element in attr_trans:
#            fields_per_lang[element.language].append({"id":id_, "table":table_, "attribute":element.attribute, "value":element.value})
#        
#        #add default values
#        translate_attr = object.__getattribute__(self, "_meta").translate
#        for attr in translate_attr:
#            fields_per_lang["default"].append({"id":id_, "table":table_, "attribute":attr, "value":object.__getattribute__(self, attr), "widget":object.__getattribute__("_meta").get_field(attr).formfield().widget})
#        return fields_per_lang
#===============================================================================
    
    class Meta:
        abstract = True
            

class Translation(models.Model):
    text_id = models.CharField(_('Text Identifier'), max_length=250)
    element_id = models.IntegerField(_('Object Identifier'))
    table = models.CharField(_('Model'), max_length=250)
    language = models.CharField(_('Language'), choices=settings.LANGUAGES, max_length=2)
    default = models.BooleanField(_('Default Value'), default=False)
    value = models.TextField(_('Value'), null=True)
    
    def __unicode__(self):
         return self.text_id + " - " + self.table + "." + str(self.element_id) + " -> " + self.language
