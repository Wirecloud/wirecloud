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
from gadget.models import XHTML
from gadget.templateParser import TemplateParser as GadgetTemplateParser

from django.utils import simplejson


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

def get_json_error_response(value):
    response = {}
    
    response['result'] = "error"
    response["message"] = value
    
    response = simplejson.dumps(response)

    return response

def get_gadgets_files():
    gadgets_files = []
    if hasattr(settings, 'GADGETS_ROOT'):
        for walk_files in os.walk(settings.GADGETS_ROOT):
            files = walk_files[2]
            for fil in files:
                if fil.endswith('.xml') or fil.endswith('.html'):
                    gadgets_files.append(os.path.join(walk_files[0], fil))
    return gadgets_files


def load_gadgets():
    errors = 0
    user = User.objects.all()[0]
    gadgets_files = []
    code_files = []
    for fil in get_gadgets_files():
        if fil.endswith('.xml'):
            gadgets_files.append(fil)
        else:
            code_files.append(fil)

    for gadget_file in gadgets_files:
        template_uri = gadget_file
        template_uri = "file://%s" % gadget_file

        gadget_resources = GadgetResource.objects.filter(template_uri=template_uri)
        for gadget_resource in gadget_resources:
            gadget_resource.delete()

        from catalogue.templateParser import TemplateParser as CatalogueTemplateParser
        try:
            catalogue_template_parser = CatalogueTemplateParser(template_uri, user)
            catalogue_template_parser.parse()
        except Exception, e:
            print "The file '%s' is not a valid XML template: %s." % (gadget_file, e)
            errors += 1

    for code_file in code_files:
        code_url = "file://%s" % code_file
        xhtmls = XHTML.objects.filter(url=code_url)
        for xhtml in xhtmls:
            try:
                xhtml.code = download_http_content(xhtml.url)
                xhtml.save()
            except Exception, e:
                print "Unable get contents of %s (%s)." % (code_file, e)

    print "%s errors found" % errors
