# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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


def save_alternative(model, variant_field, instance):
    unique_key = {}

    for unique_field in model._meta.unique_together[0]:
        unique_key[unique_field] = getattr(instance, unique_field)

    suffix = 2
    base_value = getattr(instance, variant_field)
    while model.objects.filter(**unique_key).exists():
        unique_key[variant_field] = base_value + '-' + str(suffix)
        suffix += 1

    setattr(instance, variant_field, unique_key[variant_field])
    instance.save()
