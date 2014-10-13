# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from lxml import etree
from lxml.html import fragment_fromstring, XHTMLParser


def clean_html(code):
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

    # Add target="_blank" to links
    for link_element in doc.xpath('//a[@href]'):
        link_element.attrib['target'] = '_blank'

    return (doc.text or '') + ''.join([etree.tostring(child, method='xml') for child in doc.iterchildren()])
