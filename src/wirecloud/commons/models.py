# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.

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

from django.contrib.auth.models import Group, User
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from wirecloud.commons.searchers import get_search_engine
from wirecloud.platform.models import Organization


@receiver(post_save, sender=Group)
def update_group_index(sender, instance, created, **kwargs):
    get_search_engine('group').add_resource(instance, created)


@receiver(post_delete, sender=Group)
def clean_user_index(sender, instance, **kwargs):
    get_search_engine('group').delete_resource("pk", instance.pk)


@receiver(post_save, sender=User)
def update_user_index(sender, instance, created, **kwargs):
    get_search_engine('user').add_resource(instance, created)


@receiver(post_delete, sender=User)
def clean_user_index(sender, instance, **kwargs):
    get_search_engine('user').delete_resource("pk", instance.pk)


@receiver(post_save, sender=Organization)
def update_user_index_organization(sender, instance, created, **kwargs):
    get_search_engine('user').add_resource(instance.user, False)


@receiver(post_delete, sender=Organization)
def update_user_index_organization_delete(sender, instance, **kwargs):
    get_search_engine('user').add_resource(instance.user, False)
