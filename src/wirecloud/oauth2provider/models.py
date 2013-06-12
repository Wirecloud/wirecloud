# -*- coding: utf-8 -*-

# Copyright 2013 Universidad Politécnica de Madrid

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


class Application(models.Model):

    client_id = models.CharField(_('Client ID'), max_length=40, blank=False, primary_key=True)
    client_secret = models.CharField(_('Client secret'), max_length=40, blank=False)
    name = models.CharField(_('Application Name'), max_length=40, blank=False)
    home_url = models.CharField(_('URL'), max_length=255, blank=False)
    redirect_uri = models.CharField(_('Redirect URI'), max_length=255, blank=True)

    def __unicode__(self):
        return unicode(self.client_id)


class Code(models.Model):

    client = models.ForeignKey(Application)
    user = models.ForeignKey(User)
    scope = models.CharField(_('Scope'), max_length=255, blank=True)
    code = models.CharField(_('Code'), max_length=255, blank=False)
    expires_in = models.CharField(_('Expires in'), max_length=40, blank=True)

    class Meta:
        unique_together = ('client', 'code')

    def __unicode__(self):
        return unicode(self.code)


class Token(models.Model):

    token = models.CharField(_('Token'), max_length=40, blank=False, primary_key=True)

    client = models.ForeignKey(Application)
    user = models.ForeignKey(User)

    scope = models.CharField(_('Scope'), max_length=255, blank=True)
    token_type = models.CharField(_('Token type'), max_length=10, blank=False)
    refresh_token = models.CharField(_('Refresh token'), max_length=40, blank=True)
    expires_in = models.CharField(_('Expires in'), max_length=40, blank=True)

    def __unicode__(self):
        return unicode(token)
