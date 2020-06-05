# -*- coding: utf-8 -*-

# Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import ugettext as _


class Application(models.Model):

    client_id = models.CharField(_('Client ID'), max_length=40, blank=False, primary_key=True)
    client_secret = models.CharField(_('Client secret'), max_length=40, blank=False)
    name = models.CharField(_('Application Name'), max_length=40, blank=False)
    home_url = models.CharField(_('URL'), max_length=255, blank=False)
    redirect_uri = models.CharField(_('Redirect URI'), max_length=255, blank=True)

    def __str__(self):
        return self.client_id


class Code(models.Model):

    client = models.ForeignKey(Application, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    scope = models.CharField(_('Scope'), max_length=255, blank=True)
    code = models.CharField(_('Code'), max_length=255, blank=False)
    creation_timestamp = models.CharField(_('Creation timestamp'), max_length=40, blank=False)
    expires_in = models.CharField(_('Expires in'), max_length=40, blank=True)

    class Meta:
        unique_together = ('client', 'code')

    def __str__(self):
        return self.code


class Token(models.Model):

    token = models.CharField(_('Token'), max_length=40, blank=False, primary_key=True)

    client = models.ForeignKey(Application, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    scope = models.CharField(_('Scope'), max_length=255, blank=True)
    token_type = models.CharField(_('Token type'), max_length=10, blank=False)
    refresh_token = models.CharField(_('Refresh token'), max_length=40, blank=True)
    creation_timestamp = models.CharField(_('Creation timestamp'), max_length=40, blank=False)
    expires_in = models.CharField(_('Expires in'), max_length=40, blank=True)

    def __str__(self):
        return self.token


@receiver(post_save, sender=Application)
def invalidate_tokens_on_change(sender, instance, created, raw, **kwargs):
    if created is False:
        instance.token_set.all().update(creation_timestamp='0')
