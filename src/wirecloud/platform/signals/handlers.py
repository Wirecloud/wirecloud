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

from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver

from wirecloud.platform.preferences.models import update_session_lang


@receiver(user_logged_in)
def setup_language_from_preferences(sender, **kwargs):
    update_session_lang(kwargs['request'], kwargs['user'])
