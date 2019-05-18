# -*- coding: utf-8 -*-

# Copyright 2008-2017 Universidad Politécnica de Madrid

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

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils.translation import check_for_language, gettext_lazy as _, LANGUAGE_SESSION_KEY


class PlatformPreference(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(_('Name'), max_length=250)
    value = models.TextField(_('Value'))

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_platformpreference'

    def __str__(self):
        return self.name


class WorkspacePreference(models.Model):

    workspace = models.ForeignKey('platform.Workspace', on_delete=models.CASCADE)
    name = models.CharField(_('Name'), max_length=250)
    inherit = models.BooleanField(_('Inherit'), default=False)
    value = models.TextField(_('Value'))

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_workspacepreference'

    def __str__(self):
        return self.name


class TabPreference(models.Model):

    tab = models.ForeignKey('platform.Tab', on_delete=models.CASCADE)
    name = models.CharField(_('Name'), max_length=250)
    inherit = models.BooleanField(_('Inherit'), default=False)
    value = models.TextField(_('Value'))

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_tabpreference'

    def __str__(self):
        return self.name


def update_session_lang(request, user):
    lang_code = None
    lang_prefs = PlatformPreference.objects.filter(user=user, name="language")
    if len(lang_prefs) != 0:
        lang_pref = lang_prefs[0]
        if lang_pref.value in ('default', 'browser') or check_for_language(lang_pref.value):
            lang_code = lang_pref.value

    if lang_code in (None, 'default'):
        lang_code = settings.DEFAULT_LANGUAGE

    if lang_code != 'browser':
        request.session[LANGUAGE_SESSION_KEY] = lang_code
    elif LANGUAGE_SESSION_KEY in request.session:
        del request.session[LANGUAGE_SESSION_KEY]
