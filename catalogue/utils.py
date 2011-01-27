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

from os import path
from urllib2 import URLError, HTTPError

from django.utils.translation import ugettext as _

from catalogue.templateParser import TemplateParser
from commons.exceptions import TemplateParseException
from commons.http_utils import download_http_content
from deployment.wgtPackageUtils import get_wgt_local_path


def add_resource_from_template_uri(template_uri, user, fromWGT=False):

    if fromWGT:

        localPath = get_wgt_local_path(template_uri)
        if not path.isfile(localPath):
            raise Exception(_("'%(file)s' is not a file") % {'file': localPath})

        f = open(localPath, 'r')
        template = f.read()
        f.close()

    else:

        try:
            template = download_http_content(template_uri, user=user)
        except HTTPError, e:
            msg = _("Error downloading resource template '%(url)s': code %(errorCode)s (%(errorMsg)s)")
            raise TemplateParseException(msg % {'url': template_uri, 'errorCode': e.code, 'errorMsg': e.msg})
        except URLError, e:
            if isinstance(e.reason, str) or isinstance(e.reason, unicode):
                context = {'errorMsg': e.reason, 'url': template_uri}
                msg = _("Bad resource template URL '%(url)s': %(errorMsg)s") % context
            else:
                context = {'errorMsg': e.reason.strerror, 'url': template_uri}
                msg = _("Error downloading resource template '%(url)s': %(errorMsg)s") % context

            raise TemplateParseException(msg)
        except ValueError, e:
            context = {'errorMsg': e, 'url': template_uri}
            msg = _("Bad resource template URL '%(url)s': %(errorMsg)s") % context
            raise TemplateParseException(msg)

    return add_resource_from_template(template_uri, template, user, fromWGT=fromWGT)


def add_resource_from_template(template_uri, template, user, fromWGT=False):
    templateParser = TemplateParser(template_uri, template, user, fromWGT=fromWGT)
    templateParser.parse()

    return templateParser, templateParser.get_gadget()
