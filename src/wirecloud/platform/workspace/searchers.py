# -*- coding: utf-8 -*-

# Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

import datetime
import logging

from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver
from whoosh import fields
from whoosh.query import And, Or, Term

from wirecloud.commons.searchers import BaseSearcher, get_search_engine
from wirecloud.platform.models import Workspace


# Get an instance of a logger
logger = logging.getLogger(__name__)


class WorkspaceSchema(fields.SchemaClass):

    id = fields.ID(stored=True, unique=True)
    owner = fields.TEXT(stored=True, spelling=True)
    name = fields.TEXT(stored=True, spelling=True)
    title = fields.TEXT(stored=True, spelling=True)
    description = fields.NGRAM(stored=True, minsize=1, phrase=True)
    lastmodified = fields.DATETIME(stored=True)
    longdescription = fields.NGRAM(stored=True, minsize=1, phrase=True)
    searchable = fields.BOOLEAN(stored=True)
    public = fields.BOOLEAN(stored=True)
    users = fields.KEYWORD(commas=True)
    groups = fields.KEYWORD(commas=True)
    shared = fields.BOOLEAN(stored=True)


class WorkspaceSearcher(BaseSearcher):

    indexname = 'workspace'
    model = Workspace
    schema_class = WorkspaceSchema
    default_search_fields = ('owner', 'name', 'title', 'description', 'longdescription')

    def restrict_query(self, request):
        return Or([
            And([Term('public', 't'), Term('searchable', 't')]),
            Term('users', request.user.username)
        ] + [Term('groups', group.name) for group in request.user.groups.all()])

    def build_compatible_fields(self, workspace):
        if workspace.last_modified is not None:
            lastmodified = datetime.datetime.utcfromtimestamp(workspace.last_modified / 1e3)
        else:
            lastmodified = datetime.datetime.utcfromtimestamp(workspace.creation_date / 1e3)

        title = workspace.title if workspace.title is not None and workspace.title.strip() != "" else workspace.name
        return {
            'id': '%s' % workspace.pk,
            'owner': '%s' % workspace.creator,
            'name': '%s' % workspace.name,
            'title': '%s' % title,
            'description': workspace.description,
            'lastmodified': lastmodified,
            'longdescription': workspace.longdescription,
            'searchable': workspace.searchable,
            'public': workspace.public,
            'users': ', '.join(workspace.users.all().values_list('username', flat=True)),
            'groups': ', '.join(workspace.groups.all().values_list('name', flat=True)),
            'shared': workspace.is_shared(),
        }


@receiver(post_save, sender=Workspace)
def update_workspace_index(sender, instance, created, **kwargs):
    try:
        get_search_engine('workspace').add_resource(instance, created)
    except:
        logger.warning("Error adding %s into the workspace search index" % instance)


@receiver(post_delete, sender=Workspace)
def clean_workspace_index(sender, instance, **kwargs):
    try:
        get_search_engine('workspace').delete_resource("id", instance.pk)
    except:
        logger.warning("Error removing workspace %s from the search index" % instance)


@receiver(m2m_changed, sender=Workspace.groups.through)
@receiver(m2m_changed, sender=Workspace.users.through)
def update_users_or_groups(sender, instance, action, reverse, model, pk_set, using, **kwargs):
    if reverse or action.startswith('pre_') or (pk_set is not None and len(pk_set) == 0):
        return

    update_workspace_index(sender, instance, False)
