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

from gadget.templateParser import TemplateParser
from gadget.models import Gadget

def get_or_create_gadget (templateURL, user):
    ########### Template Parser
    templateParser = None
       
    # Gadget is created only once
    templateParser = TemplateParser(templateURL)
    gadget_uri = templateParser.getGadgetUri()

    try:
        gadget = Gadget.objects.get(uri=gadget_uri)
    except Gadget.DoesNotExist:
        # Parser creates the gadget. It's made only if the gadget does not exist
        templateParser.parse()
        gadget = templateParser.getGadget()
    
    # A new user has added the gadget in his showcase 
    gadget.users.add(user) 
       
    return {"gadget":gadget, "templateParser":templateParser}