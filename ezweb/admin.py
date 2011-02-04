# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#

from django.contrib import admin
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.utils.translation import ugettext_lazy as _


class EzWebUserCreationForm(UserCreationForm):

    username = forms.RegexField(
        label=_('Username'),
        max_length=30,
        regex=r"^[\w'\.\-]+\s?[\w'\.\-]+$",
        help_text='Required. 30 characters or fewer. Use alphanumeric characters, hyphens, underscores and dots.',
        error_message='This value must contain only letters, numbers, hyphens underscores and dots.')


class EzWebUserChangeForm(UserChangeForm):

    username = forms.RegexField(
        label=_('Username'),
        max_length=30,
        regex=r"^[\w'\.\-]+\s?[\w'\.\-]+$",
        help_text='Required. 30 characters or fewer. Use alphanumeric characters, hyphens, underscores and dots.',
        error_message='This value must contain only letters, numbers, hyphens underscores and dots.')


class EzWebUserAdmin(UserAdmin):

    form = EzWebUserChangeForm
    add_form = EzWebUserCreationForm

admin.site.unregister(User)
admin.site.register(User, EzWebUserAdmin)
