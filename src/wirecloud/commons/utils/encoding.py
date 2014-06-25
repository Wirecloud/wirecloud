# -*- coding: utf-8 -*-

# Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import sys

from django.utils.functional import Promise
try:
    from django.utils.encoding import force_text
except:
    from django.utils.encoding import force_unicode as force_text
from json import JSONEncoder


class LazyEncoder(JSONEncoder):
    def default(self, o):
        if isinstance(o, Promise):
            return force_text(o)
        else:
            return super(LazyEncoder, self).default(o)


if sys.version_info >= (2, 7):

    class LazyEncoderXHTML(LazyEncoder):

        def encode(self, o):
            chunks = self.iterencode(o, True)
            if self.ensure_ascii:
                return ''.join(chunks)
            else:
                return ''.join(chunks)

        def iterencode(self, o, _one_shot=False):
            chunks = super(LazyEncoderXHTML, self).iterencode(o, _one_shot)
            for chunk in chunks:
                chunk = chunk.replace('&', '\\u0026')
                chunk = chunk.replace('<', '\\u003c')
                chunk = chunk.replace('>', '\\u003e')
                yield chunk
else:

    class LazyEncoderXHTML(LazyEncoder):

        def encode(self, o):
            chunks = self.iterencode(o)
            if self.ensure_ascii:
                return ''.join(chunks)
            else:
                return ''.join(chunks)

        def iterencode(self, o):
            chunks = super(LazyEncoderXHTML, self).iterencode(o)
            for chunk in chunks:
                chunk = chunk.replace('&', '\\u0026')
                chunk = chunk.replace('<', '\\u003c')
                chunk = chunk.replace('>', '\\u003e')
                yield chunk
