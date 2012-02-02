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
import os
from lxml import etree
from cStringIO import StringIO

from django.contrib.sites.models import Site
from django.conf import settings

from catalogue.models import CatalogueResource
from commons import http_utils
from commons.authentication import Http403
from commons.http_utils import download_http_content
from commons.template import TemplateParser
from commons.wgt import WgtDeployer, WgtFile
from gadget.models import ContextOption, VariableDef, UserPrefOption, Gadget, XHTML
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

    gadget.uri = parser.get_resource_uri()

    gadget.vendor = gadget_info['vendor']
    gadget.name = gadget_info['name']
    gadget.version = gadget_info['version']

    gadget.description = gadget_info['description']
    gadget.display_name = gadget_info['display_name']
    gadget.author = gadget_info['author']

    gadget_code = parser.get_absolute_url(gadget_info['code_url'], base)
    gadget.xhtml = XHTML.objects.create(
        uri=gadget.uri + "/xhtml",
        url=gadget_code,
        content_type=gadget_info['code_content_type'],
        cacheable=gadget_info['code_cacheable']
    )

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
            aspect='SLOT',
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
            aspect='EVEN',
            friend_code=event['friendcode'],
            label=event['label'],
            gadget=gadget,
        )
        variable_definitions[vDef.name] = vDef
        order += 1

    for context in gadget_info['context']:
        vDef = VariableDef.objects.create(
            name=context['name'],
            type=parser.typeText2typeCode(context['type']),
            aspect=context['aspect'],
            gadget=gadget,
        )
        ContextOption.objects.create(concept=context['concept'], varDef=vDef)

    gadget_table = gadget.__class__.__module__ + "." + gadget.__class__.__name__
    for lang in gadget_info['translations']:
        translation = gadget_info['translations'][lang]
        for index in translation:
            value = translation[index]
            usages = gadget_info['translation_index_usage'][index]
            for use in usages:
                if use['type'] == 'resource':
                    table = gadget_table
                    element_id = gadget.id
                elif use['type'] == 'vdef':
                    vDef = variable_definitions[use['variable']]
                    table = vDef.__class__.__module__ + "." + vDef.__class__.__name__
                    element_id = vDef.id
                elif use['type'] == 'upo':
                    upo = user_options[use['variable']][use['option']]
                    table = upo.__class__.__module__ + "." + upo.__class__.__name__
                    element_id = upo.id

                Translation.objects.create(
                    text_id=index,
                    element_id=element_id,
                    table=table,
                    language=lang,
                    value=value,
                    default=gadget_info['default_lang'] == lang
                )

    return gadget


def create_gadget_from_wgt(wgt, user, deploy_only=False):

    if isinstance(wgt, WgtFile):
        wgt_file = wgt
    else:
        wgt_file = WgtFile(StringIO(download_http_content(wgt)))

    template = wgt_deployer.deploy(wgt_file, user)
    if not deploy_only:
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

    if fromWGT:
        templateURL = 'file://' + os.path.join(settings.BASEDIR, templateURL[1:])
        wgt_file = WgtFile(StringIO(download_http_content(templateURL)))
        template_content = wgt_file.get_template()
    else:
        template_content = http_utils.download_http_content(templateURL, user=user)

    templateParser = TemplateParser(template_content, templateURL)

    # Gadget is created only once
    gadget_uri = templateParser.get_resource_uri()
    try:
        gadget = Gadget.objects.get(uri=gadget_uri)
    except Gadget.DoesNotExist:
        if fromWGT:
            gadget = create_gadget_from_wgt(wgt_file, user)
        else:
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

    return gadget


def get_and_add_gadget(vendor, name, version, users):

    gadget = Gadget.objects.get(vendor=vendor, name=name, version=version)
    for user in users:
        gadget.users.add(user)

    gadget.save()
    return gadget


def xpath(tree, query, xmlns):
    if xmlns == None:
        query = query.replace('xhtml:', '')
        return tree.xpath(query)
    else:
        return tree.xpath(query, namespaces={'xhtml': xmlns})


def fix_gadget_code(xhtml_code, base_url, request):

    rootURL = get_site_domain(request)
    force_base = False
    if not base_url.startswith(('http://', 'https://')):
        base_url = rootURL + '/deployment/gadgets/' + base_url
        force_base = True

    try:
        xmltree = etree.fromstring(xhtml_code).getroottree()
    except:
        parser = etree.HTMLParser()
        xmltree = etree.parse(StringIO(xhtml_code), parser)

    prefix = xmltree.getroot().prefix
    xmlns = None
    if prefix in xmltree.getroot().nsmap:
        xmlns = xmltree.getroot().nsmap[prefix]

    # Fix base element
    base_elements = xpath(xmltree, '/xhtml:html//xhtml:base', xmlns)
    for base_element in base_elements[1:]:
        base_element.parent.remove(base_element)

    if len(base_elements) >= 1 and force_base:
        base_elements[0].set('href', base_url)
    elif len(base_elements) == 0:
        head_element = xpath(xmltree, '/xhtml:html/xhtml:head', xmlns)[0]
        head_element.insert(0, etree.Element('base', href=base_url))

    # Fix scripts
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
