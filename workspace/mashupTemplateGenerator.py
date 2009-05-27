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

from django.shortcuts import get_object_or_404

from workspace.models import WorkSpace, PublishedWorkSpace
from gadget.models import Gadget
from igadget.models import IGadget

class TemplateGenerator:
    def getTemplate(self, workspace_id):  
        
        published_workspace = get_object_or_404(PublishedWorkSpace, id=workspace_id)
        
        included_igadgets = IGadget.objects.filter(tab__workspace=published_workspace.workspace)
          
        xml = '<?xml version="1.0" encoding="utf-8"?>'
        xml += '<Template schemaLocation="http://morfeo-project.org/2007/Template">'
        xml += '<!-- Meta tags define gadgets properties -->'
        xml += '<Catalog.ResourceDescription>'
        xml += '<Vendor>%s</Vendor>' % published_workspace.vendor
        xml += '<Name>%s</Name>' % published_workspace.name
        xml += '<Version>%s</Version>' % published_workspace.version
        xml += '<Author>%s</Author>' % published_workspace.author
        xml += '<Mail>%s</Mail>' % published_workspace.mail
        xml += '<Description>%s</Description>' % published_workspace.description
        xml += '<ImageURI>%s</ImageURI>' % published_workspace.imageURI
        xml += '<WikiURI>%s</WikiURI>' % published_workspace.wikiURI
        xml += '<Organization>%s</Organization>' % published_workspace.organization
        xml += '<IncludedResources mashupId="%s">'%(workspace_id)
        
        included_igadgets = IGadget.objects.filter(tab__workspace=published_workspace.workspace)
        
        wiring = ''
        
        for igadget in included_igadgets:    
            gadget = igadget.gadget
            
            xml += '<Resource vendor="%s" name="%s" version="%s" />' % (gadget.vendor, gadget.name, gadget.version)
            
            events = gadget.get_related_events()
            
            for event in events:          
                wiring += '<Event name="%s" type="%s" label="%s" friendcode="%s" />' % (event.name, event.type, event.label, event.friend_code)
            
            slots = gadget.get_related_slots()
            
            for slot in slots:          
                wiring += '<Slot name="%s" type="%s" label="%s" friendcode="%s" />' % (slot.name, slot.type, slot.label, slot.friend_code)
        
        xml += '</IncludedResources>'
        xml += '</Catalog.ResourceDescription>'
        
        xml += '<Platform.Preferences></Platform.Preferences>'
        xml += '<Platform.StateProperties></Platform.StateProperties>'
        
        xml += '<Platform.Wiring>%s</Platform.Wiring>' % (wiring)
        
        xml += '<Platform.Link>'
        xml += '<XHTML href=""/>'
        xml += '</Platform.Link>'
        
        xml += '<Platform.Rendering width="0" height="0"/>'
        
        xml += '</Template>'
        
        return xml