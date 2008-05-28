# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telefónica Investigación y Desarrollo 
#     S.A.Unipersonal (Telefónica I+D) 
# 
# Info about members and contributors of the MORFEO project 
# is available at: 
# 
#   http://morfeo-project.org/
# 
# This program is free software; you can redistribute it and/or modify 
# it under the terms of the GNU General Public License as published by 
# the Free Software Foundation; either version 2 of the License, or 
# (at your option) any later version. 
# 
# This program is distributed in the hope that it will be useful, 
# but WITHOUT ANY WARRANTY; without even the implied warranty of 
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
# GNU General Public License for more details. 
# 
# You should have received a copy of the GNU General Public License 
# along with this program; if not, write to the Free Software 
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
# 
# If you want to use this software an plan to distribute a 
# proprietary application in any way, and you are not licensing and 
# distributing your source code under GPL, you probably need to 
# purchase a commercial license of the product.  More info about 
# licensing options is available at: 
# 
#   http://morfeo-project.org/
#

from django.utils.http import urlquote

from commons.http_utils import download_http_content
from commons.exceptions import TemplateParseException

from django.utils.translation import ugettext as _

from gadget.models import XHTML

class GadgetCodeParser:
    xHTML = None

    def parse(self, codeURI, gadgetURI):
        xhtml = ""

        # TODO Fixme!! This works for now, but we have to check if a part of a url is empty
        address = codeURI.split('://')
        query = address[1].split('/',1)
        codeURI = address[0] + "://" + query[0] + "/" + urlquote(query[1])

        try:
            xhtml = download_http_content(codeURI)
        except Exception:
            raise TemplateParseException(_("XHTML code is not accessible"))

        uri = gadgetURI + "/xhtml"
        try:
            self.xHTML = XHTML.objects.get (uri=uri)
        except XHTML.DoesNotExist:
            self.xHTML = XHTML (uri=uri, code=xhtml, url=codeURI)
            self.xHTML.save()
        
        return

    def getXHTML (self):
        return self.xHTML
