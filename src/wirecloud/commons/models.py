# -*- coding: utf-8 -*-

# Copyright (c) 2015 Conwet Lab., Universidad Politécnica de Madrid

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

from uuid import uuid4

from django.contrib.auth.models import User, Group
from django.db import models
from django.utils.translation import ugettext_lazy as _
from markdown.extensions.toc import slugify

__all__ = ('Organization', 'Team')


class OrganizationManager(models.Manager):

    def is_available(self, name):
        return not User.objects.filter(username=name).exists() and not Group.objects.filter(name=name).exists()

    def search_available_name(self, username):

        max_length = 30
        uuid_length = 8
        short_username = slugify(username, '-')[:max_length - uuid_length]
        final_username = slugify(username, '-')[:max_length]
        while not self.is_available(final_username):
            final_username = short_username + uuid4().hex[:uuid_length]

        return final_username

    def create_organization(self, name, owners=[]):
        user = User.objects.create(username=name)
        group = Group.objects.create(name=name)
        org = self.create(user=user, group=group)
        team = Team.objects.create(organization=org, name='owners')
        for owner in owners:
            team.users.add(owner)

        return org


class Organization(models.Model):

    user = models.OneToOneField(User)
    group = models.OneToOneField(Group)

    objects = OrganizationManager()

    def __str__(self):
        return self.user.username

    class Meta:
        app_label = 'commons'
        db_table = 'wirecloud_organization'


class TeamManager(models.Manager):
    """
    The manager for the auth's Team model.
    """
    def get_by_natural_key(self, organization, name):
        return self.get(organization=organization, name=name)


class Team(models.Model):
    """
    Teams are a generic way of categorizing users to apply permissions, or
    some other label, to those users. A user can belong to any number of
    teams.
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(_('name'), max_length=80)
    users = models.ManyToManyField(User, verbose_name=_('users'), blank=True, related_name="teams")

    objects = TeamManager()

    class Meta:
        unique_together = ('organization', 'name')
        verbose_name = _('team')
        verbose_name_plural = _('teams')
        db_table = 'wirecloud_team'

    def __str__(self):
        return self.name

    def natural_key(self):
        return (self.organization, self.name)
