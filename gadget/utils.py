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
import re
from gadget.templateParser import TemplateParser
from gadget.models import Gadget
from gadget.htmlHeadParser import HTMLHeadParser
from django.utils.http import urlquote

def get_or_create_gadget (templateURL, user, fromWGT = False):
    ########### Template Parser
    templateParser = None

    # Gadget is created only once
    templateParser = TemplateParser(templateURL, user, fromWGT)
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
    

def includeTagBase(document, url, request):
    # Get info url Gadget: host, username, Vendor, NameGadget and Version 

    exp = re.compile(r'.*/deployment/gadgets/')
    expScript = re.compile(r'<script.*</script>', re.I|re.S)
    expLink = re.compile(r'<style.*</style>', re.I|re.S)

    # Is the gadget in the platform?
    if not exp.search(url):
        return document

    # Get href base
    elements = exp.sub("", url).split("/")

    if(request.META['SERVER_PROTOCOL'].lower().find("https") > -1):
        host = "https://"+request.META['HTTP_HOST']
    else:
        host = "http://"+request.META['HTTP_HOST']

    href = "/".join([host, 'deployment', 'gadgets', urlquote(elements[0]), urlquote(elements[1]), urlquote(elements[2]), urlquote(elements[3])]) + "/"

    # HTML Parser
    subDocument = expScript.sub("",document)
    subDocument = expLink.sub("",subDocument)
    parser = HTMLHeadParser(subDocument)
    # Split document by lines
    lines = document.split("\n")

    # HTML document has not head tag
    if not parser.getPosStartHead() and parser.getPosStartHtml():
        htmlExp = re.compile(r'(?P<element1>.*)<html>(?P<element2>.*)',re.I)
        if(htmlExp.search(lines[parser.getPosStartHtml()-1])):
            v = htmlExp.search(lines[parser.getPosStartHtml()-1])
            element1 = v.group("element1")
            element2 = v.group("element2")
            html = "<html><head><base href='"+href+"'/></head>"
            lines[parser.getPosStartHtml()-1] = element1 + html + element2

    # HTML document has head tag but has not base tag
    if parser.getPosStartHead() and not parser.getHrefBase():
        headExp = re.compile(r'(?P<element1>.*)<head>(?P<element2>.*)',re.I)
        if(headExp.search(lines[parser.getPosStartHead()-1])):
            v = headExp.search(lines[parser.getPosStartHead()-1])
            element1 = v.group("element1")
            element2 = v.group("element2")
            head = "<head><base href='"+ href + "'/>"
            lines[parser.getPosStartHead()-1] = element1 + head + element2

    return "".join("\n").join(lines)
