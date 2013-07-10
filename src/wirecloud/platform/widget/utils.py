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
from lxml import etree
from cStringIO import StringIO

from django.conf import settings
from django.db.models import Q

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.exceptions import Http403
from wirecloud.commons.models import Translation
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.http import get_absolute_static_url
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.commons.utils.wgt import WgtDeployer, WgtFile
from wirecloud.platform.models import ContextOption, Widget, UserPrefOption, UserWorkspace, VariableDef, Workspace, XHTML
from wirecloud.platform.plugins import get_active_features, get_old_widget_api_extensions, get_widget_api_extensions


wgt_deployer = WgtDeployer(settings.GADGETS_DEPLOYMENT_DIR)


def check_requirements(resource):

    active_features = get_active_features()

    for requirement in resource['requirements']:
        if requirement['type'] == 'feature':

            if requirement['name'] not in active_features:
                raise Exception('Required feature is not enabled: %s' % requirement['name'])

        else:

            raise Exception('Unsupported requirement type: %s' % requirement['type'])


def create_widget_from_template(template, user, request=None, base=None):

    """Creates a widget from a template"""

    if isinstance(template, TemplateParser):
        parser = template
    else:
        template_content = downloader.download_http_content(template, user=user)
        if base is None:
            base = template
        parser = TemplateParser(template_content, base=base)

    if parser.get_resource_type() != 'widget':
        raise Exception()

    widget_info = parser.get_resource_info()
    check_requirements(widget_info)

    widget = Widget()
    widget.resource = CatalogueResource.objects.get(vendor=parser.get_resource_vendor(), short_name=parser.get_resource_name(), version=parser.get_resource_version())
    widget_code = parser.get_absolute_url(widget_info['code_url'], base)
    widget.xhtml = XHTML.objects.create(
        uri=widget.uri + "/xhtml",
        url=widget_code,
        content_type=widget_info['code_content_type'],
        use_platform_style=widget_info['code_uses_platform_style'],
        cacheable=widget_info['code_cacheable']
    )

    widget.width = widget_info['widget_width']
    widget.height = widget_info['widget_height']

    widget.save()

    variable_definitions = {}
    user_options = {}

    order = 0
    for preference in widget_info['preferences']:
        vDef = VariableDef.objects.create(
            name=preference['name'],
            order=order,
            description=preference['description'],
            type=parser.typeText2typeCode(preference['type']),
            aspect='PREF',
            friend_code=None,
            label=preference['label'],
            default_value=preference['default_value'],
            widget=widget,
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
    for prop in widget_info['properties']:
        vDef = VariableDef.objects.create(
            name=prop['name'],
            order=order,
            description=prop['description'],
            type=parser.typeText2typeCode(prop['type']),
            aspect='PROP',
            friend_code=None,
            label=prop['label'],
            default_value=prop['default_value'],
            widget=widget,
            secure=prop['secure'],
        )
        variable_definitions[vDef.name] = vDef
        order += 1

    order = 0
    for input_endpoint in widget_info['wiring']['inputs']:
        vDef = VariableDef.objects.create(
            name=input_endpoint['name'],
            order=order,
            description=input_endpoint['description'],
            type=parser.typeText2typeCode(input_endpoint['type']),
            aspect='SLOT',
            friend_code=input_endpoint['friendcode'],
            label=input_endpoint['label'],
            action_label=input_endpoint['actionlabel'],
            widget=widget,
        )
        variable_definitions[vDef.name] = vDef
        order += 1

    order = 0
    for output_endpoint in widget_info['wiring']['outputs']:
        vDef = VariableDef.objects.create(
            name=output_endpoint['name'],
            order=order,
            description=output_endpoint['description'],
            type=parser.typeText2typeCode(output_endpoint['type']),
            aspect='EVEN',
            friend_code=output_endpoint['friendcode'],
            label=output_endpoint['label'],
            widget=widget,
        )
        variable_definitions[vDef.name] = vDef
        order += 1

    for context in widget_info['context']:
        vDef = VariableDef.objects.create(
            name=context['name'],
            type=parser.typeText2typeCode(context['type']),
            aspect=context['aspect'],
            widget=widget,
        )
        ContextOption.objects.create(concept=context['concept'], varDef=vDef)

    for lang in widget_info['translations']:
        translation = widget_info['translations'][lang]
        for index in translation:
            value = translation[index]
            usages = widget_info['translation_index_usage'][index]
            for use in usages:
                if use['type'] == 'vdef':
                    vDef = variable_definitions[use['variable']]
                    table = vDef._get_table_id()
                    element_id = vDef.id
                elif use['type'] == 'upo':
                    upo = user_options[use['variable']][use['option']]
                    table = upo._get_table_id()
                    element_id = upo.id
                else:
                    continue

                Translation.objects.create(
                    text_id=index,
                    element_id=element_id,
                    table=table,
                    language=lang,
                    value=value,
                    default=widget_info['default_lang'] == lang
                )

    return widget


def create_widget_from_wgt(wgt, user, deploy_only=False):

    if isinstance(wgt, WgtFile):
        wgt_file = wgt
    else:
        wgt_file = WgtFile(StringIO(downloader.download_http_content(wgt)))

    template = wgt_deployer.deploy(wgt_file)
    if not deploy_only:
        return create_widget_from_template(template, user)


def get_or_add_widget_from_catalogue(vendor, name, version, user, request=None, assign_to_users=None):
    resource_exists = CatalogueResource.objects.filter(vendor=vendor, short_name=name, version=version).filter(Q(public=True) | Q(users=user)).exists()
    widget_exists = resource_exists and Widget.objects.filter(resource__vendor=vendor, resource__short_name=name, resource__version=version).exists()
    if resource_exists and widget_exists:
        resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
    else:
        from wirecloud.platform.localcatalogue.utils import install_resource_from_available_marketplaces
        resource = install_resource_from_available_marketplaces(vendor, name, version, user)

    if assign_to_users is None:
        assign_to_users = (user,)

    for user in assign_to_users:
        resource.users.add(user)

    return resource.widget


def get_and_add_widget(vendor, name, version, users):

    widget = Widget.objects.get(vendor=vendor, name=name, version=version)
    for user in users:
        widget.users.add(user)

    widget.save()
    return widget


def xpath(tree, query, xmlns):
    if xmlns is None:
        query = query.replace('xhtml:', '')
        return tree.xpath(query)
    else:
        return tree.xpath(query, namespaces={'xhtml': xmlns})


def fix_widget_code(widget_code, base_url, content_type, request, use_platform_style, force_base=False):

    if content_type == 'text/html':
        parser = etree.HTMLParser()
        xmltree = etree.parse(StringIO(str(widget_code)), parser)
        serialization_method = 'html'
    elif content_type == 'application/xhtml+xml':
        xmltree = etree.fromstring(widget_code).getroottree()
        serialization_method = 'xml'
    else:
        return widget_code

    prefix = xmltree.getroot().prefix
    xmlns = None
    if prefix in xmltree.getroot().nsmap:
        xmlns = xmltree.getroot().nsmap[prefix]

    # Fix head element
    head_elements = xpath(xmltree, '/xhtml:html/xhtml:head', xmlns)
    if len(head_elements) == 0:
        head_element = etree.Element("head")
        xmltree.getroot().insert(0, head_element)
    else:
        head_element = head_elements[0]

    # Fix base element
    base_elements = xpath(xmltree, '/xhtml:html/xhtml:head/xhtml:base', xmlns)
    for base_element in base_elements[1:]:
        base_element.parent.remove(base_element)

    if len(base_elements) >= 1 and force_base:
        base_elements[0].set('href', base_url)
    elif len(base_elements) == 0:
        head_element.insert(0, etree.Element('base', href=base_url))

    # Fix scripts
    uses_old_api = False
    scripts = xpath(xmltree, '/xhtml:html//xhtml:script', xmlns)
    for script in scripts:

        if 'src' in script.attrib:
            script.text = ''

        if script.get('src', '') == '/ezweb/js/WirecloudAPI/WirecloudAPI.js':

            script.getparent().remove(script)

        elif script.get('src', '') == '/ezweb/js/EzWebAPI/EzWebAPI.js':
            uses_old_api = True
            script.set('src', get_absolute_static_url('js/EzWebAPI/EzWebAPI.js', request=request))

            files = get_old_widget_api_extensions('index')
            files.reverse()
            for file in files:
                script.addnext(etree.Element('script', type="text/javascript", src=get_absolute_static_url(file, request=request)))

    if not uses_old_api:
        head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url('js/WirecloudAPI/WirecloudAPIClosure.js', request=request)))
        files = get_widget_api_extensions('index')
        files.reverse()
        for file in files:
            head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url(file, request=request)))
        head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url('js/WirecloudAPI/WirecloudAPI.js', request=request)))

        if use_platform_style:
            head_element.insert(0, etree.Element('link', rel="stylesheet", type="text/css", href=get_absolute_static_url('js/EzWebAPI_ext/EzWebGadgets.css', request=request)))
            head_element.insert(0, etree.Element('link', rel="stylesheet", type="text/css", href=get_absolute_static_url('css/gadget.css', request=request)))
    else:
        # Redirect all script starting with /ezweb/ to the platform only when using the old api version
        for script in scripts:
            if script.get('src', '').startswith('/ezweb/'):
                script.set('src', get_absolute_static_url(script.get('src')[7:], request=request))


    # return modified code
    return etree.tostring(xmltree, pretty_print=False, method=serialization_method)
