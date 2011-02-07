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
from HTMLParser import HTMLParser


# HTML Parser for EzWeb
class HTMLHeadParser(HTMLParser):
	def __init__(self, document):
		HTMLParser.__init__(self)
		self.starthead = None
		self.endbase = None
		self.starthtml = None
		self.baseHref = None
		self.feed(document)

	def handle_starttag(self, tag, attrs):
		# Check if base tag has href attribute
		if tag == "base":
			for name, value in attrs:
				if ((name == "href") and (value != None) and
						(value != '')):
						self.baseHref = value
						return

		if tag == "html":
			line, colum = self.getpos()
			self.starthtml = line

		if tag == "head":
			line, colum = self.getpos()
			self.starthead = line

	def handle_endtag(self, tag):
		# Get no line end head tag
		if tag == "base":
			line, colum = self.getpos()
			self.endbase = line

	def handle_startendtag(self, tag, attrs):
		# Check if base tag has href attribute
		if tag == "base":
			for name, value in attrs:
				if ((name == "href") and (value != None) and
						(value != '')):
						self.baseHref = value
						return

	# Return line number of </head>
	def getPosStartHead(self):
		return self.starthead

	# Return line number of </base>
	def getPosEndBase(self):
		return self.endbase

	# Return href attribute of base tag
	def getHrefBase(self):
		return self.baseHref

	# Return line number of <html>
	def getPosStartHtml(self):
		return self.starthtml
