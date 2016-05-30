# -*- coding: utf-8 -*-

# Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import json

from channels import Group
from django.dispatch import receiver
from django.db.models.signals import m2m_changed, post_save
import requests

from wirecloud.platform.models import CatalogueResource, Workspace


def notify(data, affected_users):
    for user in affected_users:
        Group('wc-live-%s' % user).send({"text": json.dumps(data)})


def get_affected_users(instance):

    if instance.public:
        return '*'
    else:
        affected_users = set(instance.users.values_list("username", flat=True))
        for group in instance.groups.all():
            affected_users.update(group.user_set.values_list("username", flat=True))
        return ",".join(affected_users)


@receiver(post_save, sender=Workspace)
def workspace_update(sender, instance, created, raw, **kwargs):

    affected_users = get_affected_users(instance)

    if affected_users != '':
        notify(
            {
                "workspace": instance.id,
                "action": "update",
            },
            affected_users
        )


@receiver(m2m_changed, sender=CatalogueResource.groups.through)
@receiver(m2m_changed, sender=CatalogueResource.users.through)
def update_users_or_groups(sender, instance, action, reverse, model, pk_set, using, **kwargs):
    if reverse or action.startswith('pre_') or (pk_set is not None and len(pk_set) == 0):
        return

    affected_users = ",".join(model.objects.filter(pk__in=pk_set).values_list("username", flat=True))
    notify(
        {
            "component": instance.local_uri_part,
            "action": "installed" if action == "post_add" else "uninstalled"
        },
        affected_users
    )


@receiver(post_save, sender=CatalogueResource)
def mac_update(sender, instance, created, raw, **kwargs):

    affected_users = get_affected_users(instance)

    if affected_users != '':
        notify(
            {
                "component": instance.local_uri_part,
                "action": "update",
            },
            affected_users
        )
