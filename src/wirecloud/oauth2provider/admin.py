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


from django.contrib import admin
from wirecloud.oauth2provider import models

class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('client_id', 'redirect_uri')
    ordering = ('client_id', 'redirect_uri')
admin.site.register(models.Application, ApplicationAdmin)


class CodeAdmin(admin.ModelAdmin):
    list_display = ('client', 'user', '__unicode__')
    ordering = ('client', 'user')
admin.site.register(models.Code, CodeAdmin)


class TokenAdmin(admin.ModelAdmin):
    list_display = ('client', 'user', '__unicode__')
    ordering = ('client', 'user')
admin.site.register(models.Token, TokenAdmin)
