# -*- coding: utf-8 -*-

# Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.contrib.auth.models import User, Group
from django.db import models
from django.utils.encoding import python_2_unicode_compatible
from django.utils.translation import ugettext as _


@python_2_unicode_compatible
class Workspace(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    creator = models.ForeignKey(User, related_name='creator', verbose_name=_('Creator'), blank=False, null=False)

    public = models.BooleanField(_('Available to all users'), default=False)
    users = models.ManyToManyField(User, verbose_name=_('Users'), through='UserWorkspace')
    targetOrganizations = models.ManyToManyField(Group, verbose_name=_('Target Organizations'), blank=True, null=True)
    forcedValues = models.TextField(blank=True)
    wiringStatus = models.TextField(blank=True)

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
            update_workspace_preferences(self, {'public': {'value': self.public}})
            self.__original_public = self.public

        super(Workspace, self).save(*args, **kwargs)

        from wirecloud.platform.get_data import _invalidate_cached_variable_values
        _invalidate_cached_variable_values(self)

    def is_shared(self):
        return len(self.users.all()) > 1


@python_2_unicode_compatible
class UserWorkspace(models.Model):

    workspace = models.ForeignKey(Workspace)
    user = models.ForeignKey(User)
    active = models.BooleanField(_('Active'), default=False)
    manager = models.CharField(_('Manager'), max_length=100, blank=True)
    reason_ref = models.CharField(_('Reason Ref'), max_length=100, help_text=_('Reference to the reason why it was added. Used by Workspace Managers to sync workspaces'), blank=True)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_userworkspace'

    def __str__(self):
        return "%s - %s" % (self.workspace, self.user)


@python_2_unicode_compatible
class Tab(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    visible = models.BooleanField(_('Visible'))
    position = models.IntegerField(null=True, blank=True)
    workspace = models.ForeignKey(Workspace, verbose_name=_('Workspace'))

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

        from wirecloud.platform.get_data import _invalidate_cached_variable_values
        _invalidate_cached_variable_values(self.workspace)
