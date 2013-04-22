# -*- coding: utf-8 -*-

# Copyright 2008-2013 Universidad Politécnica de Madrid

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
from django.contrib.auth.signals import user_logged_in
from django.db import models
from django.utils.translation import check_for_language, gettext_lazy as _


class PlatformPreference(models.Model):

    user = models.ForeignKey(User)
    name = models.CharField(_('Name'), max_length=250)
    value = models.CharField(_('Value'), max_length=250)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_platformpreference'


class WorkspacePreference(models.Model):

    workspace = models.ForeignKey('platform.Workspace')
    name = models.CharField(_('Name'), max_length=250)
    inherit = models.BooleanField(_('Inherit'), default=False)
    value = models.CharField(_('Value'), max_length=250)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_workspacepreference'


class TabPreference(models.Model):

    tab = models.ForeignKey('platform.Tab')
    name = models.CharField(_('Name'), max_length=250)
    inherit = models.BooleanField(_('Inherit'), default=False)
    value = models.CharField(_('Value'), max_length=250)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_tabpreference'


def update_session_lang(request, user):
    lang_code = None
    pref_exists = True
    lang_prefs = PlatformPreference.objects.filter(user=user, name="language")
    if len(lang_prefs) != 0:
        lang_pref = lang_prefs[0]
        if lang_pref.value in ('default', 'browser') or check_for_language(lang_pref.value):
            lang_code = lang_pref.value
    else:
        pref_exists = False

    if lang_code in (None, 'default'):
        lang_code = settings.DEFAULT_LANGUAGE
        if not pref_exists:
            PlatformPreference.objects.create(user=user, name="language", value=lang_code)

    if lang_code != 'browser':
        request.session['django_language'] = lang_code
    elif 'django_language' in request.session:
        del request.session['django_language']


def setup_language_from_preferences(sender, **kwargs):
    user = kwargs['user']
    request = kwargs['request']

    update_session_lang(request, user)


user_logged_in.connect(setup_language_from_preferences)
