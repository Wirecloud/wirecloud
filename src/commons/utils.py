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

from xml.dom.minidom import getDOMImplementation

from django.utils import simplejson


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
