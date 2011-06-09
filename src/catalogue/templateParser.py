#-*- coding: utf-8 -*-

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

import re
import string

from datetime import datetime
from xml.sax import parseString, handler

from django.contrib.auth.models import Group
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _

from catalogue.models import GadgetWiring, CatalogueResource, UserTag, UserVote, Tag, Capability
from catalogue.catalogue_utils import get_all_resource_versions, update_resource_popularity
from commons.exceptions import TemplateParseException
from commons.translation_utils import get_trans_index
from commons.user_utils import get_certification_status
from translator.models import Translation
from workspace.utils import create_published_workspace_from_template


def checkEmptyFields(fields, obj):
    missingFields = []
    for field in fields:
        if not field in obj or obj.get(field).strip() == '':
            missingFields.append(field)

    return missingFields


class TemplateParser:

    def __init__(self, uri, xml, user, save=True, fromWGT=False):

        self.xml = xml
        self.uri = uri
        self.handler = TemplateHandler(xml, user, uri, save, fromWGT)

    def parse(self):
        # Parse the input
        parseString(self.xml, self.handler)

    def is_contratable(self):
        return self.handler._contratable

    def get_gadget(self):
        return self.handler.get_gadget()


class TemplateHandler(handler.ContentHandler):

    def __init__(self, xml, user, uri, save, fromWGT):
        self.save = save
        self._xml = xml
        self._accumulator = []
        self._name = ""
        self._displayName = ""
        self._vendor = ""
        self._version = ""
        self._author = ""
        self._description = ""
        self._mail = ""
        self._imageURI = ""
        self._iPhoneImageURI = ""
        self._wikiURI = ""
        self._is_mashup = False
        self._includedResources = []
        self._gadget_added = False
        self._user = user
        self._uri = uri
        self._gadget = None
        self._contratable = False
        self._id = -1

        #Organizations
        self._organization_list = []

        #translation attributes
        self.translatable_list = []
        self.translated_list = []
        self.lang_list = []
        self.default_lang = ""
        self.current_lang = ""
        self.current_text = ""

        self.fromWGT = fromWGT

    def get_gadget(self):
        if not self.save:
            self._gadget.id = -1

            return self._gadget

        if self._gadget.id:
            return self._gadget

        gadget = self._gadget

        valid_gadget = CatalogueResource.objects.get(vendor=gadget.vendor, short_name=gadget.short_name, version=gadget.version)

        return valid_gadget

    def resetAccumulator(self):
        self._accumulator = []

    def processWire(self, attrs, wire):
        _friendCode = ''
        _wiring = ''
        if 'friendcode' in attrs:
            _friendCode = attrs['friendcode']

        if 'type' not in attrs or 'name' not in attrs:
            raise TemplateParseException(_("ERROR: missing attribute at Event or Slot element"))

        if wire == 'Slot':
            _wiring = 'in'

        if wire == 'Event':
            _wiring = 'out'

        if _friendCode != '' and wire != '':
            if self.save:
                wiring = GadgetWiring(friendcode=_friendCode, wiring=_wiring,
                                      idResource_id=get_object_or_404(CatalogueResource,
                                                                      short_name=self._name,
                                                                      vendor=self._vendor,
                                                                      version=self._version).id)

                wiring.save()
        else:
            raise TemplateParseException(_("ERROR: missing attribute at Event or Slot element"))

    def processCapability(self, attrs):
        name = None
        value = None

        if 'name' in attrs:
            name = attrs['name']

        if 'value' in attrs:
            value = attrs['value']

        if not name or not value:
            raise TemplateParseException(_("ERROR: missing attribute at Capability element"))

        if not self._gadget:
            raise TemplateParseException(_("ERROR: capabilities must be placed AFTER Resource definition!"))

        if self.save:
            capability = Capability(name=name.lower(), value=value.lower(), resource=self._gadget)

            capability.save()

        if capability.name.lower() == 'contratable':
            self._contratable = True

    def processOrganization(self, organization_accumulator):
        if not organization_accumulator:
            #Not specifying organization is valid!
            return

        organization_name = organization_accumulator[0]

        organization, created = Group.objects.get_or_create(name__iexact=organization_name)

        self._organization_list.append(organization)

    def processVersion(self, version_accumulator):
        if version_accumulator:
            # format 'XX.XX[.XX]*'
            if re.match('^(?:[1-9]\d*\.|0\.)*(?:[1-9]\d*|0)$', version_accumulator[0]):
                self._version = version_accumulator[0]
            else:
                raise TemplateParseException(_('ERROR: the format of the version number is invalid. Format: X.X.X where X is an integer. Ex. "0.1", "1.11" NOTE: "1.01" should be changed to "1.0.1" or "1.1"'))
        else:
            raise TemplateParseException(_("ERROR: missing Resource version"))

    def processMashupResource(self, attrs):
        missingFields = checkEmptyFields(['vendor', 'name', 'version', 'title'], attrs)
        if missingFields:
            raise TemplateParseException(_("ERROR: the following attributes are missing in a Resource element: %(fields)") % {'fields': missingFields})

    def processTranslations(self, attrs):
        if 'default' in attrs:
            self.default_lang = attrs.get('default')
        else:
            raise TemplateParseException(_("ERROR: missing the 'default' attribute at Translations element"))

    def processTranslation(self, attrs):
        if 'lang' in attrs:
            self.current_lang = attrs.get('lang')
            self.lang_list.append(self.current_lang)
        else:
            raise TemplateParseException(_("ERROR: missing the language attribute at Translation element"))

    def processMsg(self, attrs):
        if 'name' in attrs:
            self.current_text = attrs['name']
        else:
            raise TemplateParseException(_("ERROR: missing the language attribute at Translation element"))

    def addIndex(self, index):
        #add index to the translation list

        if len(index):
            value = get_trans_index(index[0])
            if value and not value in self.translatable_list:
                self.translatable_list.append(value)
            return value

    def endElement(self, name):
        if not self._gadget_added:
            #add index to the translation list
            value = self.addIndex(self._accumulator)

        if name == 'Name':
            if value:
                raise TemplateParseException(_("ERROR: The element Name cannot be translated"))
            self._name = self._accumulator[0]
            return
        if name == 'DisplayName':
            self._displayName = self._accumulator[0]
            return
        if name == 'Organization':
            self.processOrganization(self._accumulator)
            return
        if name == 'Vendor':
            if value:
                raise TemplateParseException(_("ERROR: The element Vendor cannot be translated"))
            self._vendor = self._accumulator[0]
            return
        if name == 'Version':
            if value:
                raise TemplateParseException(_("ERROR: The element Version cannot be translated"))
            self.processVersion(self._accumulator)
            return
        if name == 'Author':
            self._author = self._accumulator[0]
            return
        if name == 'Description':
            self._description = string.join(self._accumulator, "")
            return
        if name == 'Mail':
            self._mail = self._accumulator[0]
            return
        if name == 'ImageURI':
            if self._accumulator == []:
                self._imageURI = ''
            else:
                self._imageURI = self._accumulator[0]
            return
        if name == 'iPhoneImageURI':
            if self._accumulator == []:
                self._iPhoneImageURI = ''
            else:
                self._iPhoneImageURI = self._accumulator[0]
            return
        if name == 'WikiURI':
            if self._accumulator == []:
                self._wikiURI = ''
            else:
                self._wikiURI = self._accumulator[0]
            return

        if name in ('Tab', 'Position', 'Rendering', 'Preference', 'Property', 'IncludedResources', 'Resource', 'Capability', 'Param'):
            return

        if name == 'Catalog.ResourceDescription':

            if self._gadget_added:
                return

            required_fields = []
            if self._name == '':
                required_fields.append('name')
            if self._vendor == '':
                required_fields.append('vendor')
            if self._version == '':
                required_fields.append('version')
            if self._author == '':
                required_fields.append('author')
            if self._description == '':
                required_fields.append('description')
            if self._mail == '':
                required_fields.append('mail')
            if self._imageURI == '':
                required_fields.append('imageURI')
            if self._wikiURI == '':
                required_fields.append('wikiURI')

            if len(required_fields) > 0:
                raise TemplateParseException(_("ERROR: The following fields are missing in resource description: %(fields)s") % {'fields': required_fields})

            gadget = CatalogueResource()

            gadget.short_name = self._name
            gadget.display_name = self._displayName
            gadget.vendor = self._vendor
            gadget.version = self._version
            gadget.author = self._author
            gadget.description = self._description
            gadget.mail = self._mail
            gadget.image_uri = self._imageURI
            gadget.iphone_image_uri = self._iPhoneImageURI
            gadget.wiki_page_uri = self._wikiURI
            gadget.template_uri = self._uri
            gadget.creation_date = datetime.today()
            gadget.popularity = '0.0'
            gadget.fromWGT = self.fromWGT

            # Checking certification status
            gadget.certification = get_certification_status(self._user)

            gadget.creator = self._user

            self._gadget = gadget

            if self.save and self._is_mashup:
                published_mashup = create_published_workspace_from_template(self._xml, gadget, self._contratable, self._user)
                gadget.mashup_id = published_mashup.id

            if self.save:
                gadget.save()

            if self.save:
                # A gadget belongs to many organizations
                for organization in self._organization_list:
                    gadget.organization.add(organization)

                # TODO: process the resources
                # workaround to add default tags
                if self._is_mashup:
                    tag, created = Tag.objects.get_or_create(name="mashup")
                    userTag = UserTag(tag=tag, idUser=self._user, idResource=gadget)
                    userTag.save()

                if self._contratable:
                    tag, created = Tag.objects.get_or_create(name="contratable")
                    userTag = UserTag(tag=tag, idUser=self._user, idResource=gadget)
                    userTag.save()

                # Copy all UserTag and UserVote entry from previous version
                resource_versions = get_all_resource_versions(self._vendor, self._name)

                resource_version = map(int, gadget.version.split('.'))
                previous_versions = [v for v in resource_versions if v < resource_version]
                if len(previous_versions) > 0:
                    previous_version_string = '.'.join(map(str, max(previous_versions)))
                    previousVersion = CatalogueResource.objects.get(vendor=self._vendor, short_name=self._name, version=previous_version_string)

                    previousUserTags = UserTag.objects.filter(idResource=previousVersion)

                    for previousUserTag in previousUserTags:
                        newUserTag, created = UserTag.objects.get_or_create(tag=previousUserTag.tag, idUser=previousUserTag.idUser, idResource=gadget)

                    previousUserVotes = UserVote.objects.filter(idResource=previousVersion)

                    for previousUserVote in previousUserVotes:
                        newUserVote = UserVote(idUser=previousUserVote.idUser, vote=previousUserVote.vote, idResource=gadget)
                        newUserVote.save()

                    update_resource_popularity(gadget)

            self._gadget_added = True

        elif self._gadget_added and name == "msg":
            if not self.current_text in self.translatable_list:
                #message not used in the catalogue
                return
            if self.current_lang == self.default_lang:
                self.translated_list.append(self.current_text)

            table_ = self._gadget.__class__.__module__ + "." + self._gadget.__class__.__name__
            trans = Translation(text_id=self.current_text, element_id=self._gadget.id, table=table_, language=self.current_lang, value=self._accumulator[0], default=(self.current_lang == self.default_lang))
            trans.save()
        elif self._gadget_added and name == "Translation":

            if self.current_lang == self.default_lang:
                self.missing_translations = []

                for ind in self.translatable_list:
                    if not ind in self.translated_list:
                        self.missing_translations.append(ind)
                    else:
                        self.translated_list.remove(ind)

                if len(self.missing_translations) > 0:
                    raise TemplateParseException(_("ERROR: the following translation indexes need a default value: " + ', '.join(self.missing_translations)))

                # No triggered as not used indexes are currently filtered
                if len(self.translated_list) > 0:
                    raise TemplateParseException(_("ERROR: the following translation indexes are not used: " + str(self.translated_list)))

        elif self._gadget_added and (name == "Translations"):
            if len(self.lang_list) > 0 and not self.default_lang in self.lang_list:
                raise TemplateParseException(_("ERROR: There isn't a Translation element with the default language (%(default_lang)s) translations") % {'default_lang': self.default_lang})
        elif self._gadget_added:
            return
        else:
            raise TemplateParseException(_("ERROR: missing Resource description field at Resource element! Check schema!"))

    def characters(self, text):
        self._accumulator.append(text)

    def startElement(self, name, attrs):
        if name in ('Name', 'Version', 'Vendor', 'DisplayName', 'Author',
                    'Description', 'Mail', 'ImageURI', 'iPhoneImageURI',
                    'WikiURI', 'DisplayName', 'Organization'):
            self.resetAccumulator()
            return

        if name in ('Slot', 'Event'):
            self.processWire(attrs, name)
            return

        if name == 'IncludedResources':
            self._is_mashup = True
            return

        if name == 'Resource':
            self.processMashupResource(attrs)
            return

        if name == 'Capability':
            self.processCapability(attrs)
            return

        #Translation elements
        if name == 'Translations':
            self.processTranslations(attrs)
            return
        if name == 'Translation':
            self.processTranslation(attrs)
            return
        if name == 'msg':
            self.resetAccumulator()
            self.processMsg(attrs)
            return
