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


from django.contrib import admin
from wirecloud import models


admin.site.register(models.Market)

admin.site.register(models.Gadget)
admin.site.register(models.XHTML)
admin.site.register(models.VariableDef)
admin.site.register(models.UserPrefOption)
admin.site.register(models.VariableDefAttr)
admin.site.register(models.ContextOption)
admin.site.register(models.Capability)

admin.site.register(models.PlatformPreference)
admin.site.register(models.WorkSpacePreference)
admin.site.register(models.TabPreference)
