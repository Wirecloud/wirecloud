# -*- coding: utf-8 -*-

# Copyright (c) 2008-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

import time

from django.contrib.auth.models import User, Group
from django.db import models
from django.utils.translation import ugettext as _

from wirecloud.commons.fields import JSONField


def now_timestamp():
    return time.time() * 1000


class Workspace(models.Model):

    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='creator', verbose_name=_('Creator'), blank=False, null=False)
    name = models.CharField(_('Name'), max_length=30)

    title = models.CharField(_('Title'), max_length=255, blank=False, null=False)

    creation_date = models.BigIntegerField(_('Creation Date'), null=False, blank=False, default=now_timestamp)
    last_modified = models.BigIntegerField(_('Last Modification Date'), null=True, blank=True)

    searchable = models.BooleanField(_('Searchable'), default=True)
    public = models.BooleanField(_('Available to all users'), default=False)
    users = models.ManyToManyField(User, verbose_name=_('Users'), through='UserWorkspace')
    groups = models.ManyToManyField(Group, verbose_name=_('Groups'), blank=True)
    description = models.TextField(_('Description'), max_length=140, blank=True)
    longdescription = models.TextField(_('Long description'), blank=True)
    forcedValues = JSONField(blank=True)
    wiringStatus = JSONField(blank=True)

    __original_public = False

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_workspace'
        unique_together = ('creator', 'name')

    def __init__(self, *args, **kwargs):
        super(Workspace, self).__init__(*args, **kwargs)
        self.__original_public = self.public

    def __str__(self):
        return "%s/%s" % (self.creator.username, self.name)

    def save(self, *args, **kwargs):

        if self.public != self.__original_public:
            from wirecloud.platform.preferences.views import update_workspace_preferences
            update_workspace_preferences(self, {'public': {'value': self.public}}, invalidate_cache=False)
            self.__original_public = self.public

        self.last_modified = int(time.time() * 1000)
        if 'update_fields' in kwargs and 'last_modified' not in kwargs['update_fields']:
            kwargs['update_fields'] = tuple(kwargs['update_fields']) + ('last_modified',)

        super(Workspace, self).save(*args, **kwargs)

    def is_available_for(self, user):
        return self.public or user.is_authenticated() and (user.is_superuser or self.creator == user or self.users.filter(id=user.id).exists() or len(set(self.groups.all()) & set(user.groups.all())) > 0)

    def is_shared(self):
        return self.public or self.users.count() > 1 or self.groups.count() > 1


class UserWorkspace(models.Model):

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    manager = models.CharField(_('Manager'), max_length=100, blank=True)
    reason_ref = models.CharField(_('Reason Ref'), max_length=100, help_text=_('Reference to the reason why it was added. Used by Workspace Managers to sync workspaces'), blank=True)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_userworkspace'

    def __str__(self):
        return "%s - %s" % (self.workspace, self.user)


class Tab(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    title = models.CharField(_('Title'), max_length=30, null=False)

    visible = models.BooleanField(_('Visible'), default=False, null=False)
    position = models.IntegerField(null=True, blank=True)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, verbose_name=_('Workspace'))

    class Admin:
        pass

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_tab'
        unique_together = ('name', 'workspace')

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):

        super(Tab, self).save(*args, **kwargs)

        self.workspace.save()
