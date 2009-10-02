#!/usr/bin/env python

#...............................licence...........................................
#
#     (C) Copyright 2009 Telefonica Investigacion y Desarrollo
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

import sys, os

inputFiles = {
    'normal':  [
        'js/common/constants.js',
        'js/common/utils.js',
        'js/interfaceLayout/BrowserUtils.js',

        'js/common/modules.js',
        'js/interfaceLayout/InputInterfaces.js',

        'js/preferencesManager/PreferencesManager.js',
        'js/preferencesManager/PlatformPref.js',
        'js/persistenceEngine/PersistenceEngine.js',

        'js/gadgetModel/XHtml.js',
        'js/gadgetModel/GadgetTemplate.js',
        'js/gadgetModel/Gadget.js',

        'js/log/LogManager.js',

        'js/opManager/WorkSpace.js',
        'js/opManager/Tab.js',
        'js/opManager/InitialScriptExecuter.js',

        'js/opManager/OpManager.js',
        'js/varManager/VariableGadget.js',
        'js/varManager/VariablePlatform.js',
        'js/varManager/varManager.js',

        'js/showcase/showcase.js',
        'js/showcase/util.js',

        'js/contextManager/ContextManager.js',
        'js/contextManager/ContextPlatform.js',
        'js/contextManager/Adaptors.js',

        'js/dragboard/DragboardLayout.js',
        'js/dragboard/SmartColumnLayout.js',
        'js/dragboard/FreeLayout.js',
        'js/dragboard/iGadget.js',
        'js/dragboard/dragboard.js',
        'js/dragboard/UserPref.js',
        'js/dragboard/ElementPositions.js',

        'js/wiring/wiring_exceptions.js',
        'js/wiring/filter.js',
        'js/wiring/external_channel.js',
        'js/wiring/connectable.js',
        'js/wiring/wiring.js',
        'js/wiring/wiringGUI.js',
        'js/wiring/connectableInterface.js',
        'js/wiring/jsonFilter.js',

        'js/catalogue/UIUtils.js',
        'js/catalogue/CategoryManager.js',
        'js/catalogue/Catalogue.js',
        'js/catalogue/Resource.js',
        'js/catalogue/Tagger.js',
        'js/catalogue/Tag.js',

        'js/interfaceLayout/BackgroundFadder.js',
        'js/interfaceLayout/DropDownMenu.js',
        'js/interfaceLayout/WindowMenu.js',
        'js/interfaceLayout/LayoutManager.js',
    ],

    'iphone': [
        'iphone/lib/mymw/mymw-core.js',
        'iphone/lib/mymw/mymw-tabs.js',
        'js/common/constants.js',
        'iphone/common/utils.js',
        'js/common/modules.js',
        'js/lib/prototype/prototype.improvements.js',
        'js/persistenceEngine/PersistenceEngine.js',
        'iphone/catalogue/Catalogue.js',
        'js/gadgetModel/XHtml.js',
        'js/gadgetModel/GadgetTemplate.js',
        'iphone/gadgetModel/Gadget.js',
        'iphone/opManager/WorkSpace.js',
        'iphone/opManager/Tab.js',
        'iphone/opManager/OpManager.js',
        'js/varManager/VariableGadget.js',
        'js/varManager/VariablePlatform.js',
        'js/varManager/varManager.js',
        'iphone/showcase/showcase.js',
        'js/showcase/util.js',
        'js/contextManager/ContextManager.js',
        'js/contextManager/ContextPlatform.js',
        'js/contextManager/Adaptors.js',
        'iphone/dragboard/iGadget.js',
        'iphone/dragboard/dragboard.js',
        'js/wiring/wiring_exceptions.js',
        'js/wiring/filter.js',
        'js/wiring/connectable.js',
        'js/wiring/wiring.js',
        'js/wiring/jsonFilter.js',
        'iphone/add-ons/wiring.js',
        'iphone/add-ons/connectable.js',
    ],

    'viewer': [
        'js/common/constants.js',
        'js/common/utils.js',
        'js/interfaceLayout/BrowserUtils.js',

        'js/common/modules.js',
        'js/interfaceLayout/InputInterfaces.js',

        'js/preferencesManager/PreferencesManager.js',
        'js/preferencesManager/PlatformPref.js',
        'js/persistenceEngine/PersistenceEngineForViewer.js',

        'js/gadgetModel/XHtml.js',
        'js/gadgetModel/GadgetTemplate.js',
        'js/gadgetModel/Gadget.js',

        'js/log/LogManager.js',

        'js/opManager/WorkSpace.js',
        'js/opManager/Tab.js',
        'js/opManager/InitialScriptExecuter.js',

        'js/opManager/OpManager.js',
        'js/varManager/VariableGadget.js',
        'js/varManager/VariablePlatform.js',
        'js/varManager/varManager.js',

        'js/showcase/showcase.js',
        'js/showcase/util.js',

        'js/contextManager/ContextManager.js',
        'js/contextManager/ContextPlatform.js',
        'js/contextManager/Adaptors.js',

        'js/dragboard/DragboardLayout.js',
        'js/dragboard/SmartColumnLayout.js',
        'js/dragboard/FreeLayout.js',
        'js/dragboard/iGadget.js',
        'js/dragboard/dragboard.js',
        'js/dragboard/UserPref.js',
        'js/dragboard/ElementPositions.js',

        'js/wiring/wiring_exceptions.js',
        'js/wiring/filter.js',
        'js/wiring/external_channel.js',
        'js/wiring/connectable.js',
        'js/wiring/wiring.js',
        'js/wiring/wiringGUI.js',
        'js/wiring/connectableInterface.js',
        'js/wiring/jsonFilter.js',

        'js/catalogue/UIUtils.js',
        'js/catalogue/CategoryManager.js',
        'js/catalogue/Catalogue.js',
        'js/catalogue/Resource.js',
        'js/catalogue/Tagger.js',
        'js/catalogue/Tag.js',

        'js/interfaceLayout/BackgroundFadder.js',
        'js/interfaceLayout/DropDownMenu.js',
        'js/interfaceLayout/WindowMenu.js',
        'js/interfaceLayout/LayoutManager.js',
    ]
}

outputFileNames = {
    'normal' : 'media/js/ezweb_%s.js',
    'iphone' : 'media/iphone/ezweb_iphone_%s.js',
    'viewer' : 'media/js/ezweb_viewer_%s.js'
}

listFileNames = {
    'normal' : 'ezweb/templates/js_includes.js',
    'iphone' : 'ezweb/templates/js_iphone_includes.js',
    'viewer' : 'ezweb/templates/js_viewer_includes.js'
}

def which(program):
    def is_exe(fpath):
        return os.path.exists(fpath) and os.access(fpath, os.X_OK)

    fpath, fname = os.path.split(program)
    if fpath:
        if is_exe(program):
            return program
    else:
        for path in os.environ["PATH"].split(os.pathsep):
            exe_file = os.path.join(path, program)
            if is_exe(exe_file):
                return exe_file

    return None

def write_file(flavour, release):
    final_file_name = outputFileNames[flavour] % release
    file_list = inputFiles[flavour]

    sys.stdout.write ("Creating %s..." % final_file_name)
    sys.stdout.flush()

    try:
        res = open(final_file_name, 'w')

        header = open('morfeo_header.txt', 'r')

        res.write(header.read())

        header.close()

        for file_name in file_list:
           file = open(os.path.join("media", file_name),'r')

           #Deleting license header
           found = False
           while (True):
              line = file.readline()

              if not line:
                  break

              if (line.find('*     http://morfeo-project.org') >= 0):
                 found = True
                 break
                 

           if (not found):
               print "Error en la cabecera del fichero %s" %file_name
               print "ABORTANDO"
               return
           
           #skiping useless lines after MORFEO URL!
           file.readline()

           #copying real js code to the resulting unique source file!
           res.write(file.read())

           file.close()

        res.close()
    except Exception, e:
        print e

    if java_available:
      os.system("java -jar media/js/compressor.jar " + final_file_name + " -o " + final_file_name)

    sys.stdout.write(" Done\n")

def build_js_list(flavour):
    final_file_name = listFileNames[flavour]
    file_list = inputFiles[flavour]

    sys.stdout.write ("Creating %s..." % final_file_name)
    sys.stdout.flush()

    try:
        res = open(final_file_name, 'w')

        res.write('<!-- This is an autogenerated list of javascript files, please\n' +
                  '     edit the generate_ezweb_js_file.py script and rerun it\n' +
                  '     for updating this list. -->\n')

        for file_name in file_list:
           res.write('<script type="text/javascript" src="{{ MEDIA_URL }}%s"></script>\n' % file_name)

        res.close()
    except Exception, e:
        print e

    sys.stdout.write(" Done\n")


#Main
if len(sys.argv) == 1:
    try:
        from processors.context_processors import ezweb_release
        ezweb_rel = ezweb_release(None)['ezweb_release']
    except:
        sys.stdout.write('Warning: Invalid settings.py detected. Assuming EZWEB_RELEASE="default".')
        sys.stdout.write('\n')
        ezweb_rel = 'default'
else:
    ezweb_rel = sys.argv[1]

java_available = which('java') != None
if not java_available:
    sys.stdout.write('Warning: java command not found. JavaScript files will be not compressed')
    sys.stdout.write('\n')

sys.stdout.write('\n')



for flavour in inputFiles:
  build_js_list(flavour)

sys.stdout.write("\n")

for flavour in inputFiles:
  write_file(flavour, ezweb_rel)

sys.stdout.write("\n")

