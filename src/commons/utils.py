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

import types

from decimal import Decimal

from xml.dom.minidom import getDOMImplementation

from django.db import models
from django.core.serializers.json import DateTimeAwareJSONEncoder
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
        for k, v in data.items():
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


def db_table_exists(table, cursor=None):
    """Test if a table exists. Used in south initial steps

        Example: db_table_exists('catalogue_translation')
    """
    try:
        if not cursor:
            from django.db import connection
            cursor = connection.cursor()
        if not cursor:
            raise Exception
        table_names = connection.introspection.get_table_list(cursor)
    except:
        raise Exception("unable to determine if the table '%s' exists" % table)
    else:
        return table in table_names


def save_alternative(model, variant_field, instance):
    unique_key = {}

    for unique_field in model._meta.unique_together[0]:
        unique_key[unique_field] = getattr(instance, unique_field)

    suffix = 2
    base_value = getattr(instance, variant_field)
    while model.objects.filter(**unique_key).exists():
        unique_key[variant_field] = base_value + ' ' + str(suffix)
        suffix += 1

    setattr(instance, variant_field, unique_key[variant_field])
    instance.save()
