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

from catalogue.models import CatalogueResource
from commons import http_utils
from commons.authentication import Http403
from wirecloud.models import ContextOption, Widget, UserPrefOption, UserWorkspace, VariableDef, Workspace, XHTML
from wirecloud.plugins import get_active_features, get_old_widget_api_extensions, get_widget_api_extensions
from wirecloudcommons.utils.http import get_absolute_static_url
from wirecloudcommons.models import Translation
from wirecloudcommons.utils.template import TemplateParser
from wirecloudcommons.utils.wgt import WgtDeployer, WgtFile


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
        template_content = http_utils.download_http_content(template, user=user)
        if base is None:
            base = template
        parser = TemplateParser(template_content, base=base)

    if parser.get_resource_type() != 'widget':
        raise Exception()

    widget_info = parser.get_resource_info()
    check_requirements(widget_info)

    widget = Widget()

    widget.uri = parser.get_resource_uri()

    widget.vendor = widget_info['vendor']
    widget.name = widget_info['name']
    widget.version = widget_info['version']

    widget.description = widget_info['description']
    widget.display_name = widget_info['display_name']
    widget.author = widget_info['author']

    widget_code = parser.get_absolute_url(widget_info['code_url'], base)
    widget.xhtml = XHTML.objects.create(
        uri=widget.uri + "/xhtml",
        url=widget_code,
        content_type=widget_info['code_content_type'],
        cacheable=widget_info['code_cacheable']
    )

    widget.mail = widget_info['mail']
    widget.wikiURI = widget_info['doc_uri']
    widget.imageURI = widget_info['image_uri']
    widget.iPhoneImageURI = widget_info['iphone_image_uri']
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
    for slot in widget_info['wiring']['slots']:
        vDef = VariableDef.objects.create(
            name=slot['name'],
            order=order,
            description=slot['description'],
            type=parser.typeText2typeCode(slot['type']),
            aspect='SLOT',
            friend_code=slot['friendcode'],
            label=slot['label'],
            action_label=slot['actionlabel'],
            widget=widget,
        )
        variable_definitions[vDef.name] = vDef
        order += 1

    order = 0
    for event in widget_info['wiring']['events']:
        vDef = VariableDef.objects.create(
            name=event['name'],
            order=order,
            description=event['description'],
            type=parser.typeText2typeCode(event['type']),
            aspect='EVEN',
            friend_code=event['friendcode'],
            label=event['label'],
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

    widget_table = widget._get_table_id()
    for lang in widget_info['translations']:
        translation = widget_info['translations'][lang]
        for index in translation:
            value = translation[index]
            usages = widget_info['translation_index_usage'][index]
            for use in usages:
                if use['type'] == 'resource':
                    table = widget_table
                    element_id = widget.id
                elif use['type'] == 'vdef':
                    vDef = variable_definitions[use['variable']]
                    table = vDef._get_table_id()
                    element_id = vDef.id
                elif use['type'] == 'upo':
                    upo = user_options[use['variable']][use['option']]
                    table = upo._get_table_id()
                    element_id = upo.id

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
        wgt_file = WgtFile(StringIO(http_utils.download_http_content(wgt)))

    template = wgt_deployer.deploy(wgt_file)
    if not deploy_only:
        return create_widget_from_template(template, user)


def get_resource_from_catalogue(vendor, name, **selectors):
    resources = CatalogueResource.objects.filter(vendor=vendor, short_name=name)

    version = selectors.get('version', None)
    if version is not None:
        resources = resources.filter(version=version)

    resource_type = selectors.get('resource_type', None)
    if resource_type is not None:
        resources = resources.filter(type=resource_type)

    return resources[0]


def create_widget_from_catalogue(user, vendor, name, **selectors):
    selectors['resource_type'] = 0  # Widget
    resource = get_resource_from_catalogue(vendor, name, **selectors)
    if resource.template_uri.lower().endswith('.wgt'):
        return create_widget_from_wgt(resource.template_uri, user)
    else:
        return create_widget_from_template(resource.template_uri, user)


def get_or_add_widget_from_catalogue(vendor, name, version, user, request=None, assign_to_users=None):
    try:
        widget = Widget.objects.get(name=name, vendor=vendor, version=version)
    except:
        widget = create_widget_from_catalogue(user, vendor, name, version=version)

    if assign_to_users is None:
        assign_to_users = (user,)

    for user in assign_to_users:
        widget.users.add(user)

    widget.save()

    return widget


def get_or_create_widget(templateURL, user, workspaceId, request, fromWGT=False):

    # Check permissions
    workspace = Workspace.objects.get(id=workspaceId)
    if workspace.creator != user:
        raise Http403()

    if fromWGT:
        wgt_file = WgtFile(StringIO(http_utils.download_http_content(templateURL)))
        template_content = wgt_file.get_template()
    else:
        template_content = http_utils.download_http_content(templateURL, user=user)

    templateParser = TemplateParser(template_content, templateURL)

    # Widget is created only once
    widget_uri = templateParser.get_resource_uri()
    try:
        widget = Widget.objects.get(uri=widget_uri)
    except Widget.DoesNotExist:
        if fromWGT:
            widget = create_widget_from_wgt(wgt_file, user)
        else:
            widget = create_widget_from_template(templateParser, user, request)

    # A new user has added the widget in his showcase
    # check if the workspace in which the iwidget is being added is shared
    # all the user sharing the workspace should have the widget in their
    # showcases
    if workspace.is_shared():
        # add the widget to the showcase of every user sharing the workspace
        # there is no problem is the widget is already in their showcase
        [widget.users.add(user_ws.user) for user_ws in UserWorkspace.objects.filter(workspace=workspace)]
    else:
        # add the widget to the showcase of the user
        widget.users.add(user)

    return widget


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


def fix_widget_code(widget_code, base_url, content_type, request, force_base=False):

    if content_type == 'text/html':
        parser = etree.HTMLParser()
        xmltree = etree.parse(StringIO(widget_code), parser)
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
        elif script.get('src', '').startswith('/ezweb/'):
            script.set('src', get_absolute_static_url(script.get('src')[7:], request=request))

    if not uses_old_api:
        head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url('js/WirecloudAPI/WirecloudAPIClosure.js', request=request)))
        files = get_widget_api_extensions('index')
        files.reverse()
        for file in files:
            head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url(file, request=request)))
        head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url('js/WirecloudAPI/WirecloudAPI.js', request=request)))

    # return modified code
    return etree.tostring(xmltree, pretty_print=False, method=serialization_method)
