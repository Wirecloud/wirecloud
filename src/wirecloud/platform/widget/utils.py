# -*- coding: utf-8 -*-

# Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from __future__ import unicode_literals

from io import BytesIO
from lxml import etree

from django.conf import settings
from django.db.models import Q
from django.template import Context, Template

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.http import ERROR_FORMATTERS, get_absolute_static_url
from wirecloud.commons.utils.template import UnsupportedFeature
from wirecloud.commons.utils.wgt import WgtDeployer, WgtFile
from wirecloud.platform.models import Widget, XHTML
from wirecloud.platform.plugins import get_active_features, get_widget_api_extensions


wgt_deployer = WgtDeployer(settings.GADGETS_DEPLOYMENT_DIR)
WIDGET_ERROR_FORMATTERS = ERROR_FORMATTERS.copy()


def get_html_widget_error_response(request, mimetype, status_code, context):
    from django.shortcuts import render
    return render(request, 'wirecloud/widget_error.html', context, status=status_code, content_type=mimetype)

WIDGET_ERROR_FORMATTERS.update({
    'text/html; charset=utf-8': get_html_widget_error_response,
    'application/xhtml+xml; charset=utf-8': get_html_widget_error_response,
})


def check_requirements(resource):

    active_features = get_active_features()

    for requirement in resource['requirements']:
        if requirement['type'] == 'feature':

            if requirement['name'] not in active_features:
                raise UnsupportedFeature('Required feature (%s) is not enabled for this WireCloud installation.' % requirement['name'])

        else:

            raise UnsupportedFeature('Unsupported requirement type (%s).' % requirement['type'])


def create_widget_from_wgt(wgt_file, user, deploy_only=False):

    if not isinstance(wgt_file, WgtFile):
        raise TypeError()

    template = wgt_deployer.deploy(wgt_file)
    if template.get_resource_type() != 'widget':
        raise Exception()

    if not deploy_only:
        widget_info = template.get_resource_info()
        check_requirements(widget_info)

        widget = Widget()
        widget.resource = CatalogueResource.objects.get(vendor=template.get_resource_vendor(), short_name=template.get_resource_name(), version=template.get_resource_version())
        widget_code = template.get_absolute_url(widget_info['contents']['src'])
        widget.xhtml = XHTML.objects.create(
            uri=widget.uri + "/xhtml",
            url=widget_code,
            content_type=widget_info['contents']['contenttype'],
            use_platform_style=widget_info['contents']['useplatformstyle'],
            cacheable=widget_info['contents']['cacheable']
        )
        widget.save()

        return widget


def get_or_add_widget_from_catalogue(vendor, name, version, user, request=None, assign_to_users=None):
    resource_list = CatalogueResource.objects.filter(Q(vendor=vendor, version=version) & (Q(short_name=name) | Q(short_name__startswith=(name + '@'))))

    for resource in resource_list:
        if resource.is_available_for(user):
            return resource.widget

    return None


def xpath(tree, query, xmlns):
    if xmlns is None:
        query = query.replace('xhtml:', '')
        return tree.xpath(query)
    else:
        return tree.xpath(query, namespaces={'xhtml': xmlns})


_widget_platform_style = {}
def get_widget_platform_style(theme):
    global _widget_platform_style

    if theme not in _widget_platform_style or settings.DEBUG is True:
        from wirecloud.platform.core.plugins import BASE_CSS, STYLED_ELEMENTS_CSS
        code = '{% load compress %}{% compress css %}{% load static from staticfiles %}\n'

        for cssfile in ('css/gadget.scss',) + BASE_CSS + STYLED_ELEMENTS_CSS:
            css_type = 'text/x-scss' if cssfile.endswith('.scss') else 'text/css'
            code += '    <link rel="stylesheet" href="{{% static "theme/{}/{}" %}}" context="widget" type="{}" />\n'.format(theme, cssfile, css_type)

        code+= '{% endcompress %}'

        result = Template(code).render(Context({}))
        doc = etree.parse(BytesIO(('<files>' + result + '</files>').encode('utf-8')), etree.XMLParser())

        files = [link.get('href') for link in doc.getroot()]
        files.reverse()
        _widget_platform_style[theme] = tuple(files)

    return _widget_platform_style[theme]


def fix_widget_code(widget_code, base_url, content_type, request, encoding, use_platform_style, requirements, force_base, mode, theme):

    # This line is here for raising UnicodeDecodeError in case the widget_code is not encoded using the expecified encoding
    widget_code.decode(encoding)

    if content_type in ('text/html', 'application/xhtml+xml') and widget_code.strip() == b'':
        widget_code = b'<html></html>'

    if content_type == 'text/html':
        parser = etree.HTMLParser(encoding=encoding)
        serialization_options = {'method': 'html'}

    elif content_type == 'application/xhtml+xml':
        parser = etree.XMLParser(encoding=encoding)
        serialization_options = {'method': 'xml', 'xml_declaration': False}

    else:
        return widget_code

    xmltree = etree.parse(BytesIO(widget_code), parser)

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
        base_element.getparent().remove(base_element)

    if len(base_elements) >= 1 and force_base:
        base_elements[0].set('href', base_url)
    elif len(base_elements) == 0:
        head_element.insert(0, etree.Element('base', href=base_url))

    # Fix scripts
    scripts = xpath(xmltree, '/xhtml:html//xhtml:script', xmlns)
    for script in scripts:

        if 'src' in script.attrib:
            script.text = ''

    head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url('js/WirecloudAPI/WirecloudAPIClosure.js', request=request, versioned=True)))
    files = get_widget_api_extensions(mode, requirements)
    files.reverse()
    for file in files:
        head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url(file, request=request, versioned=True)))
    head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url('js/WirecloudAPI/WirecloudAPICommon.js', request=request, versioned=True)))
    head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url('js/WirecloudAPI/WirecloudWidgetAPI.js', request=request, versioned=True)))
    head_element.insert(0, etree.Element('script', type="text/javascript", src=get_absolute_static_url('js/WirecloudAPI/WirecloudAPIBootstrap.js', request=request, versioned=True)))

    if use_platform_style:
        for file in get_widget_platform_style(theme):
            head_element.insert(0, etree.Element('link', rel="stylesheet", type="text/css", href=file))

    # return modified code
    return etree.tostring(xmltree, pretty_print=False, encoding=encoding, **serialization_options)
