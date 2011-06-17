# -*- coding: utf-8 -*-

# MORFEO Project
# http://morfeo-project.org
#
# Component: EzWeb
#
# (C) Copyright 2008 Telefónica Investigación y Desarrollo
#     S.A.Unipersonal (Telefónica I+D)
#
# Info about members and contributors of the MORFEO project
# is available at:
#
#   http://morfeo-project.org/
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
#
# If you want to use this software an plan to distribute a
# proprietary application in any way, and you are not licensing and
# distributing your source code under GPL, you probably need to
# purchase a commercial license of the product.  More info about
# licensing options is available at:
#
#   http://morfeo-project.org/
#

# @author jmostazo-upm

from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.signals import user_logged_in
from django.utils.translation import check_for_language, get_language, gettext_lazy as _

from workspace.models import WorkSpace, Tab


class PlatformPreference(models.Model):

    user = models.ForeignKey(User)
    name = models.CharField(_('Name'), max_length=250)
    value = models.CharField(_('Value'), max_length=250)


class WorkSpacePreference(models.Model):

    workspace = models.ForeignKey(WorkSpace)
    name = models.CharField(_('Name'), max_length=250)
    inherit = models.BooleanField(_('Inherit'), default=False)
    value = models.CharField(_('Value'), max_length=250)


class TabPreference(models.Model):

    tab = models.ForeignKey(Tab)
    name = models.CharField(_('Name'), max_length=250)
    inherit = models.BooleanField(_('Inherit'), default=False)
    value = models.CharField(_('Value'), max_length=250)


def setup_language_from_preferences(sender, **kwargs):
    user = kwargs['user']
    request = kwargs['request']

    lang_code = None
    pref_exists = True
    try:
        lang_pref = PlatformPreference.objects.get(user=user, name="language")
        if check_for_language(lang_pref.value):
            lang_code = lang_pref.value
    except PlatformPreference.DoesNotExist:
        pref_exists = False

    if lang_code is None:
        lang_code = get_language()
        if not pref_exists:
            PlatformPreference.objects.create(user=user, name="language", value=lang_code)

    request.session['django_language'] = lang_code


user_logged_in.connect(setup_language_from_preferences)
