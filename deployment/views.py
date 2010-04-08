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
from os import path, remove, chdir, makedirs
from tempfile import mkdtemp
from urllib import pathname2url, url2pathname
from shutil import rmtree
from django.conf import settings
from django.http import HttpResponse, HttpResponseServerError
from django.http import HttpResponseForbidden, HttpResponseBadRequest
from django.http import HttpResponseRedirect
from django.utils import simplejson
from django.utils.http import urlquote_plus
from django.utils.translation import ugettext as _
from commons.resource import Resource
from commons.authentication import user_authentication, Http403
from commons.logs import log, log_detailed_exception, log_request
from commons.logs_exception import TracedServerError
from commons.utils import get_xml_error
from wgtPackageUtils import WgtPackageUtils
from settings import BASEDIR as BASEDIR_PLATFORM
from xml.dom.minidom import parse # XML Parser
from ezweb.views import add_gadget_script
import codecs
import re
from django.views.static import serve

class Static(Resource):
	def read(self, request, path):
		return serve(request, path.encode("utf8"), settings.GADGETS_ROOT, False)

class Error(Resource):
	def read(self, request):
		if request.GET.has_key('msg'):
			msg = request.GET['msg']
		else:
			msg = 'Gadget could not be created'

		response = HttpResponse(msg, mimetype='text/plain')
		response['Pragma'] = 'no-cache'

		return response

class Resources(Resource):

	def create(self, request):
		# Deployment Info
		info = InfoDeployment(request)
        
		try:
			user = user_authentication(request, request.user.username)
		except Http403, e:
			msg = _("This gadget cannot be created") + unicode(e)
			log (msg, request)
			return HttpResponseForbidden(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

		try:
			# Create temporal folder, user temporal folder and gadgets folder
			info.create_folders()
		except Exception, e:
			msg = _("Error creating deployment dirs: %(errorMsg)s")

			e = TracedServerError(e, {}, request, msg)

			log_request(request, None, 'access')

			msg = log_detailed_exception(request, e)
			return HttpResponseRedirect('error?msg=%(errorMsg)s#error' % {'errorMsg': urlquote_plus(msg)})

		# Copy .wgt file into user temporal folder and extract file .wgt into 
		# gadgets folder
		
		try:
			try:
				file_wgt = request.FILES['file']
				file_wgt_path = path.join(info.TMPDIR.encode("utf8"), file_wgt.name.encode("utf8"))
				f = open(file_wgt_path, "wb")
				f.write(file_wgt.read())
				f.close()
				
				# Extract file .wgt into temporal folder
				pkg = WgtPackageUtils()
				extractiondir = mkdtemp(dir=info.TMPDIR)
				extractiondir = extractiondir.encode("utf8")
				pkg.extract(file_wgt_path, extractiondir)
				
				# Parser XML config file
				xmlDoc = parse(path.join(extractiondir, 'config.xml'))
				info.get_info_config(xmlDoc, request)
				
				# Extract .wgt file in user gadget folder
				final_gadget_dir = path.join(info.USERGADGETSDIR.encode("utf8"), info.VENDOR.encode("utf8"), info.NAME.encode("utf8"), info.VERSION.encode("utf8"))
				info.create_folder(final_gadget_dir)
				pkg.extract(file_wgt_path, final_gadget_dir)
				
				# Change links XHTML Tag and Image tag in template gadget
				final_dir = path.join(final_gadget_dir, info.ID.encode("utf8"))
				xmlDoc = parse(final_dir)
				xmlDoc = info.get_new_template(xmlDoc)
				f = codecs.open(final_dir, 'w', 'utf-8')
				f.write(xmlDoc.toxml())
				f.close()
				
				# Redirect to EzWeb to add_gadget_script function
				request.POST.appendlist('template_uri', info.URLTEMPLATE.encode("utf8"))
				response = add_gadget_script(request, fromWGT=True)
				
				if (response.status_code != 200):
					# Redirect if the param "add_to_ws" isn't in the request
					if (not request.POST.has_key('add_to_ws')):
						raise Exception('Gadget could not be added to the catalogue')
					
					# Redirect if the value of param "add_to_ws" isn't 'on'
					if (request.POST.has_key('add_to_ws') and request.POST['add_to_ws'] == 'on'):
						raise Exception('Gadget could not be added to the catalogue or to the workspace')
					
			except TracedServerError, e:
				raise e
			
			except Exception, e:
				msg = _("Error extracting gadget files: %(errorMsg)s")  % {'errorMsg': "[" + str(e.__class__) + "] " + e.message}
				e = TracedServerError(e, {}, request, msg)
				log_request(request, None, 'access')
				log_detailed_exception(request, e)
				return HttpResponseRedirect('error?msg=%(errorMsg)s#error' % {'errorMsg': urlquote_plus(msg)})

		finally:
			# Remove temporal files
			info.remove_folder(info.TMPDIR)

		return response

	def update(self, request):
		return self.create(request)

	def read(self, request, username, vendor, name, version):
		# Get info deployment
		info = InfoDeployment(request)

		try:
			user = user_authentication(request, request.user.username)
		except Http403, e:
			msg = _("This gadget could not be exported") + unicode(e)
			log (msg, request)
			return HttpResponseForbidden(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

		# Create temporal folder and user folder
		try:
			try:
				info.create_folders()
	
				# Parser XML config file
				gadget_path = path.join(settings.GADGETS_ROOT, username, vendor, name, version)
				xmlDoc = parse(path.join(gadget_path, 'config.xml'))
				info.get_info_config(xmlDoc, request)
	
				# Get template file
				xmlDoc = parse(path.join(gadget_path, info.ID))
	
				# Restore original template
				xmlDoc = info.return_original_template(xmlDoc, username, vendor, name, version)
	
				info.change_working_folder(gadget_path)
				pkg = WgtPackageUtils()
				pkg.create('.', path.join(info.TMPDIR, vendor+'_'+name+'_'+version), xmlDoc.toxml(), info.ID)
				file_wgt = open(path.join(info.TMPDIR, vendor+'_'+name+'_'+version+'.wgt'), 'rb')
				content_file = file_wgt.read()
				file_wgt.close()
				info.change_working_folder(BASEDIR_PLATFORM)
	
				# Return .wgt file
				response = HttpResponse(content_file, mimetype='application/zip')
				response['Content-Disposition'] = 'attachment; filename='+vendor+'_'+name+'_'+version+'.wgt'
	
			except Exception, e:
				msg = _("This gadget could not be exported: %(errorMsg)s") % {'errorMsg': e.message}
				raise TracedServerError(e, {}, request, msg)
		finally:
			# Remove temporal files
			info.remove_folder(info.TMPDIR)

		return response


class InfoDeployment:
	def __init__(self,request):
		# Info folders
		self.userName = request.user.username
		self.USERGADGETSDIR = path.join(settings.GADGETS_ROOT, self.userName)
		self._abs_re = re.compile('/*(.*)')

	def create_folders(self):
		self.create_folder(settings.GADGETS_DEPLOYMENT_TMPDIR)
		self.create_folder(settings.GADGETS_ROOT)

		self.TMPDIR = mkdtemp(prefix = self.userName, dir = settings.GADGETS_DEPLOYMENT_TMPDIR)

	# Create a new folder
	def create_folder(self, folder):
		if not path.isdir(folder):
			makedirs(folder)

	# Change working folder
	def change_working_folder(self, folder):
		chdir(folder)

	# Remove a directory
	def remove_folder(self, folder):
		if path.exists(folder):
			rmtree(folder, ignore_errors=True)

	# Parser info config.xml
	def get_info_config(self, xmldoc, request):
		widget = xmldoc.getElementsByTagName("widget")[0]
		
		# Info config
		self.ID = self._normalize(widget.getAttribute("id"))
		self.USERNAME = request.user.username.replace(" ", "_")
		self.NAME = widget.getAttribute("name").replace(" ", "_")
		self.VERSION = widget.getAttribute("version")
		self.VENDOR = widget.getAttribute("vendor").replace(" ", "_")
		self.HTTP_HOST = request.META['HTTP_HOST']
		self.PATH_INFO = request.META['PATH_INFO']

		if (request.META['SERVER_PROTOCOL'].lower().find('https') >= 0):
			self.URL = "https://%s" % self.HTTP_HOST
		else:
			self.URL = "http://%s" % self.HTTP_HOST

		# the new url of template
		if self.PATH_INFO[-1] == "/":
			self.PATH_INFO = self.PATH_INFO[:-1]
		self.BASEURL = "/".join(self.PATH_INFO.split("/")+[self.USERNAME, self.VENDOR, self.NAME, self.VERSION])
		#self.BASEURL = self.BASEURL.encode("utf8") TODO Encoding
		self.URLTEMPLATE = self.BASEURL + '/' + self.ID

	def _normalize(self, url):
		result = self._abs_re.search(url)
		return result.group(1)

	# Decides if the url is absolute
	def _is_absolute(self, url):
		return url.startswith("http")

	# Return a new gadget template with parsed links 
	def get_new_template(self, xmldoc):
		# Set href in XHML Tag
		xhtml = xmldoc.getElementsByTagName("XHTML")[0]
		href = xhtml.getAttribute("href")

		if not self._is_absolute(href):
			href = self.BASEURL + '/' + self._normalize(href)
			xhtml.setAttribute("href", href)

		# ImageURI
		if xmldoc.getElementsByTagName("ImageURI"):
			imageURI = xmldoc.getElementsByTagName("ImageURI")[0]
			imageURL = imageURI.firstChild.nodeValue
			if not self._is_absolute(imageURL):
				imageURL = self.BASEURL + '/' + self._normalize(imageURL)
				imageURI.firstChild.replaceWholeText(imageURL)

		# Wiki URI
		if xmldoc.getElementsByTagName("WikiURI"):
			wikiURI = xmldoc.getElementsByTagName("WikiURI")[0]
			wikiURL = wikiURI.firstChild.nodeValue
			if not self._is_absolute(wikiURL):
				wikiURL = self.BASEURL + '/' + self._normalize(wikiURL)
				wikiURI.firstChild.replaceWholeText(wikiURL)

		# iPhoneImageURI
		if xmldoc.getElementsByTagName("iPhoneImageURI"):
			iPhoneImageURI = xmldoc.getElementsByTagName("iPhoneImageURI")[0]
			iPhoneImageURL = iPhoneImageURI.firstChild.nodeValue
			if not self._is_absolute(iPhoneImageURL):
				iPhoneImageURL = self.BASEURL + '/' + self._normalize(iPhoneImageURL)
				iPhoneImageURI.firstChild.replaceWholeText(iPhoneImageURL)

		return xmldoc

	# Return a new gadget template with parsed links 
	def return_original_template(self, xmldoc, username, vendor, name, version):
		exp = re.compile('.*deployment/gadgets/'+username+'/'+vendor+'/'+name+'/'+version+'/(?P<element>.*)$')

		# Attribute href in XHTML Tag
		if xmldoc.getElementsByTagName("XHTML"):
			xhtml = xmldoc.getElementsByTagName("XHTML")[0]
			href=xhtml.getAttribute("href")

			if exp.search(href):
				v = exp.search(href)
				href = v.group("element")
				xhtml.setAttribute("href", href)

		# ImageURI
		if xmldoc.getElementsByTagName("ImageURI"):
			imageURI = xmldoc.getElementsByTagName("ImageURI")[0]
			imageURL = imageURI.firstChild.nodeValue
			if exp.search(imageURL):
				v = exp.search(imageURL)
				imageURL = v.group("element")
				imageURI.firstChild.replaceWholeText(imageURL)
		
		# Wiki URI
		if xmldoc.getElementsByTagName("WikiURI"):
			wikiURI = xmldoc.getElementsByTagName("WikiURI")[0]
			wikiURL = wikiURI.firstChild.nodeValue
			if exp.search(wikiURL):
				v = exp.search(wikiURL)
				wikiURL = v.group("element")
				wikiURI.firstChild.replaceWholeText(wikiURL)

		# iPhoneImageURI
		if xmldoc.getElementsByTagName("iPhoneImageURI"):
			iPhoneImageURI = xmldoc.getElementsByTagName("iPhoneImageURI")[0]
			iPhoneImageURL = iPhoneImageURI.firstChild.nodeValue
			if exp.search(iPhoneImageURL):
				v = exp.search(iPhoneImageURL)
				iPhoneImageURL = v.group("element")
				iPhoneImageURI.firstChild.replaceWholeText(iPhoneImageURL)
		return xmldoc

