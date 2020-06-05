# -*- coding: utf-8 -*-

# Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

import re

from django.core.exceptions import PermissionDenied
from django.db import IntegrityError

from wirecloud.catalogue.utils import add_packaged_resource, check_vendor_permissions
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.commons.utils.template.writers.json import write_json_description
from wirecloud.platform.localcatalogue.signals import resource_installed


def add_m2m(field, item):
    # Work around for https://code.djangoproject.com/ticket/19544
    if field.filter(pk=item.pk).exists():
        return False

    try:
        field.add(item)
        return True
    except IntegrityError:
        if field.filter(pk=item.pk).exists():
            return False
        raise


def install_resource(wgt_file, executor_user, restricted=False):

    if not isinstance(wgt_file, WgtFile):
        raise TypeError('wgt_file must be a WgtFile')

    file_contents = wgt_file.get_underlying_file()
    template_contents = wgt_file.get_template()

    template = TemplateParser(template_contents)
    resource_version = template.get_resource_version()
    if restricted:
        if '-dev' in resource_version:
            raise PermissionDenied("dev versions cannot be published")
        vendor = template.get_resource_vendor()
        if check_vendor_permissions(executor_user, vendor) is False:
            raise PermissionDenied("You don't have persmissions to publish in name of {}".format(vendor))

    resources = CatalogueResource.objects.filter(vendor=template.get_resource_vendor(), short_name=template.get_resource_name(), version=template.get_resource_version())[:1]

    # Create/recreate/recover catalogue resource
    if '-dev' in resource_version and len(resources) == 1:
        # dev version are automatically overwritten
        resources[0].delete()
        resource = add_packaged_resource(file_contents, executor_user, wgt_file=wgt_file)
    elif len(resources) == 1:
        resource = resources[0]
    else:
        resource = add_packaged_resource(file_contents, executor_user, wgt_file=wgt_file)

    return resource


def install_component(file_contents, executor_user=None, public=False, users=[], groups=[], restricted=False):
    resource = install_resource(file_contents, executor_user, restricted=restricted)
    if executor_user is not None:
        initially_available = resource.is_available_for(executor_user)
    installed_to_someone = False

    change = public is True and resource.public is False
    if change:
        resource.public = True
        resource.save()
        resource_installed.send(sender=resource)
        installed_to_someone = True

    for user in users:
        change = add_m2m(resource.users, user)
        installed_to_someone |= change
        if change and not public:
            resource_installed.send(sender=resource, user=user)

    for group in groups:
        change = add_m2m(resource.groups, group)
        installed_to_someone |= change
        if change and not public:
            resource_installed.send(sender=resource, group=group)

    if executor_user is not None:
        finally_available = resource.is_available_for(executor_user)
        return initially_available is False and finally_available is True, resource
    else:
        return installed_to_someone, resource


def fix_dev_version(wgt_file, user):

    template_contents = wgt_file.get_template()
    template = TemplateParser(template_contents)

    resource_info = template.get_resource_info()

    # Add user name to the version if the component is in development
    if '-dev' in resource_info['version']:

        # User name added this way to prevent users to upload a version
        # *.*-devAnotherUser that would be accepted but might collide with
        # AnotherUser's development version
        resource_info['version'] = re.sub('-dev.*$', '-dev' + user.username, resource_info['version'])
        template_string = write_json_description(resource_info)
        wgt_file.update_config(template_string)
