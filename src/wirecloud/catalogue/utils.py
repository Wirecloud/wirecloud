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
from urlparse import urljoin

from django.conf import settings
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import WidgetWiring, CatalogueResource
from wirecloud.commons.exceptions import Http403
from wirecloud.commons.models import Translation
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

    return overrides


def add_widget_from_wgt(file, user, wgt_file=None, template=None, deploy_only=False):

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
        author=resource_info['authors'],
        display_name=resource_info['title'],
        description=resource_info['description'],
        mail=resource_info['email'],
        image_uri=resource_info['image'],
        iphone_image_uri=resource_info.get('smartphoneimage', ''),
        wiki_page_uri=resource_info['doc'],
        template_uri=template_uri,
        creation_date=now(),
        popularity='0.0',
        json_description=json.dumps(resource_info)
    )

    for input_endpoint in resource_info['wiring']['inputs']:
        WidgetWiring.objects.create(
            idResource=resource,
            wiring='in',
            friendcode=input_endpoint['friendcode']
        )

    for output_endpoint in resource_info['wiring']['outputs']:
        WidgetWiring.objects.create(
            idResource=resource,
            wiring='out',
            friendcode=output_endpoint['friendcode']
        )

    resource_table = resource._get_table_id()
    for lang in resource_info['translations']:
        translation = resource_info['translations'][lang]
        for index in translation:
            value = translation[index]
            usages = resource_info['translation_index_usage'][index]
            for use in usages:
                if use['type'] != 'resource':
                    continue

                Translation.objects.create(
                    text_id=index,
                    element_id=resource.id,
                    table=resource_table,
                    language=lang,
                    value=value,
                    default=resource_info['default_lang'] == lang
                )

                # Create only a translation entry for this index
                break

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
