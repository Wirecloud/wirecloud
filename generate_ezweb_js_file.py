#!/usr/bin/env python

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


files_normal = [
   'media/js/common/constants.js', 
   'media/js/common/utils.js',
     
   'media/js/common/modules.js', 
   'media/js/persistenceEngine/PersistenceEngine.js', 
   
   'media/js/gadgetModel/XHtml.js', 
   'media/js/gadgetModel/GadgetTemplate.js',
   'media/js/gadgetModel/Gadget.js', 
   
   'media/js/log/LogManager.js',
   
   'media/js/opManager/WorkSpace.js',
   'media/js/opManager/Tab.js',
   
   'media/js/opManager/OpManager.js', 
   'media/js/varManager/VariableGadget.js',
   'media/js/varManager/VariablePlatform.js', 
   'media/js/varManager/varManager.js',
   
   'media/js/showcase/showcase.js',
   'media/js/showcase/util.js',
   
   'media/js/contextManager/ContextManager.js',
   'media/js/contextManager/ContextPlatform.js',
   'media/js/contextManager/Adaptors.js',
   
   'media/js/dragboard/DragboardLayout.js',
   'media/js/dragboard/SmartColumnLayout.js', 
   'media/js/dragboard/FreeLayout.js', 
   'media/js/dragboard/iGadget.js', 
   'media/js/dragboard/dragboard.js',
   'media/js/dragboard/UserPref.js', 
   'media/js/dragboard/ElementPositions.js',
   
   'media/js/wiring/filter.js', 
   'media/js/wiring/connectable.js', 
   'media/js/wiring/wiring.js', 
   'media/js/wiring/wiringGUI.js',
   'media/js/wiring/connectableInterface.js',
   
   'media/js/catalogue/UIUtils.js',
   'media/js/catalogue/Catalogue.js',
   'media/js/catalogue/Resource.js',
   'media/js/catalogue/Tagger.js',
   'media/js/catalogue/Tag.js',
   
   'media/js/interfaceLayout/DropDownMenu.js',
   'media/js/interfaceLayout/WindowMenu.js',
   'media/js/interfaceLayout/LayoutManager.js',
   'media/js/interfaceLayout/BrowserUtils.js',
]

files_iphone = [
   'media/iphone/lib/mymw/mymw-core.js',
   'media/iphone/lib/mymw/mymw-tabs.js',
   'media/js/common/constants.js', 
   'media/iphone/common/utils.js',  
   'media/js/common/modules.js', 
   'media/js/lib/prototype/prototype.improvements.js',
   'media/js/persistenceEngine/PersistenceEngine.js',
   'media/iphone/catalogue/Catalogue.js',
   'media/js/gadgetModel/XHtml.js', 
   'media/js/gadgetModel/GadgetTemplate.js',
   'media/iphone/gadgetModel/Gadget.js', 
   'media/iphone/opManager/WorkSpace.js',
   'media/iphone/opManager/Tab.js',
   'media/iphone/opManager/OpManager.js', 
   'media/js/varManager/VariableGadget.js',
   'media/js/varManager/VariablePlatform.js', 
   'media/js/varManager/varManager.js',
   'media/iphone/showcase/showcase.js',
   'media/js/showcase/util.js',
   'media/js/contextManager/ContextManager.js',
   'media/js/contextManager/ContextPlatform.js',
   'media/js/contextManager/Adaptors.js',
   'media/iphone/dragboard/iGadget.js', 
   'media/iphone/dragboard/dragboard.js',
   'media/js/wiring/filter.js', 
   'media/js/wiring/connectable.js', 
   'media/js/wiring/wiring.js',
   'media/js/wiring/jsonFilter.js',
   'media/iphone/add-ons/wiring.js',
   'media/iphone/add-ons/connectable.js',
]

def write_file(final_file_name, file_list):
    try:
        res = open(final_file_name, 'w')
        
        header = open('morfeo_header.txt', 'r')
        
        res.write(header.read())
        
        header.close()
        
        for file_name in file_list:
           file = open(file_name,'r')
        
           #Deleting license header
           while (True):
              line = file.readline()
              
              if not line:
                  break
              
              if (line.find('*     http://morfeo-project.org') >= 0):
                 break
        
            
           #skiping useless lines after MORFEO URL!
           file.readline()
        
           #copying real js code to the resulting unique source file!
           res.write(file.read())
        
           file.close()

        res.close()
    except Exception, e:
        print e

#Main
write_file('media/js/ezweb.js', files_normal)
write_file('media/iphone/ezweb_iphone.js', files_iphone)

