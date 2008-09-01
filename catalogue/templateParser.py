#-*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telefónica Investigación y Desarrollo 
#     S.A.Unipersonal (Telefónica I+D) 
# 
# Info about members and contributors of the MORFEO project 
# is available at: 
# 
#   http://morfeo-project.org/
# 
# This program is free software; you can redistribute it and/or modify 
# it under the terms of the GNU General Public License as published by 
# the Free Software Foundation; either version 2 of the License, or 
# (at your option) any later version. 
# 
# This program is distributed in the hope that it will be useful, 
# but WITHOUT ANY WARRANTY; without even the implied warranty of 
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
# GNU General Public License for more details. 
# 
# You should have received a copy of the GNU General Public License 
# along with this program; if not, write to the Free Software 
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
# 
# If you want to use this software an plan to distribute a 
# proprietary application in any way, and you are not licensing and 
# distributing your source code under GPL, you probably need to 
# purchase a commercial license of the product.  More info about 
# licensing options is available at: 
# 
#   http://morfeo-project.org/
#

from datetime import datetime

from commons.exceptions import TemplateParseException
from commons.http_utils import download_http_content 

from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _

from xml.sax import parseString, handler
from catalogue.models import GadgetWiring, GadgetResource, UserRelatedToGadgetResource


class TemplateParser:
    def __init__(self, uri, user):
        self.uri = uri
        self.xml = download_http_content(uri)
        self.handler = TemplateHandler(user, uri)

    def parse(self):
        # Parse the input
        parseString(self.xml, self.handler)


class TemplateHandler(handler.ContentHandler): 
    def __init__(self, user, uri):
        self._accumulator = []
        self._name = ""
        self._vendor = ""
        self._version = ""
        self._author = ""
        self._description = ""
        self._mail = ""
        self._imageURI = ""
        self._iPhoneImageURI = ""
        self._wikiURI = ""
        self._gadget_added = False
        self._user = user
        self._uri = uri

    def resetAccumulator(self):
        self._accumulator = []
    
    def processWire(self, attrs, wire):
        _friendCode = ''
        _wiring = ''

        if (attrs.has_key('friendcode')==True):
            _friendCode = attrs.get('friendcode')

        if (attrs.has_key('type')==False or attrs.has_key('name')==False):
            raise TemplateParseException(_("ERROR: missing attribute at Event or Slot element"))

        if (wire == 'Slot'):
            _wiring = 'in'

        if (wire == 'Event'):
            _wiring = 'out'

        if (_friendCode != '' and wire != ''):
            wiring = GadgetWiring( friendcode = _friendCode, wiring = _wiring,
                idResource_id = get_object_or_404(GadgetResource, 
                short_name=self._name,vendor=self._vendor,version=self._version).id)

            wiring.save()
        else:
            raise TemplateParseException(_("ERROR: missing attribute at Event or Slot element"))


    def endElement(self, name):
        if (name == 'Name'):
            self._name = self._accumulator[0]
            return
        if (name == 'Vendor'):
            self._vendor = self._accumulator[0]
            return
        if (name == 'Version'):
            self._version = self._accumulator[0]
            return
        if (name == 'Author'):
            self._author = self._accumulator[0]
            return
        if (name == 'Description'):
            self._description = self._accumulator[0]
            return
        if (name == 'Mail'):
            self._mail = self._accumulator[0]
            return
        if (name == 'ImageURI'):
            if (self._accumulator == []):
                self._imageURI = 'no_url'
            else:
                self._imageURI = self._accumulator[0]
            return
        if (name == 'iPhoneImageURI'):
            self._iPhoneImageURI = self._accumulator[0]
            return
        if (name == 'WikiURI'):
            self._wikiURI = self._accumulator[0]
            return

        if (self._name != '' and self._vendor != '' and self._version != '' and self._author != '' and self._description != '' and self._mail != '' and self._imageURI != '' and self._wikiURI != '' and not self._gadget_added):

            gadget=GadgetResource()
            gadget.short_name=self._name
            gadget.vendor=self._vendor
            gadget.version=self._version
            gadget.author=self._author
            gadget.description=self._description
            gadget.mail=self._mail
            gadget.image_uri=self._imageURI
            gadget.iphone_image_uri=self._iPhoneImageURI
            gadget.wiki_page_uri=self._wikiURI
            gadget.template_uri=self._uri
            gadget.creation_date=datetime.today()
            gadget.popularity = 0.0

            gadget.save()
            
            userRelated = UserRelatedToGadgetResource ()
            userRelated.gadget = gadget;
            userRelated.user = self._user
            userRelated.added_by = True
            
            userRelated.save()
            
            self._gadget_added = True
        elif (self._gadget_added):
            return
        else:
            raise TemplateParseException(_("ERROR: missing Resource description field at Resource element! Check schema!"))

    def characters(self, text):
        self._accumulator.append(text)

    def startElement(self, name, attrs):
        if (name == 'Name') or (name=='Version') or (name=='Vendor') or (name=='Author') or (name=='Description') or (name=='Mail') or (name=='ImageURI') or (name=='iPhoneImageURI') or (name=='WikiURI'):
            self.resetAccumulator()
            return

        if (name == 'Slot'):
            self.processWire(attrs,'Slot')
            return

        if (name == 'Event'):
            self.processWire(attrs,'Event')
            return
