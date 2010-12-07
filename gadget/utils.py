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
from commons.authentication import Http403
from gadget.templateParser import TemplateParser
from gadget.models import Gadget
from workspace.models import WorkSpace, UserWorkSpace
from gadget.htmlHeadParser import HTMLHeadParser
from django.utils.http import urlquote
from lxml import etree
from StringIO import StringIO


def get_or_create_gadget (templateURL, user, workspaceId, request, fromWGT = False):

    # Check permissions
    workspace = WorkSpace.objects.get(id=workspaceId)
    if workspace.get_creator() != user:
        raise Http403()


    ########### Template Parser
    templateParser = TemplateParser(templateURL, user, fromWGT, request)

    # Gadget is created only once
    gadget_uri = templateParser.getGadgetUri()
    try:
        gadget = Gadget.objects.get(uri=gadget_uri)
    except Gadget.DoesNotExist:
        # Parser creates the gadget. It's made only if the gadget does not exist
        templateParser.parse()
        gadget = templateParser.getGadget()


    # A new user has added the gadget in his showcase
    # check if the workspace in which the igadget is being added is shared
    # all the user sharing the workspace should have the gadget in their
    # showcases
    if workspace.is_shared():
        # add the gadget to the showcase of every user sharing the workspace
        # there is no problem is the gadget is already in their showcase
        [gadget.users.add(user_ws.user) for user_ws in UserWorkSpace.objects.filter(workspace=workspace)]
    else:
        # add the gadget to the showcase of the user
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


def xpath(tree, query, xmlns):
    if xmlns == None:
        query = query.replace('xhtml:', '')
        return tree.xpath(query)
    else:
        return tree.xpath(query, namespaces={'xhtml': xmlns})


def fix_ezweb_scripts(xhtml_code, request):

    #xhtml_code = re.sub(r'<\?xml\s+version="[\d\.]+"(\s+encoding="[^"]")?\s*\?>', '', xhtml_code)

    if request.META['SERVER_PROTOCOL'].lower().find("https") != -1:
        rootURL = "https://" + request.META['HTTP_HOST']
    else:
        rootURL = "http://" + request.META['HTTP_HOST']

    try:
        xmltree = etree.fromstring(xhtml_code).getroottree()
    except:
        parser = etree.HTMLParser()
        xmltree = etree.parse(StringIO(xhtml_code), parser)

    prefix = xmltree.getroot().prefix
    xmlns = None
    if prefix in xmltree.getroot().nsmap:
        xmlns = xmltree.getroot().nsmap[prefix]

    scripts = xpath(xmltree, '/xhtml:html//xhtml:script', xmlns)
    ezweb_scripts = []
    for script in scripts:
        if 'src' in script.attrib:
            script.text = ''

        if script.get('src', '').startswith('/ezweb/'):
            ezweb_scripts.append(script)

    for script in ezweb_scripts:
        script.set('src', rootURL + script.get('src'))

    # return modified code
    return etree.tostring(xmltree, pretty_print=False, method='html')
