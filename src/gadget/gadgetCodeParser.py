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
import time
import urlparse
from urllib2 import URLError, HTTPError

from django.utils.translation import ugettext as _

from commons import http_utils
from commons.exceptions import TemplateParseException
from deployment.wgtPackageUtils import get_wgt_local_path
from gadget.models import XHTML


def parse_gadget_code(code_uri, gadget_uri, content_type, from_wgt,
                      cacheable=True, user=None, request=None):

    code = ""

    url = urlparse.urlparse(code_uri)

    if url.scheme == 'file':
        raise TemplateParseException(_('Invalid URL scheme: file'))

    if from_wgt:
        local_path = get_wgt_local_path(code_uri)
        if not os.path.isfile(local_path):
            raise TemplateParseException(_("'%(file)s' is not a file") %
                                         {'file': local_path})

        f = open(local_path, 'r')
        code = f.read()
        f.close()

    else:
        if url.scheme == '':
            raise Exception()

        try:
            code = http_utils.download_http_content(code_uri, user=user)
        except HTTPError, e:
            msg = _("Error opening URL: code %(errorCode)s(%(errorMsg)s)") % {
                'errorCode': e.code, 'errorMsg': e.msg,
                }
            raise TemplateParseException(msg)
        except URLError, e:
            msg = _("Error opening URL: %(errorMsg)s") % {'errorMsg': e.reason}
            raise TemplateParseException(msg)

    if not cacheable:
        code = ''
        code_timestamp = None
    else:
        code_timestamp = time.time() * 1000

    return XHTML.objects.create(uri=gadget_uri + "/xhtml", code=code,
                                code_timestamp=code_timestamp, url=code_uri,
                                content_type=content_type, cacheable=cacheable)
