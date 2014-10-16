# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from io import BytesIO

from django.db import IntegrityError
from django.db.models import Q
from django.utils.translation import ugettext as _
from six import string_types

from wirecloud.catalogue.utils import add_packaged_resource, add_resource_from_template
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.platform.localcatalogue.signals import resource_installed
from wirecloud.platform.markets.utils import get_market_managers
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.commons.utils.wgt import WgtFile


def install_resource(file_contents, executor_user):

    if isinstance(file_contents, string_types):
        file_contents = BytesIO(file_contents)
        wgt_file = WgtFile(file_contents)
    elif isinstance(file_contents, WgtFile):
        wgt_file = file_contents
        file_contents = wgt_file.get_underlying_file()
    else:
        raise Exception

    template_contents = wgt_file.get_template()

    template = TemplateParser(template_contents)
    resources = CatalogueResource.objects.filter(vendor=template.get_resource_vendor(), short_name=template.get_resource_name(), version=template.get_resource_version())[:1]

    # Create/recover catalogue resource
    if len(resources) == 1:
        resource = resources[0]
    else:
        resource = add_packaged_resource(file_contents, executor_user, wgt_file=wgt_file)

    return resource


def install_resource_to_user(user, **kwargs):

    executor_user = kwargs.get('executor_user', user)
    downloaded_file = kwargs.get('file_contents', None)
    raise_conflicts = kwargs.get('raise_conflicts', False)

    resource = install_resource(downloaded_file, executor_user)
    if resource.users.filter(pk=user.pk).exists():
        if raise_conflicts:
            raise IntegrityError(_('Resource already exists %(resource_id)s') % {'resource_id': resource.local_uri_part})
    else:
        resource.users.add(user)
        resource_installed.send(sender=resource, user=user)

    return resource


def install_resource_to_group(group, **kwargs):

    executor_user = kwargs.get('executor_user', None)
    downloaded_file = kwargs.get('file_contents', None)

    resource = install_resource(downloaded_file, executor_user)
    resource.groups.add(group)

    resource_installed.send(sender=resource, group=group)

    return resource


def install_resource_to_all_users(**kwargs):

    executor_user = kwargs.get('executor_user', None)
    downloaded_file = kwargs.get('file_contents', None)

    resource = install_resource(downloaded_file, executor_user)
    resource.public = True
    resource.save()

    resource_installed.send(sender=resource)

    return resource


def install_resource_from_available_marketplaces(vendor, name, version, user):

    # Now search it on other marketplaces
    market_managers = get_market_managers(user)
    resource_info = None

    for manager in market_managers:

        try:
            resource_info = market_managers[manager].search_resource(vendor, name, version, user)
        except:
            pass

        if resource_info is not None:
            break

    if resource_info is not None:

        return install_resource_to_user(user, file_contents=resource_info['downloaded_file'])
    else:
        raise Exception


def get_or_add_resource_from_available_marketplaces(vendor, name, version, user):

    if not CatalogueResource.objects.filter(vendor=vendor, short_name=name, version=version).filter(Q(public=True) | Q(users=user)).exists():
        return install_resource_from_available_marketplaces(vendor, name, version, user)
    else:
        return CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
