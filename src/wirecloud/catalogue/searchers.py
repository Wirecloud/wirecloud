# -*- coding: utf-8 -*-

# Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

import logging

from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver
from whoosh import fields

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.searchers import BaseSearcher, get_search_engine


# Get an instance of a logger
logger = logging.getLogger(__name__)


class CatalogueResourceSchema(fields.SchemaClass):

    pk = fields.ID(stored=True, unique=True)
    vendor_name = fields.ID
    name = fields.TEXT(stored=True, spelling=True)
    vendor = fields.TEXT(stored=True, spelling=True)
    version = fields.TEXT(stored=True)
    template_uri = fields.STORED
    type = fields.TEXT(stored=True)
    creation_date = fields.DATETIME
    title = fields.TEXT(stored=True, phrase=True, spelling=True)
    image = fields.STORED
    smartphoneimage = fields.STORED
    description = fields.TEXT(stored=True, phrase=True, spelling=True)
    wiring = fields.TEXT(spelling=True)
    public = fields.BOOLEAN
    users = fields.KEYWORD(commas=True)
    groups = fields.KEYWORD(commas=True)
    content = fields.NGRAMWORDS()
    input_friendcodes = fields.KEYWORD()
    output_friendcodes = fields.KEYWORD()


class CatalogueResourceSearcher(BaseSearcher):

    indexname = 'resource'
    model = CatalogueResource
    schema_class = CatalogueResourceSchema
    default_search_fields = ('vendor', 'name', 'version', 'type', 'title', 'description', 'wiring')

    def build_compatible_fields(self, resource):

        resource_info = resource.get_processed_info(process_urls=False)

        endpoint_descriptions = ''
        input_friendcodes = []
        output_friendcodes = []

        for endpoint in resource_info['wiring']['inputs']:
            endpoint_descriptions += endpoint['description'] + ' '
            input_friendcodes.extend(endpoint['friendcode'].split(' '))

        for endpoint in resource_info['wiring']['outputs']:
            endpoint_descriptions += endpoint['description'] + ' '
            output_friendcodes.extend(endpoint['friendcode'].split(' '))

        fields = {
            'pk': '%s' % resource.pk,
            'vendor_name': '%s/%s' % (resource.vendor, resource.short_name),
            'vendor': '%s' % resource.vendor,
            'name': '%s' % resource.short_name,
            'version': resource_info['version'],
            'template_uri': resource.template_uri,
            'type': resource_info['type'],
            'creation_date': resource.creation_date.utcnow(),
            'public': resource.public,
            'title': resource_info['title'],
            'description': resource_info['description'],
            'wiring': endpoint_descriptions,
            'image': resource_info['image'],
            'smartphoneimage': resource_info['smartphoneimage'],
            'users': ', '.join(resource.users.all().values_list('username', flat=True)),
            'groups': ', '.join(resource.groups.all().values_list('name', flat=True)),
            'input_friendcodes': ' '.join(set(input_friendcodes)),
            'output_friendcodes': ' '.join(set(output_friendcodes)),
        }

        return fields


@receiver(post_save, sender=CatalogueResource)
def update_catalogue_index(sender, instance, created, **kwargs):
    try:
        get_search_engine('resource').add_resource(instance, created)
    except:
        logger.warning("Error adding %s into the catalogue search index" % instance.local_uri_part)


@receiver(m2m_changed, sender=CatalogueResource.groups.through)
@receiver(m2m_changed, sender=CatalogueResource.users.through)
def update_users_or_groups(sender, instance, action, reverse, model, pk_set, using, **kwargs):
    if reverse or action.startswith('pre_') or (pk_set is not None and len(pk_set) == 0):
        return

    update_catalogue_index(sender, instance, False)
