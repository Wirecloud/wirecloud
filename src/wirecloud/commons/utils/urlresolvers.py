# -*- coding: utf-8 -*-

import warnings

from django.core.urlresolvers import reverse
from django.utils.functional import lazy


warnings.warn('wirecloud.commmons.utils.urlresolvers has been deprecated. Please, use django.core.urlresolvers.reverse_lazy directly.', DeprecationWarning)

reverse_lazy = lazy(reverse, str)
