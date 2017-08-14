# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from wirecloud.platform.models import UserWorkspace


class TenantProfile(models.Model):

    user = models.OneToOneField(User, related_name='tenantprofile_4CaaSt')
    id_4CaaSt = models.CharField(max_length=255, blank=False, null=False)


class Profile4CaaSt(models.Model):

    user_workspace = models.OneToOneField(UserWorkspace)
    id_4CaaSt = models.CharField(max_length=255, blank=False, null=False)

    class Meta:
        verbose_name = '4CaaSt Profile'
