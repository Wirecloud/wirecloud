# -*- coding: utf-8 -*-

from compressor.filters import FilterBase


class JSUseStrictFilter(FilterBase):

    def output(self, **kwargs):
        return self.remove_use_strict(self.content)

    def remove_use_strict(self, js):
        # Replacing by a ';' is safer than replacing by ''
        js = js.replace("'use strict';", ';')
        js = js.replace('"use strict";', ';')
        return js
