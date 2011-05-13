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
from lxml import etree
from StringIO import StringIO

from django.utils.http import urlquote
from django.contrib.sites.models import Site
from django.conf import settings

from catalogue.models import GadgetResource
from commons.authentication import Http403
from gadget.htmlHeadParser import HTMLHeadParser
from gadget.models import Gadget
from gadget.templateParser import TemplateParser
from workspace.models import WorkSpace, UserWorkSpace


def get_or_add_gadget_from_catalogue(vendor, name, version, user, request):
    try:
        gadget = Gadget.objects.get(name=name, vendor=vendor, version=version)
    except:
        resource = GadgetResource.objects.get(vendor=vendor, short_name=name, version=version)
        templateParser = TemplateParser(resource.template_uri, user, resource.fromWGT, request)
        templateParser.parse()
        gadget = templateParser.getGadget()

    gadget.users.add(user)
    gadget.save()

    return gadget


def get_or_create_gadget(templateURL, user, workspaceId, request, fromWGT=False):

    # Check permissions
    workspace = WorkSpace.objects.get(id=workspaceId)
    if workspace.creator != user:
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

    return {"gadget": gadget, "templateParser": templateParser}


def get_or_create_gadget_from_catalogue(vendor, name, version, user, users, request):

    try:
        gadget = Gadget.objects.get(vendor=vendor, name=name, version=version)
    except Gadget.DoesNotExist:
        resource = GadgetResource.objects.get(vendor=vendor, short_name=name, version=version)

        templateParser = TemplateParser(resource.template_uri, user, resource.fromWGT, request)
        templateParser.parse()
        gadget = templateParser.getGadget()

    for user in users:
        gadget.users.add(user)

    gadget.save()
    return gadget


def get_and_add_gadget(vendor, name, version, users):

    gadget = Gadget.objects.get(vendor=vendor, name=name, version=version)
    for user in users:
        gadget.users.add(user)

    gadget.save()
    return gadget


includeTagBase_exp = re.compile(r'.*/deployment/gadgets/')
includeTagBase_expScript = re.compile(r'<script.*</script>', re.I | re.S)
includeTagBase_expLink = re.compile(r'<style.*</style>', re.I | re.S)
includeTagBase_htmlExp = re.compile(r'(?P<element1>.*)<html>(?P<element2>.*)', re.I)
includeTagBase_headExp = re.compile(r'(?P<element1>.*)<head>(?P<element2>.*)', re.I)


def includeTagBase(document, url, request):
    # Get info url Gadget: host, username, Vendor, NameGadget and Version

    # Is the gadget in the platform?
    if not includeTagBase_exp.search(url):
        return document

    # Get href base
    elements = includeTagBase_exp.sub("", url).split("/")

    host = get_site_domain(request)

    href = "/".join([host, 'deployment', 'gadgets', urlquote(elements[0]), urlquote(elements[1]), urlquote(elements[2]), urlquote(elements[3])]) + "/"

    if not isinstance(document, unicode):
        document = u"%s" % document.decode('utf8', 'ignore')

    # HTML Parser
    subDocument = includeTagBase_expScript.sub("", document)
    subDocument = includeTagBase_expLink.sub("", subDocument)
    parser = HTMLHeadParser(subDocument)
    # Split document by lines
    lines = document.split("\n")

    # HTML document has not head tag
    if not parser.getPosStartHead() and parser.getPosStartHtml():
        if(includeTagBase_headExp.search(lines[parser.getPosStartHtml() - 1])):
            v = includeTagBase_headExp.search(lines[parser.getPosStartHtml() - 1])
            element1 = v.group("element1")
            element2 = v.group("element2")
            html = "<html><head><base href='" + href + "'/></head>"
            lines[parser.getPosStartHtml() - 1] = element1 + html + element2

    # HTML document has head tag but has not base tag
    if parser.getPosStartHead() and not parser.getHrefBase():
        if(includeTagBase_headExp.search(lines[parser.getPosStartHead() - 1])):
            v = includeTagBase_headExp.search(lines[parser.getPosStartHead() - 1])
            element1 = v.group("element1")
            element2 = v.group("element2")
            head = "<head><base href='" + href + "'/>"
            lines[parser.getPosStartHead() - 1] = element1 + head + element2

    return u"".join("\n").join(lines)


def xpath(tree, query, xmlns):
    if xmlns == None:
        query = query.replace('xhtml:', '')
        return tree.xpath(query)
    else:
        return tree.xpath(query, namespaces={'xhtml': xmlns})


def fix_ezweb_scripts(xhtml_code, request):
    #xhtml_code = re.sub(r'<\?xml\s+version="[\d\.]+"(\s+encoding="[^"]")?\s*\?>', '', xhtml_code)

    rootURL = get_site_domain(request)

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
    for script in scripts:
        if 'src' in script.attrib:
            script.text = ''
        if script.get('src', '').startswith('/ezweb/'):
            script.set('src', rootURL + script.get('src'))

    # return modified code
    return etree.tostring(xmltree, pretty_print=False, method='html')


def get_site_domain(request):
    try:
        host = Site.objects.get(id=settings.SITE_ID).domain
    except Site.DoesNotExist:
        host = request.META['HTTP_HOST']

    if request.META['SERVER_PROTOCOL'].lower().find("https") != -1:
        rootURL = "https://" + host
    else:
        rootURL = "http://" + host

    return rootURL
