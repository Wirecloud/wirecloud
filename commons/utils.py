# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telefónica Investigación y Desarrollo 
#     S.A.Unipersonal (Telefónica I+D) 
# 
# Info about members and contributors of the MORFEO project 
# is available at: 
# 
#   http://morfeo-project.org/
# 
# This program is free software; you can redistribute it and/or modify 
# it under the terms of the GNU General Public License as published by 
# the Free Software Foundation; either version 2 of the License, or 
# (at your option) any later version. 
# 
# This program is distributed in the hope that it will be useful, 
# but WITHOUT ANY WARRANTY; without even the implied warranty of 
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
# GNU General Public License for more details. 
# 
# You should have received a copy of the GNU General Public License 
# along with this program; if not, write to the Free Software 
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
# 
# If you want to use this software an plan to distribute a 
# proprietary application in any way, and you are not licensing and 
# distributing your source code under GPL, you probably need to 
# purchase a commercial license of the product.  More info about 
# licensing options is available at: 
# 
#   http://morfeo-project.org/
#

import os
import types
from decimal import Decimal
from xml.dom.minidom import getDOMImplementation

from django.db import models
from django.conf import settings
from django.core.serializers.json import DateTimeAwareJSONEncoder
from django.contrib.auth.models import User
from django.utils import simplejson

from commons.http_utils import download_http_content
from catalogue.models import GadgetResource
from catalogue.templateParser import TemplateParser as CatalogueTemplateParser
from gadget.models import XHTML
from gadget.templateParser import TemplateParser as GadgetTemplateParser



def json_encode(data, ensure_ascii=False):
    """
    The main issues with django's default json serializer is that properties that
    had been added to a object dynamically are being ignored (and it also has 
    problems with some models).
    """

    def _any(data):
        ret = None
        if type(data) is types.ListType:
            ret = _list(data)
        elif type(data) is types.DictType:
            ret = _dict(data)
        elif isinstance(data, Decimal):
            # json.dumps() cant handle Decimal
            ret = str(data)
        elif isinstance(data, models.query.QuerySet):
            # Actually its the same as a list ...
            ret = _list(data)
        elif isinstance(data, models.Model):
            ret = _model(data)
        else:
            ret = data
        return ret
    
    def _model(data):
        ret = {}
        # If we only have a model, we only want to encode the fields.
        for f in data._meta.fields:
            ret[f.attname] = _any(getattr(data, f.attname))
        # And additionally encode arbitrary properties that had been added.
        fields = dir(data.__class__) + ret.keys()
        add_ons = [k for k in dir(data) if k not in fields]
        for k in add_ons:
            ret[k] = _any(getattr(data, k))
        return ret
    
    def _list(data):
        ret = []
        for v in data:
            ret.append(_any(v))
        return ret
    
    def _dict(data):
        ret = {}
        for k,v in data.items():
            ret[k] = _any(v)
        return ret
    
    ret = _any(data)
    
    return simplejson.dumps(ret, cls=DateTimeAwareJSONEncoder, ensure_ascii=ensure_ascii)

def get_xml_error(value):
    dom = getDOMImplementation()

    doc = dom.createDocument(None, "error", None)
    rootelement = doc.documentElement
    text = doc.createTextNode(value)
    rootelement.appendChild(text)
    errormsg = doc.toxml("utf-8")
    doc.unlink()

    return errormsg

def get_gadgets_files():
    gadgets_dir = []
    gadgets_files = []
    for directory in os.listdir(settings.GADGETS_ROOT):
        if not directory.startswith('.'):
            gadget_dir = os.path.join(settings.GADGETS_ROOT, directory)
            if os.path.isdir(gadget_dir):
                gadgets_dir.append(gadget_dir)
                for fil in os.listdir(gadget_dir):
                    if fil.endswith('.xml') or fil.endswith('.html'):
                        gadget_file = os.path.join(gadget_dir, fil)
                        if os.path.isfile(gadget_file):
                            gadgets_files.append(gadget_file)
            elif gadget_dir.endswith('.xml') or gadget_dir.endswith('.html'):
                if os.path.isfile(gadget_dir):
                    gadgets_files.append(gadget_dir)
    return gadgets_files

def load_gadgets():
    user = User.objects.all()[0]
    gadgets_files = (g for g in get_gadgets_files() if g.endswith('.xml'))
    for gadget_file in gadgets_files:
        template_uri = gadget_file
        template_uri = "file://%s" % gadget_file

        gadget_resources = GadgetResource.objects.filter(template_uri=template_uri)
        for gadget_resource in gadget_resources:
            gadget_resource.delete()

        catalogue_template_parser = CatalogueTemplateParser(template_uri, user)
        catalogue_template_parser.parse()
    code_files = (g for g in get_gadgets_files() if g.endswith('.html'))
    for code_file in code_files:
        code_url = "file://%s" % code_file
        xhtmls = XHTML.objects.filter(url=code_url)
        for xhtml in xhtmls:
            xhtml.code = download_http_content(xhtml.url)
            xhtml.save()
    print "0 errors found"
