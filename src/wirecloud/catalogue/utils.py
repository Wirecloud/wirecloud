# -*- coding: utf-8 -*-

# Copyright (c) 2011-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import json
import os
import time
from urlparse import urljoin, urlparse

from django.conf import settings
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.exceptions import Http403
from wirecloud.commons.utils.http import get_absolute_reverse_url
from wirecloud.commons.utils.timezone import now
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.commons.utils.wgt import InvalidContents, WgtDeployer, WgtFile


wgt_deployer = WgtDeployer(settings.CATALOGUE_MEDIA_ROOT)


def extract_resource_media_from_package(template, package, base_path):

    overrides = {}
    resource_info = template.get_resource_info()

    if resource_info['image'] != '':
        if not resource_info['image'].startswith(('http://', 'https://', '//', '/')):
            image_path = os.path.normpath(resource_info['image'])
            try:
                package.extract_file(resource_info['image'], os.path.join(base_path, image_path), True)
            except KeyError:
                overrides['image'] = urljoin(settings.STATIC_URL, '/images/catalogue/widget_image.png')
        elif resource_info['image'].startswith(('//', '/')):
            overrides['image'] = template.get_absolute_url(resource_info['image'])

    if resource_info['smartphoneimage'] != '':
        if not resource_info['smartphoneimage'].startswith(('http://', 'https://', '//', '/')):
            image_path = os.path.normpath(resource_info['smartphoneimage'])
            try:
                package.extract_file(resource_info['smartphoneimage'], os.path.join(base_path, image_path), True)
            except KeyError:
                overrides['smartphoneimage'] = urljoin(settings.STATIC_URL, '/images/catalogue/widget_image.png')
        elif resource_info['smartphoneimage'].startswith(('//', '/')):
            overrides['smartphoneimage'] = template.get_absolute_url(resource_info['smartphoneimage'])

    if resource_info['doc'] != '':
        if not resource_info['doc'].startswith(('http://', 'https://', '//', '/')):
            doc_path = os.path.normpath(os.path.dirname(resource_info['doc']))
            try:
                package.extract_dir(doc_path, os.path.join(base_path, doc_path))
            except KeyError:
                overrides['doc'] = ''
        elif resource_info['doc'].startswith(('//', '/')):
            overrides['doc'] = template.get_absolute_url(resource_info['doc'])

    return overrides


def add_packaged_resource(file, user, wgt_file=None, template=None, deploy_only=False):

    close_wgt = False
    if wgt_file is None:
        wgt_file = WgtFile(file)
        close_wgt = True

    if template is None:
        template_contents = wgt_file.get_template()
        template = TemplateParser(template_contents)

    if template.get_resource_type() == 'widget':
        resource_info = template.get_resource_info()
        code_url = resource_info['code_url']
        if not code_url.startswith(('http://', 'https://')):
            code = wgt_file.read(code_url)
            try:
                unicode(code, resource_info['code_charset'])
            except UnicodeDecodeError:
                msg = _('%(file_name)s was not encoded using the specified charset (%(charset)s according to the widget descriptor file).')
                raise InvalidContents(msg % {'file_name': code_url, 'charset': resource_info['code_charset']})

    resource_id = (
        template.get_resource_vendor(),
        template.get_resource_name(),
        template.get_resource_version(),
    )
    file_name = '_'.join(resource_id) + '.wgt'
    local_dir = wgt_deployer.get_base_dir(*resource_id)
    local_wgt = os.path.join(local_dir, file_name)

    if not os.path.exists(local_dir):
        os.makedirs(local_dir)

    overrides = extract_resource_media_from_package(template, wgt_file, local_dir)
    if close_wgt:
        wgt_file.close()

    f = open(local_wgt, "wb")
    file.seek(0)
    f.write(file.read())
    f.close()

    if not deploy_only:
        return add_resource_from_template(file_name, template, user, fromWGT=True, overrides=overrides)


def add_resource_from_template(template_uri, template, user, fromWGT=False, overrides=None):

    if isinstance(template, TemplateParser):
        parser = template
    else:
        parser = TemplateParser(template, base=template_uri)

    resource_info = parser.get_resource_info()
    if overrides is not None:
        resource_info.update(overrides)

    resource = CatalogueResource.objects.create(
        short_name=resource_info['name'],
        vendor=resource_info['vendor'],
        version=resource_info['version'],
        fromWGT=fromWGT,
        type=CatalogueResource.RESOURCE_TYPES.index(resource_info['type']),
        creator=user,
        template_uri=template_uri,
        creation_date=now(),
        popularity='0.0',
        json_description=json.dumps(resource_info)
    )

    return resource


def delete_resource(resource, user):

    # Delete the resource only if this user is the owner
    if not user.is_superuser and resource.creator != user:
        msg = _("user %(username)s is not the owner of the resource %(resource_id)s") % {'username': user.username, 'resource_id': resource.id}

        raise Http403(msg)

    result = {'removedIWidgets': []}
    if 'wirecloud.platform' in settings.INSTALLED_APPS and resource.resource_type() == 'widget':
        from wirecloud.platform.widget.views import deleteWidget

        # Remove the widget from the showcase
        result = deleteWidget(user, resource.short_name, resource.vendor, resource.version)

    # Delete the object
    resource.delete()

    return result


def get_resource_data(resource, user, request=None):
    """Gets all the information related to the given resource."""
    resource_info = resource.get_processed_info(request)

    if urlparse(resource.template_uri).scheme == '':
        template_uri = get_absolute_reverse_url('wirecloud_catalogue.media', kwargs={
            'vendor': resource.vendor,
            'name': resource.short_name,
            'version': resource.version,
            'file_path': resource.template_uri
        }, request=request)
    else:
        template_uri = resource.template_uri

    uploader = None
    if resource.creator is not None:
        uploader = resource.creator.get_full_name()
        if uploader.strip() == '':
            uploader = resource.creator.username

    cdate = resource.creation_date
    creation_timestamp = time.mktime(cdate.timetuple()) * 1e3 + cdate.microsecond / 1e3

    return {
        'id': resource.pk,
        'vendor': resource.vendor,
        'name': resource.short_name,
        'version': resource.version,
        'type': resource_info['type'],
        'packaged': resource.fromWGT,
        'date': creation_timestamp,
        'uploader': uploader,
        'permissions': {
            'delete': user.is_superuser,
            'uninstall': resource.public is False and resource.users.filter(pk=user.pk).exists(),
        },
        'authors': resource_info['authors'],
        'title': resource_info['title'],
        'description': resource_info['description'],
        'email': resource_info['email'],
        'image': resource_info['image'],
        'doc': resource_info['doc'],
        'changelog': resource_info['changelog'],
        'uriTemplate': template_uri,
        'license': resource_info['license'],
        'licenseurl': resource_info['licenseurl'],
    }


def get_resource_group_data(resources, user, request=None):

    data = {
        'vendor': resources[0].vendor,
        'name': resources[0].short_name,
        'type': resources[0].resource_type(),
        'versions': [],
    }
    for resource in resources:
        current_resource_data = get_resource_data(resource, user, request)
        del current_resource_data['vendor']
        del current_resource_data['name']
        del current_resource_data['type']
        data['versions'].append(current_resource_data)

    return data


def get_latest_resource_version(name, vendor):

    resource_versions = CatalogueResource.objects.filter(vendor=vendor, short_name=name)
    if resource_versions.count() > 0:
        # convert from ["1.9", "1.10", "1.9.1"] to [[1,9], [1,10], [1,9,1]] to
        # allow comparing integers
        versions = [map(int, r.version.split(".")) for r in resource_versions]

        index = 0
        for k in range(len(versions)):
            if max(versions[index], versions[k]) == versions[k]:
                index = k

        return resource_versions[index]

    return None
