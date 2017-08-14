# -*- coding: utf-8 -*-

# Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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
import sys

from django.db import IntegrityError
import six

from wirecloud.catalogue.utils import add_packaged_resource
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.platform.localcatalogue.signals import resource_installed
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.commons.utils.template.writers.json import write_json_description


def add_m2m(field, item):
    # Work around for https://code.djangoproject.com/ticket/19544
    if field.filter(pk=item.pk).exists():
        return False

    try:
        field.add(item)
        return True
    except IntegrityError:
        exc_info = sys.exc_info()
        if field.filter(pk=item.pk).exists():
            return False
        six.reraise(*exc_info)


def install_resource(wgt_file, executor_user):

    if not isinstance(wgt_file, WgtFile):
        raise TypeError('wgt_file must be a WgtFile')

    file_contents = wgt_file.get_underlying_file()
    template_contents = wgt_file.get_template()

    template = TemplateParser(template_contents)
    resources = CatalogueResource.objects.filter(vendor=template.get_resource_vendor(), short_name=template.get_resource_name(), version=template.get_resource_version())[:1]

    # Create/recreate/recover catalogue resource
    if '-dev' in template.get_resource_version() and len(resources) == 1:
        # TODO: Update widget visually
        resources[0].delete()
        resource = add_packaged_resource(file_contents, executor_user, wgt_file=wgt_file)
    elif len(resources) == 1:
        resource = resources[0]
    else:
        resource = add_packaged_resource(file_contents, executor_user, wgt_file=wgt_file)

    return resource


def install_resource_to_user(user, **kwargs):

    executor_user = kwargs.get('executor_user', user)
    downloaded_file = kwargs.get('file_contents', None)

    resource = install_resource(downloaded_file, executor_user)
    added = add_m2m(resource.users, user)
    if added:
        resource_installed.send(sender=resource, user=user)

    return added, resource


def install_resource_to_group(group, **kwargs):

    executor_user = kwargs.get('executor_user', None)
    downloaded_file = kwargs.get('file_contents', None)

    resource = install_resource(downloaded_file, executor_user)
    added = add_m2m(resource.groups, group)
    if added:
        resource_installed.send(sender=resource, group=group)

    return added, resource


def install_resource_to_all_users(**kwargs):

    executor_user = kwargs.get('executor_user', None)
    downloaded_file = kwargs.get('file_contents', None)

    resource = install_resource(downloaded_file, executor_user)
    if resource.public:
        added = False
    else:
        added = True
        resource.public = True
        resource.save()
        resource_installed.send(sender=resource)

    return added, resource


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
