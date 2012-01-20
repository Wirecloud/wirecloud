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
from cStringIO import StringIO

from django.utils.http import urlquote
from django.contrib.sites.models import Site
from django.conf import settings

from catalogue.models import CatalogueResource
from commons import http_utils
from commons.authentication import Http403
from commons.http_utils import download_http_content
from commons.template import TemplateParser
from commons.wgt import WgtDeployer, WgtFile
from gadget.gadgetCodeParser import parse_gadget_code
from gadget.htmlHeadParser import HTMLHeadParser
from gadget.models import VariableDef, UserPrefOption, Gadget
from translator.models import Translation
from workspace.models import WorkSpace, UserWorkSpace


wgt_deployer = WgtDeployer(settings.GADGETS_DEPLOYMENT_DIR)


def create_gadget_from_template(template, user, request=None, base=None):

    """Creates a gadget from a template"""

    if isinstance(template, TemplateParser):
        parser = template
    else:
        template_content = http_utils.download_http_content(template, user=user)
        if base is None:
            base = template
        parser = TemplateParser(template_content, base=base)

    if parser.get_resource_type() != 'gadget':
        raise Exception()

    gadget_info = parser.get_resource_info()

    gadget = Gadget()

    gadget.uri = '/'.join(('', 'gadgets', gadget_info['vendor'], gadget_info['name'], gadget_info['version']))

    gadget.vendor=gadget_info['vendor']
    gadget.name=gadget_info['name']
    gadget.version=gadget_info['version']

    gadget.description = gadget_info['description']
    gadget.display_name = gadget_info['display_name']
    gadget.author = gadget_info['author']

    gadget_code = parser.get_absolute_url(gadget_info['code_url'], base)
    gadget.xhtml = parse_gadget_code(gadget_code, gadget.uri, gadget_info['code_content_type'], False, cacheable=gadget_info['code_cacheable'], user=user, request=request)

    gadget.mail = gadget_info['mail']
    gadget.wikiURI = gadget_info['doc_uri']
    gadget.imageURI = gadget_info['image_uri']
    gadget.iPhoneImageURI = gadget_info['iphone_image_uri']
    gadget.width = gadget_info['gadget_width']
    gadget.height = gadget_info['gadget_height']
    gadget.menuColor = gadget_info['gadget_menucolor']

    gadget.save()

    variable_definitions = {}
    user_options = {}

    order = 0
    for preference in gadget_info['preferences']:
        vDef = VariableDef.objects.create(
            name=preference['name'],
            order=order,
            description=preference['description'],
            type=parser.typeText2typeCode(preference['type']),
            aspect='PREF',
            friend_code=None,
            label=preference['label'],
            default_value=preference['default_value'],
            gadget=gadget,
            secure=preference['secure']
        )
        variable_definitions[vDef.name] = vDef
        user_options[vDef.name] = {}
        for option in preference.get('options', ()):
            upo = UserPrefOption.objects.create(
                value=option['value'],
                name=option['label'],
                variableDef=vDef
            )
            user_options[vDef.name][upo.name] = upo

        order += 1

    order = 0
    for prop in gadget_info['properties']:
        vDef = VariableDef.objects.create(
            name=prop['name'],
            order=order,
            description=prop['description'],
            type=parser.typeText2typeCode(prop['type']),
            aspect='PROP',
            friend_code=None,
            label=prop['label'],
            default_value=prop['default_value'],
            gadget=gadget,
            secure=prop['secure'],
        )
        variable_definitions[vDef.name] = vDef
        order += 1

    order = 0
    for slot in gadget_info['slots']:
        vDef = VariableDef.objects.create(
            name=slot['name'],
            order=order,
            description=slot['description'],
            type=parser.typeText2typeCode(slot['type']),
            aspect='EVEN',
            friend_code=slot['friendcode'],
            label=slot['label'],
            action_label=slot['action_label'],
            gadget=gadget,
        )
        variable_definitions[vDef.name] = vDef
        order += 1

    order = 0
    for event in gadget_info['events']:
        vDef = VariableDef.objects.create(
            name=event['name'],
            order=order,
            description=event['description'],
            type=parser.typeText2typeCode(event['type']),
            aspect='SLOT',
            friend_code=event['friendcode'],
            label=event['label'],
            gadget=gadget,
        )
        variable_definitions[vDef.name] = vDef
        order += 1

    gadget_table = gadget.__class__.__module__ + "." + gadget.__class__.__name__
    for lang in gadget_info['translations']:
        translation = gadget_info['translations'][lang]
        for index in translation:
            value = translation[index]
            usages = gadget_info['translation_index_usage'][index]
            for use in usages:
                if use['type'] == 'gadget':
                    table=gadget_table
                    element_id=gadget.id
                elif use['type'] == 'vdef':
                    vDef = variable_definitions[use['variable']]
                    table = vDef.__class__.__module__ + "." + vDef.__class__.__name__
                    element_id=vDef.id
                elif use['type'] == 'upo':
                    upo = user_options[use['variable']][use['option']]
                    table = upo.__class__.__module__ + "." + upo.__class__.__name__
                    element_id=upo.id

                Translation.objects.create(
                    text_id=index,
                    element_id=element_id,
                    table=table,
                    language=lang,
                    value=value,
                    default=gadget_info['default_lang'] == lang
                )

    return gadget

def create_gadget_from_wgt(wgt_uri, user):

    wgt_file = WgtFile(StringIO(download_http_content(wgt_uri)))
    template = wgt_deployer.deploy(wgt_file, user)
    return create_gadget_from_template(template, user)

def get_resource_from_catalogue(vendor, name, **selectors):
    resources = CatalogueResource.objects.filter(vendor=vendor, short_name=name)

    version = selectors.get('version', None)
    if version is not None:
        resources = resources.filter(version=version)

    resource_type = selectors.get('resource_type', None)
    if resource_type is not None:
        resources = resources.filter(type=resource_type)

    return resources[0]


def create_gadget_from_catalogue(user, vendor, name, **selectors):
    selectors['resource_type'] = 0  # Gadget
    resource = get_resource_from_catalogue(vendor, name, **selectors)
    if resource.template_uri.lower().endswith('.wgt'):
        return create_gadget_from_wgt(resource.template_uri, user)
    else:
        return create_gadget_from_template(resource.template_uri, user)


def get_or_add_gadget_from_catalogue(vendor, name, version, user, request=None, assign_to_users=None):
    try:
        gadget = Gadget.objects.get(name=name, vendor=vendor, version=version)
    except:
        gadget = create_gadget_from_catalogue(user, vendor, name, version=version)

    if assign_to_users is None:
        assign_to_users = (user,)

    for user in assign_to_users:
        gadget.users.add(user)

    gadget.save()

    return gadget


def get_or_create_gadget(templateURL, user, workspaceId, request, fromWGT=False):

    # Check permissions
    workspace = WorkSpace.objects.get(id=workspaceId)
    if workspace.creator != user:
        raise Http403()

    ########### Template Parser
    template_content = http_utils.download_http_content(templateURL, user=user)
    templateParser = TemplateParser(template_content, templateURL)

    # Gadget is created only once
    gadget_uri = templateParser.get_resource_uri()
    try:
        gadget = Gadget.objects.get(uri=gadget_uri)
    except Gadget.DoesNotExist:
        gadget = create_gadget_from_template(templateParser, user, request)

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

    return "//" + host
