# -*- coding: utf-8 -*-

# Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

import re

from lxml import etree
from lxml.html import fragment_fromstring, XHTMLParser
from urllib.parse import urljoin, urlparse

from wirecloud.commons.utils.version import Version


VERSION_HEADER_RE = re.compile('[\s(]')


def clean_html(code, base_url=None):
    parser = XHTMLParser()
    doc = fragment_fromstring(code, create_parent=True, parser=parser)

    # Remove processing instructions
    for pi_element in doc.xpath('//processing-instruction()'):
        pi_element.drop_tree()

    # Remove scripts
    for script_element in doc.xpath('//script'):
        script_element.drop_tree()

    # Remove events
    for event_attrib in doc.xpath("//@*[starts-with(name(), 'on')]"):
        event_attrib.getparent().attrib.pop(event_attrib.attrname)

    # Remove audio elements
    for audio_element in doc.xpath('//audio'):
        audio_element.drop_tree()

    # Force controls on videos
    for element in doc.xpath('//video'):
        element.attrib['controls'] = 'controls'

    if base_url is not None:
        # Fix relative media urls
        for element in doc.xpath('//img[@src]|//video[@src]|source[@src]'):
            element.attrib['src'] = urljoin(base_url, element.attrib['src'])

    # Fix links
    for link_element in doc.xpath('//a[@href]'):
        # Remove server relative links
        if not urlparse(link_element.attrib['href']).netloc:
            link_element.drop_tag()
            continue

        # Add target="_blank" to general links
        link_element.attrib['target'] = '_blank'

    return (doc.text or '') + ''.join([etree.tostring(child, method='xml').decode('utf-8') for child in doc.iterchildren()])


def filter_changelog(code, from_version):

    parser = XHTMLParser()
    doc = fragment_fromstring(code, create_parent=True, parser=parser)

    parentelement = None
    for header in doc.xpath('/div/h1|/div/h2|/div/h3'):
        title = header.text[1:] if header.text.startswith('v') else header.text
        try:
            version = Version(VERSION_HEADER_RE.split(title, 1)[0])
        except:
            continue

        parentelement = header.getparent()
        headerelement = header.tag
        for elem in header.itersiblings(preceding=True):
            elem.tail = ""
            elem.drop_tree()
        break

    if parentelement is not None:

        for header in parentelement.xpath(headerelement):
            title = header.text[1:] if header.text.startswith('v') else header.text
            try:
                version = Version(VERSION_HEADER_RE.split(title, 1)[0])
            except:
                continue

            if version <= from_version:
                for elem in header.itersiblings():
                    elem.drop_tree()
                header.tail = ""
                header.drop_tree()
                break

    return (doc.text or '') + ''.join([etree.tostring(child, method='xml').decode('utf-8') for child in doc.iterchildren()])
