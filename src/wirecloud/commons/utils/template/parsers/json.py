from __future__ import absolute_import

import json
import urlparse


class JSONTemplateParser(object):

    def __init__(self, template, base=None):

        self.base = base
        self._info = json.loads(template)

    def get_resource_info(self):

        return dict(self._info)

    def get_absolute_url(self, url, base=None):

        if base is None:
            base = self.base

        return urlparse.urljoin(base, url)

