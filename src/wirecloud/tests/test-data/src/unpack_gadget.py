#! /usr/bin/env python
# -*- coding: utf-8 -*-

import codecs
import os
import re
import shutil
import sys
import xml.dom.minidom
import zipfile

from getopt import getopt, GetoptError
from lxml import etree
from StringIO import StringIO
from tempfile import mkdtemp


class UnpackException(Exception):

    def __init__(self, message):
        self.message = message

    def __str__(self):
        return self.message


class WgtPackageUtils:

    def __init__(self):
        self.extension = ".wgt"

    def extract(self, file, path):
        zip_file = zipfile.ZipFile(file)

        if (not os.path.exists(path) or not os.path.isdir(path)):
            os.mkdir(path, 0777)

        for name in zip_file.namelist():
            listnames = name.split("/")[:-1]
            folder = path
            if name.endswith("/"):
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if (not os.path.exists(folder)) or ((os.path.exists(folder))
                        and (not os.path.isdir(folder))):
                        os.mkdir(folder)
            else:
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if (not os.path.exists(folder)) or ((os.path.exists(folder))
                        and (not os.path.isdir(folder))):
                        os.mkdir(folder)
                outfile = open(os.path.join(path, name.replace("/", os.sep)), 'wb')
                outfile.write(zip_file.read(name))
                outfile.close()


class TemplateParser:

    def __init__(self, template_file):
        self.template_file = template_file
        self.xmldoc = xml.dom.minidom.parse(template_file)

    def get_html_file(self):
        xhtmlElement = self.xmldoc.getElementsByTagName("XHTML")[0]
        return xhtmlElement.getAttribute('href')

    def set_base(self, baseURL):
        aux = baseURL.split('/')
        aux = aux[len(aux) - 1]

        # Set ImageURI tag
        if self.xmldoc.getElementsByTagName("ImageURI"):
            imageURIElement = self.xmldoc.getElementsByTagName("ImageURI")[0]
            oldURL = imageURIElement.firstChild.nodeValue
            try:
                idx = oldURL.index(aux) + len(aux)
                imageURL = baseURL + oldURL[idx:]
            except:
                imageURL = baseURL + '/' + oldURL
            imageURIElement.firstChild.replaceWholeText(imageURL)

        # Set iPhoneImageURI tag
        if self.xmldoc.getElementsByTagName("iPhoneImageURI"):
            iPhoneImageURIElement = self.xmldoc.getElementsByTagName("iPhoneImageURI")[0]
            oldURL = iPhoneImageURIElement.firstChild.nodeValue
            try:
                idx = oldURL.index(aux) + len(aux)
                iPhoneImageURL = baseURL + oldURL[idx:]
            except:
                iPhoneImageURL = baseURL + '/' + oldURL
            iPhoneImageURIElement.firstChild.replaceWholeText(iPhoneImageURL)

        xhtmlElement = self.xmldoc.getElementsByTagName("XHTML")[0]
        xhtmlURL = xhtmlElement.getAttribute('href')
        try:
            idx = xhtmlURL.index(aux) + len(aux)
            xhtmlElement.setAttribute('href', baseURL + xhtmlURL[idx:])
        except:
            xhtmlElement.setAttribute('href', baseURL + '/' + xhtmlURL)

    def save(self):

        content = self.xmldoc.toxml()

        f = codecs.open(self.template_file, 'wb', 'utf-8')
        f.write(content)
        f.close()


def xpath(tree, query, xmlns):
    if xmlns == None:
        query = query.replace('xhtml:', '')
        return tree.xpath(query)
    else:
        return tree.xpath(query, namespaces={'xhtml': xmlns})


def insertBaseTag(html_file, baseURL):
    if baseURL[len(baseURL) - 1] != '/':
        baseURL += '/'

    f = codecs.open(html_file, 'rb', 'utf-8')
    html_content = f.read()
    f.close()

    try:
        #method = 'xml'
        html_content = re.sub('^\s*<!--([^-]|-[^-]|--[^>\)])*-->\s*', '', html_content)
        xmltree = etree.fromstring(html_content).getroottree()
    except:
        #method = 'html'
        parser = etree.HTMLParser()
        xmltree = etree.parse(StringIO(html_content), parser)

    prefix = xmltree.getroot().prefix
    xmlns = None
    if prefix in xmltree.getroot().nsmap:
        xmlns = xmltree.getroot().nsmap[prefix]

    headList = xpath(xmltree, '/xhtml:html/xhtml:head', xmlns)
    if len(headList) == 0:
        head = etree.Element('head')
        xmltree.getroot().insert(0, head)
    else:
        head = headList[0]

    baseElements = xpath(xmltree, '/xhtml:html//xhtml:base', xmlns)
    for baseElement in baseElements:
        baseElement.getparent().remove(baseElement)

    base = etree.Element('base', href=baseURL)
    head.insert(0, base)

    # Save modifications
    content = etree.tostring(xmltree, pretty_print=True, method='html')

    f = codecs.open(html_file, 'wb', 'utf-8')
    f.write(content)
    f.close()


def get_widget_info(config_file):
    xmldoc = xml.dom.minidom.parse(config_file)
    widget = xmldoc.getElementsByTagName("widget")[0]

    template = widget.getAttribute("id")
    name = widget.getAttribute("name")
    version = widget.getAttribute("version")
    vendor = widget.getAttribute("vendor")

    return (template, vendor, name, version)


def unpack_gadget(wgt_file, dst_dir, baseURL):

    if os.path.exists(dst_dir):
        raise UnpackException("Destination directory already exists")

    pkg = WgtPackageUtils()
    tmp_dir = mkdtemp()

    try:
        pkg.extract(wgt_file, tmp_dir)
        config_file = os.path.join(tmp_dir, 'config.xml')
        (template, vendor, name, version) = get_widget_info(config_file)
        if baseURL[-1] != '/':
            baseURL += '/'
        relocate_base_url(tmp_dir, template, baseURL + dst_dir)
    except:
        shutil.rmtree(tmp_dir)
        raise

    shutil.move(tmp_dir, dst_dir)


def relocate_base_url(gadget_dir, template, baseURL):

    if len(baseURL) > 0 and baseURL[-1] == '/':
        baseURL = baseURL[:-1]

    template_parser = TemplateParser(os.path.join(gadget_dir, template))
    html_file = template_parser.get_html_file()

    # Add baseURL to gadget manifest
    template_parser.set_base(baseURL)
    template_parser.save()

    # Search for html template filename and relative path
    aux = baseURL.split('/')
    aux = aux[len(aux) - 1]
    try:
        idx = html_file.index(aux) + len(aux)
        if html_file[idx:][0] == '/':
            idx += 1
    except:
        idx = 0
    if not(html_file.startswith('http://') or html_file.startswith('https://')):
        idx = 0

    # Add tag base to html template
    insertBaseTag(os.path.join(gadget_dir, html_file[idx:]), baseURL)


def usage():
    print """
unpack_gadget.py <wgt_file> <output_dir> <baseURL>...
    """
if __name__ == '__main__':

    try:
        opts, args = getopt(sys.argv[1:], "", [])
    except GetoptError, err:
        print str(err)
        usage()
        sys.exit(2)

    if len(args) != 3:
        usage()
        sys.exit(2)

    baseURL = args[2]
    if baseURL[-1:] != '/':
        baseURL += '/'

    try:
        unpack_gadget(args[0], args[1], baseURL)
    except UnpackException, e:
        print e.message
