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

from os import path, environ
from xml.sax import parseString, handler

from django.conf import settings
from django.db import transaction
from django.template import Context, Template
from django.utils.translation import ugettext as _

from gadgetCodeParser import GadgetCodeParser
from gadget.models import VariableDef, ContextOption, UserPrefOption, Gadget, XHTML

from commons.exceptions import TemplateParseException
from commons.http_utils import download_http_content


class TemplateParser:
    def __init__(self, uri):
        self.uri = uri
        self.xml = download_http_content(uri)
        self.handler = None
        self.uriHandler = UriGadgetHandler ()
        parseString(self.xml, self.uriHandler)

    def parse(self):
        # Parse the input
        self.handler = TemplateHandler()
        parseString(self.xml, self.handler)
        
    def getGadget (self):
        return self.handler._gadget 

    def getGadgetName (self):
        if not self.handler:
            return self.uriHandler._gadgetName 
        return self.handler._gadgetName 

    def getGadgetVersion (self):
        if not self.handler:
            return self.uriHandler._gadgetVersion
        return self.handler._gadgetVersion

    def getGadgetVendor (self):
        if not self.handler:
            return self.uriHandler._gadgetVendor
        return self.handler._gadgetVendor
    
    def getGadgetUri (self):
        if not self.handler:
            return self.uriHandler._gadgetURI
        return self.handler._gadgetURI

class UriGadgetHandler(handler.ContentHandler):
        
    def __init__(self):
        self._accumulator = []
        self._gadgetName = ""
        self._gadgetVersion = ""
        self._gadgetVendor = ""
        self._gadgetURI = ""
        
    def startElement(self, name, attrs):
        # Catalogue
        if (name == 'Name') or (name=='Version') or (name=='Vendor'):
            self.reset_Accumulator()
            return

    def endElement(self, name):
        if (name == 'Catalog.ResourceDescription'):
            
            self._gadgetURI = "/gadgets/" + self._gadgetVendor + "/" + self._gadgetName + "/" + self._gadgetVersion
            
            return

        if (name == 'Name'):
            self._gadgetName = self._accumulator
            return

        if (name == 'Version'):
            self._gadgetVersion = self._accumulator
            return

        if (name == 'Vendor'):
            self._gadgetVendor = self._accumulator
            return

    def characters(self, text):
        if (len(text) == 0):
            return

        if (text[0] == '\n' or text[0] == '\r' or text[0] == '\t'):
            return

        if (text == '    '):
            return

        self._accumulator += text

    def endDocument(self):
        emptyRequiredFields = []
        if self._gadgetName == "":
            emptyRequiredFields.append("name");
        
        if self._gadgetVendor == "":
            emptyRequiredFields.append("vendor");

        if self._gadgetVersion == "":
            emptyRequiredFields.append("version");

        if len(emptyRequiredFields) > 0:
            print emptyRequiredFields
            raise TemplateParseException(_("Missing required field(s): %(fields)s") % {fields: unicode(emptyRequiredFields)})
                 
    def reset_Accumulator(self):
        self._accumulator = ""
        

class TemplateHandler(handler.ContentHandler):
    _SLOT = "SLOT"
    _EVENT = "EVEN"
        
    def __init__(self):
        self._relationships = []
        self._accumulator = []
        self._link = []
        self._gadgetName = ""
        self._gadgetVersion = ""
        self._gadgetVendor = ""
        self._gadgetImage = ""
        self._gadgetIPhoneImage = ""
        self._gadgetWiki = ""
        self._gadgetAuthor = ""
        self._gadgetMail = ""
        self._gadgetDesc = ""
        self._gadgetWidth= ""
        self._gadgetHeight= ""
        self._gadgetURI = ""
        self._xhtml = ""
        self._lastPreference = ""
        self._gadget = Gadget ()
        
    def typeText2typeCode (self, typeText):
        if typeText == 'text':
                return 'S'
        elif typeText == 'number':
                return 'N'
        elif typeText == 'date':
                return 'D'
        elif typeText == 'boolean':
                return 'B'
        elif typeText == 'list':
                return 'L'
        elif typeText == 'password':
                return 'P'
        else:
            raise TemplateParseException(_(u"ERROR: unkown TEXT TYPE ") + typeText)


    def processProperty(self, attrs):
        _name = ''
        _type = ''
        _description = ''

        if (attrs.has_key('name')):
            _name = attrs.get('name')

        if (attrs.has_key('type')):
            _type = attrs.get('type')

        if (attrs.has_key('description')):
            _description = attrs.get('description')

        if (_name != '' and _type != ''):
            vDef = VariableDef ( name = _name, description =_description,
                                 type=self.typeText2typeCode(_type), 
                                 aspect = 'PROP', friend_code = None, 
                                 gadget = self._gadget )

            #vDef.save()
            relationship_eltos = {}
            relationship_eltos['vdef'] = vDef
            relationship_eltos['context'] = None
            relationship_eltos['option'] = []
            self._relationships.append(relationship_eltos)
            
        else:
            raise TemplateParseException(_(u"ERROR: missing attribute at Property element"))

    def processPreference(self, attrs):
        _name = ''
        _type = ''
        _description = ''
        _label = ''
        _default_value = ''

        if (attrs.has_key('name')):
            _name = attrs.get('name')

        if (attrs.has_key('type')):
            _type = attrs.get('type')

        if (attrs.has_key('description')):
            _description = attrs.get('description')

        if (attrs.has_key('label')):
            _label = attrs.get('label')

        if (attrs.has_key('default')):
            _default_value = attrs.get('default')

        if (_name != '' and _type != '' and _description != '' and _label != ''):
            vDef = VariableDef( name=_name, description =_description,
                                type=self.typeText2typeCode(_type), 
                                aspect='PREF', friend_code=None,
                                label = _label,
                                default_value = _default_value,
                                gadget=self._gadget )
    
            #vDef.save()            
            relationship_eltos = {}
            relationship_eltos['vdef'] = vDef
            relationship_eltos['context'] = None
            relationship_eltos['option'] = []
            self._relationships.append(relationship_eltos)

            self._lastPreference = relationship_eltos
                
        else:
            raise TemplateParseException(_("ERROR: missing attribute at UserPreference element"))


    def processEvent(self, attrs):
        _name = ''
        _type = ''
        _description = ''
        _label = ''
        _friendCode = ''


        if (attrs.has_key('name')):
            _name = attrs.get('name')

        if (attrs.has_key('type')):
            _type = attrs.get('type')

        if (attrs.has_key('description')):
            _description = attrs.get('description')

        if (attrs.has_key('label')):
            _label = attrs.get('label')

        if (attrs.has_key('friendcode')):
            _friendCode = attrs.get('friendcode')

        if (_name != '' and _type != '' and _friendCode != ''):

            vDef = VariableDef( name = _name, description = _description, 
                                type = self.typeText2typeCode(_type), 
                                aspect = self._EVENT, 
                                friend_code = _friendCode, 
                                label = _label,
                                gadget = self._gadget )

            #vDef.save()
            relationship_eltos = {}
            relationship_eltos['vdef'] = vDef
            relationship_eltos['context'] = None
            relationship_eltos['option'] = []
            self._relationships.append(relationship_eltos)
        else:
            raise TemplateParseException(_("ERROR: missing attribute at Event element"))


    def processSlot(self, attrs):
        _name = ''
        _type = ''
        _description = ''
        _label = ''
        _friendCode = ''


        if (attrs.has_key('name')):
            _name = attrs.get('name')

        if (attrs.has_key('type')):
            _type = attrs.get('type')

        if (attrs.has_key('description')):
            _description = attrs.get('description')

        if (attrs.has_key('label')):
            _label = attrs.get('label')

        if (attrs.has_key('friendcode')):
            _friendCode = attrs.get('friendcode')

        if (_name != '' and _type != '' and _friendCode != ''):

            vDef = VariableDef( name = _name, description = _description, 
                                type = self.typeText2typeCode(_type), 
                                aspect = self._SLOT, 
                                friend_code = _friendCode, 
                                label = _label,
                                gadget = self._gadget )

            #vDef.save()
            relationship_eltos = {}
            relationship_eltos['vdef'] = vDef
            relationship_eltos['context'] = None
            relationship_eltos['option'] = []
            self._relationships.append(relationship_eltos)
        else:
            raise TemplateParseException(_("ERROR: missing attribute at Slot element"))            

            
    def processGadgetContext(self, attrs):
        _name = ''
        _type = ''
        _concept = ''
        _description = ''

        if (attrs.has_key('name')):
            _name = attrs.get('name')

        if (attrs.has_key('type')):
            _type = attrs.get('type')
        
        if (attrs.has_key('concept')):
            _concept = attrs.get('concept')
            
        if (attrs.has_key('description')):
            _description = attrs.get('description')

        if (_name != '' and _type != '' and _concept != ''):
            vDef = VariableDef ( name = _name, description =_description,
                                 type=self.typeText2typeCode(_type), 
                                 aspect = 'GCTX', friend_code = None, 
                                 gadget = self._gadget )
            #vDef.save()
            context = ContextOption ( concept = _concept, varDef = vDef) 
            #context.save()
            relationship_eltos = {}
            relationship_eltos['vdef'] = vDef
            relationship_eltos['context'] = context
            relationship_eltos['option'] = []
            self._relationships.append(relationship_eltos)
            
        else:
            raise TemplateParseException(_("ERROR: missing attribute at Gadget Context element"))            

    def processExternalContext(self, attrs):
        _name = ''
        _type = ''
        _concept = ''
        _description = ''

        if (attrs.has_key('name')):
            _name = attrs.get('name')

        if (attrs.has_key('type')):
            _type = attrs.get('type')
        
        if (attrs.has_key('concept')):
            _concept = attrs.get('concept')
            
        if (attrs.has_key('description')):
            _description = attrs.get('description')

        if (_name != '' and _type != '' and _concept != ''):
            vDef = VariableDef ( name = _name, description =_description,
                                 type=self.typeText2typeCode(_type), 
                                 aspect = 'ECTX' , friend_code = None, 
                                 gadget = self._gadget )
                        #vDef.save()
            context = ContextOption ( concept = _concept, varDef = vDef) 
            #context.save()
            
            relationship_eltos = {}
            relationship_eltos['vdef'] = vDef
            relationship_eltos['context'] = context
            relationship_eltos['option'] = []
            self._relationships.append(relationship_eltos)            
        else:
            raise TemplateParseException(_("ERROR: missing attribute at External Context element"))            

    def processXHTML (self, attrs):
        _href=""

        if (attrs.has_key('href')):
            _href = attrs.get('href')
        
        if (_href != ""):
            try:
                # Gadget Code Parsing
                if environ.get("RUN_MAIN_DEV") == "true" and hasattr(settings, 'GADGETS_ROOT'):
                    if path.isfile(path.join(settings.GADGETS_ROOT, _href)):
                        _href = "file://%s" % path.join(settings.GADGETS_ROOT, _href)
                gadgetParser = GadgetCodeParser()
                gadgetParser.parse(_href, self._gadgetURI)
                self._xhtml = gadgetParser.getXHTML()
            except Exception, e:
                raise TemplateParseException(_("ERROR: XHTML could not be read") + " - " + unicode(e))
        else:
            raise TemplateParseException(_("ERROR: missing attribute at XHTML element"))            


    def processOption (self, attrs):
        _value=""
        _name=""

        if (attrs.has_key('name')):
            _name = attrs.get('name')

        if (attrs.has_key('value')):
            _value = attrs.get('value')

        if (_value!= "") and (_name!="") and (self._lastPreference['vdef'].type ==  self.typeText2typeCode("list")):
            option = UserPrefOption(value=_value, name=_name, variableDef=self._lastPreference['vdef'])
            self._lastPreference['option'].append(option)
        else:
            raise TemplateParseException(_("ERROR: missing attribute at Option element"))            

    def processRendering (self, attrs):
        _width=""
        _height=""

        if (attrs.has_key('width')):
            _width = attrs.get('width')

        if (attrs.has_key('height')):
            _height = attrs.get('height')

        if (_width != "" and _height != ""):
            self._gadgetWidth=_width
            self._gadgetHeight=_height
        else:
            raise TemplateParseException(_("ERROR: missing attribute at Rendering element"))                       

###############

    def startElement(self, name, attrs):
        # Catalogue
        if (name == 'Name') or (name=='Version') or (name=='Vendor') or (name=='ImageURI') or (name=='iPhoneImageURI') or (name=='WikiURI') or (name=='Mail') or (name=='Description') or (name=='Author'):
            self.reset_Accumulator()
            return

        # Plataform
        if (name == 'Preference'):
            self.processPreference(attrs)
            return

        if (name == 'Property'):
            self.processProperty(attrs)
            return

        if (name == 'Slot'):
            self.processSlot(attrs)
            return

        if (name == 'Event'):
            self.processEvent(attrs)
            return

        if (name == 'GadgetContext'):
            self.processGadgetContext(attrs)
            return
        
        if (name == 'Context'):
            self.processExternalContext(attrs)
            return        
        
        if (name == 'XHTML'):
            self.processXHTML(attrs)
            return

        if (name == 'Option'):
            self.processOption(attrs)
            return

        if (name == 'Platform.Rendering'):
            self.processRendering(attrs)
            return


    def endElement(self, name):
        if (name == 'Catalog.ResourceDescription'):
            
            self._gadgetURI = "/gadgets/" + self._gadgetVendor + "/" + self._gadgetName + "/" + self._gadgetVersion
            
            return

        if (name == 'Name'):
            self._gadgetName = self._accumulator
            return

        if (name == 'Version'):
            self._gadgetVersion = self._accumulator
            return

        if (name == 'Vendor'):
            self._gadgetVendor = self._accumulator
            return

        if (name == 'Author'):
            self._gadgetAuthor = self._accumulator
            return        

        if (name == 'ImageURI'):
            self._gadgetImage = self._accumulator
            return
        
        if (name == 'iPhoneImageURI'):
            self._gadgetIPhoneImage = self._accumulator
            return
        
        if (name == 'WikiURI'):
            self._gadgetWiki = self._accumulator
            return

        if (name == 'Mail'):
            self._gadgetMail = self._accumulator

        if (name == 'Description'):
            self._gadgetDesc = self._accumulator
            return



    def characters(self, text):
        if (len(text) == 0):
            return

        if (text[0] == '\n' or text[0] == '\r' or text[0] == '\t'):
            return

        if (text == '    '):
            return

        self._accumulator += text

    @transaction.commit_on_success
    def endDocument(self):
        emptyRequiredFields = []
        if self._gadgetName == "":
            emptyRequiredFields.append("name");
        
        if self._gadgetVendor == "":
            emptyRequiredFields.append("vendor");

        if self._gadgetVersion == "":
            emptyRequiredFields.append("version");

        if self._gadgetAuthor == "":
            emptyRequiredFields.append("author");

        if self._gadgetMail == "":
            emptyRequiredFields.append("mail");

        if self._gadgetDesc == "":
            emptyRequiredFields.append("description");

        if self._gadgetWiki == "":
            emptyRequiredFields.append("wiki");

        if self._gadgetImage == "":
            emptyRequiredFields.append("image");

        if self._xhtml == "":
            emptyRequiredFields.append("xhtml");
        
        if len(emptyRequiredFields) > 0:
            print emptyRequiredFields
            raise TemplateParseException(_("Missing required field(s): %(fields)s") % {fields: unicode(emptyRequiredFields)})

        # Save the new gadget
        self._gadget.uri=self._gadgetURI
        self._gadget.vendor=self._gadgetVendor
        self._gadget.name=self._gadgetName
        self._gadget.version=self._gadgetVersion
        self._gadget.xhtml=self._xhtml
        self._gadget.author=self._gadgetAuthor
        self._gadget.mail=self._gadgetMail
        self._gadget.wikiURI=self._gadgetWiki
        self._gadget.imageURI=self._gadgetImage
        self._gadget.iPhoneImageURI=self._gadgetIPhoneImage
        self._gadget.width=self._gadgetWidth
        self._gadget.height=self._gadgetHeight
        self._gadget.description=self._gadgetDesc
        self._gadget.save()
        
        # All relationship must be saved now, when all its data are known 
        for rel in self._relationships:
            rel['vdef'].gadget = self._gadget
            rel['vdef'].save()
            
            if rel['context']:
                rel['context'].varDef = rel['vdef']
                rel['context'].save()
            
            for opt in rel['option']:
                opt.variableDef = rel['vdef']
                opt.save()
                 
    def reset_Accumulator(self):
        self._accumulator = ""
