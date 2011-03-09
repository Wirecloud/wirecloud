# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#

import os.path
import urlparse
from urllib import url2pathname
from urllib2 import URLError, HTTPError

from django.conf import settings
from django.utils.translation import ugettext as _

from commons import http_utils
from commons.exceptions import TemplateParseException
from gadget.models import XHTML


def parse_gadget_code(main_uri, code_uri, gadget_uri, content_type, from_wgt,
                      cacheable=True, user=None):
    code = ""

    url = urlparse.urlparse(code_uri)

    if url.scheme == 'file':
        raise TemplateParseException(_('Invalid URL scheme: file'))

    if from_wgt:
        local_path = code_uri
        if local_path.startswith('/'):
            local_path = local_path.lstrip('/')

        local_path = url2pathname(local_path)
        local_path = os.path.join(settings.BASEDIR, local_path)
        if not os.path.isfile(local_path):
            raise TemplateParseException(_("'%(file)s' is not a file") %
                                         {'file': local_path})

        f = open(local_path, 'r')
        code = f.read()
        f.close()

    else:
        if url.scheme == '':
            fetch_uri = urlparse.urljoin(main_uri, code_uri)
        else:
            fetch_uri = code_uri

        try:
            code = http_utils.download_http_content(fetch_uri, user=user)
        except HTTPError, e:
            msg = _("Error opening URL: code %(errorCode)s(%(errorMsg)s)") % {
                'errorCode': e.code, 'errorMsg': e.msg,
                }
            raise TemplateParseException(msg)
        except URLError, e:
            msg = _("Error opening URL: %(errorMsg)s") % {'errorMsg': e.reason}
            raise TemplateParseException(msg)

    return XHTML.objects.create(uri=gadget_uri + "/xhtml", code=code,
                                url=code_uri, content_type=content_type,
                                cacheable=cacheable)
