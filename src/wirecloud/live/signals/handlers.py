# -*- coding: utf-8 -*-

# Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from asgiref.sync import async_to_sync

import channels.layers
from django.db.models.signals import m2m_changed, post_save

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.live.utils import build_group_name
from wirecloud.platform.models import Workspace


def notify(data, affected_users):
    channel_layer = channels.layers.get_channel_layer()
    for user in affected_users:
        group_name = build_group_name('live-%s' % user)
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "notification",
                "data": data
            }
        )


def get_affected_users(instance):

    if instance.public:
        return {'*'}
    else:
        affected_users = set(instance.users.values_list("username", flat=True))
        for group in instance.groups.all():
            affected_users.update(group.user_set.values_list("username", flat=True))
        return affected_users


def workspace_update(sender, instance, created, raw, using, update_fields, **kwargs):

    affected_users = get_affected_users(instance)

    data = {
        "workspace": "%s" % instance.id,
        "action": "update",
        "category": "workspace"
    }

    if update_fields is not None:
        for field in update_fields:
            data[field] = getattr(instance, field)

    notify(data, affected_users)


def update_users_or_groups(sender, instance, action, reverse, model, pk_set, using, **kwargs):
    if reverse or action.startswith('post_') or (pk_set is not None and len(pk_set) == 0):
        return

    if sender == CatalogueResource.users.through:
        if action == "pre_clear":
            affected_users = set(instance.users.all().values_list("username", flat=True))
        else:
            affected_users = set(model.objects.filter(pk__in=pk_set).values_list("username", flat=True))
    else:  # if sender == CatalogueResource.groups.through
        if action == "pre_clear":
            groups = instance.groups.all()
        else:
            groups = model.objects.filter(pk__in=pk_set)

        affected_users = set()
        for group in groups:
            affected_users.update(group.user_set.values_list("username", flat=True))

    notify(
        {
            "component": instance.local_uri_part,
            "action": "install" if action == "pre_add" else "uninstall",
            "category": "component"
        },
        affected_users
    )


def mac_update(sender, instance, created, raw, **kwargs):

    affected_users = get_affected_users(instance)

    notify(
        {
            "component": instance.local_uri_part,
            "action": "update",
            "category": "component",
        },
        affected_users
    )


def install_signals():
    post_save.connect(workspace_update, sender=Workspace)
    m2m_changed.connect(update_users_or_groups, sender=CatalogueResource.groups.through)
    m2m_changed.connect(update_users_or_groups, sender=CatalogueResource.users.through)
    post_save.connect(mac_update, sender=CatalogueResource)
