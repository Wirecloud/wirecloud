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

from django.utils.encoding import force_text
from django.utils.functional import Promise
from json import JSONEncoder


class LazyEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, Promise):
            return force_text(o)
        else:
            return super(LazyEncoder, self).default(o)


class LazyEncoderXHTML(LazyEncoder):

    def encode(self, o):
        chunks = self.iterencode(o, True)
        return ''.join(chunks)

    def iterencode(self, o, _one_shot=False):
        chunks = super(LazyEncoderXHTML, self).iterencode(o, _one_shot)
        for chunk in chunks:
            chunk = chunk.replace('&', '\\u0026')
            chunk = chunk.replace('<', '\\u003c')
            chunk = chunk.replace('>', '\\u003e')
            yield chunk
