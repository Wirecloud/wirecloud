# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from django.contrib.auth.models import User
from django.db import models
from django.utils.translation import ugettext as _


class Market(models.Model):
    user = models.ForeignKey(User, verbose_name=_('User'), blank=True, null=True)
    name = models.CharField(_('Name'), max_length=50)
    options = models.TextField(_('Options'))

    class Meta:
        unique_together = ('user', 'name')
        app_label = 'platform'
        db_table = 'wirecloud_market'

    def __unicode__(self):
        if self.user is None:
            return self.name
        else:
            return self.user.username + '/' + self.name


class MarketUserData(models.Model):

    market = models.ForeignKey(Market, verbose_name=_('Market'), blank=False, null=False)
    user = models.ForeignKey(User, verbose_name=_('User'), blank=False, null=False)
    name = models.CharField(_('Name'), max_length=50)
    value = models.CharField(_('Value'), max_length=250)

    class Meta:
        unique_together = ('market', 'user', 'name')
        app_label = 'platform'
        db_table = 'wirecloud_marketuserdata'
