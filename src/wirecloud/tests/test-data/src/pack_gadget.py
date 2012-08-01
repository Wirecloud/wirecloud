#! /usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys

import tempfile
import shutil
import zipfile
import codecs

from xml.dom.minidom import parse

import re
import string

from urllib import pathname2url


#******************************************************************************
#******************************************************************************


class Error:

    def __init__(self, code):
        self.messages = {-1: "Error: It requires Python 2.6 version or higher", 
                         0: "Usage: pack_gadget [-nb] [-s pattern directory | directory1 ... directoryN]",
                         1: "Error: The gadget doesn't have template",
                         2: "Error: The gadget doesn't have html file",
                         3: "Error: The source code of the gadget could not be read",
                         4: "Error: Wgt package could not be copied to gadget directory",
                         5: "Error: The directory doesn't exist or isn't a directory",
                         6: "Error: The gadget has files with an invalid filename",
                         7: "Error: The gadget has an invalid name or an invalid vendor name",
                         8: "Error: Gadget template is not well-formed"}
        self.code = code

    def __str__(self):
        return self.messages[self.code]

#******************************************************************************
#******************************************************************************

class WgtPackageUtils:
    def __init__(self):
        self.extension = ".wgt"

    # create a new widget package
    def create(self, folder, filename):
        zip_file = zipfile.ZipFile(filename + self.extension, 'w')
        self.addFolder(zip_file, folder)
        zip_file.close()

    # Add a folder to wgt file
    def addFolder(self, zip_file, folder):
        # check if folder is empty
        if len(os.listdir(folder)) == 0:
            zip_file.write(folder + "/")
            return

        for file in os.listdir(folder):
            full_path = os.path.normpath(os.path.join(folder, file))

            if os.path.isfile(full_path):
                zip_file.write(full_path)
            elif os.path.isdir(full_path):
                self.addFolder(zip_file, full_path)

#******************************************************************************
#******************************************************************************

class ConfigFile:

    def __init__(self, parserTemplate):
        self.file_name = "config.xml"
        self.id = parserTemplate.id
        self.name = parserTemplate.name
        self.vendor = parserTemplate.vendor
        self.version = parserTemplate.version
        self.file_content = """<?xml version="1.0" encoding="UTF-8"?>
<widget xmlns=\"http://www.w3.org/ns/widgets/\"
                id=\"%(id)s\"
                name=\"%(name)s\"
                vendor=\"%(vendor)s\"
                version=\"%(version)s\"/>
                """ % {"id": self.id,
                       "name": self.name,
                       "vendor": self.vendor,
                       "version": self.version}
        self.path = None


    # Write config.xml file in path
    def write(self, path):
        path = os.path.abspath(path)
        self.path = os.path.join(path, self.file_name)
        f = codecs.open(self.path, "w", 'utf-8')
        f.write(self.file_content)
        f.close()


    def __str__(self):
        return self.file_content


#******************************************************************************
#******************************************************************************

class ParserTemplate:

    def __init__(self, config):
        self.name = None
        self.vendor = None
        self.version = None
        self.id = config.template
        self.config = config


    def __get_url_path_file__(self, path):
        for file in self.config.other_files:
            if (path.find(pathname2url(file)) >= 0):
                return pathname2url(file)


    def __check_name__(self, name):
        valid_name_re = re.compile(r'[^/\t\n\r\f\v]+', re.U)
        if not valid_name_re.match(name):
            raise Error(7)
        return


    # Parser template file
    def parse(self):
        if (self.config.template == None):
            raise Error(1)
        try:
            self.xmldoc = parse(os.path.join(self.config.path, self.config.template))
        except:
            raise Error(8)

        # Get Name tag
        if self.xmldoc.getElementsByTagName("Name"):
            name = self.xmldoc.getElementsByTagName("Name")[0].firstChild.nodeValue
            self.name = name.replace(" ", "_")
            self.__check_name__(name)

        # Get Vendor tag
        if self.xmldoc.getElementsByTagName("Vendor"):
            vendor = self.xmldoc.getElementsByTagName("Vendor")[0].firstChild.nodeValue
            self.vendor = vendor.replace(" ", "_")
            self.__check_name__(vendor)

        # Get Version tag
        if self.xmldoc.getElementsByTagName("Version"):
            version = self.xmldoc.getElementsByTagName("Version")[0].firstChild.nodeValue
            self.version = version

        if self.config.html == None:
            raise Error(2)



        # Set ImageURI tag
        if self.xmldoc.getElementsByTagName("ImageURI"):
            imageURI = self.xmldoc.getElementsByTagName("ImageURI")[0]
            imageURL = imageURI.firstChild.nodeValue
            imageURL = self.__get_url_path_file__(imageURL)
            imageURI.firstChild.replaceWholeText(imageURL)

        # Set iPhoneImageURI tag
        if self.xmldoc.getElementsByTagName("iPhoneImageURI"):
            iPhoneImageURI = self.xmldoc.getElementsByTagName("iPhoneImageURI")[0]
            iPhoneImageURL = iPhoneImageURI.firstChild.nodeValue
            iPhoneImageURL = self.__get_url_path_file__(iPhoneImageURL)
            iPhoneImageURI.firstChild.replaceWholeText(iPhoneImageURL)

        self.xhtml = self.xmldoc.getElementsByTagName("XHTML")[0].getAttribute('href')


    # Write template content into file
    def write(self, path=None):

        xhtml = self.xmldoc.getElementsByTagName("XHTML")[0]
        xhtml.setAttribute("href", pathname2url(self.config.html))


        self.template = self.xmldoc.toxml()

        if (path == None):
            path = os.path.join(self.config.path, self.config.template)


        f = codecs.open(path, 'w', 'utf-8')
        f.write(self.template)
        f.close()

#******************************************************************************
#******************************************************************************

class ParserHtml:

    def __init__(self, config):
        self.config = config


    def parse(self, replace_base=False):
        if (self.config.html == None):
            raise Error(2)
        path = os.path.join(self.config.path, self.config.html)

        # Read HTML File
        f = open(path, "r")
        content = f.read()
        f.close()

        if replace_base:
            # Replace Base Tag by ""
            base = re.compile(r'<base.*?/>', re.I | re.S)
            content = base.sub('', content)
            base = re.compile(r'<base.*</base>', re.I | re.S)
            content = base.sub('', content)

        self.xhtml = content


    def write(self, path=None):
        if (path == None):
            path = os.path.join(self.config.path, self.config.html)

        f = open(path, "w")
        f.write(self.xhtml)
        f.close()

#******************************************************************************
#******************************************************************************

def search_ezweb_template(path):
    xml = re.compile(r'\.xml$', re.I)
    for entry in os.listdir(path):
        if xml.search(entry):
            dom = parse(os.path.join(path, entry))
            if dom.documentElement and dom.documentElement.tagName == 'Template':
                return entry


class ConfigInfo:

    def __init__(self, path, template, pattern):
        # Path Gadget Folder
        self.html = None
        self.path = os.path.abspath(path)
        self.xml = []
        self.text_files = []
        self.other_files = []
        self.exp = re.compile(r'%s' % pattern, re.S)

        # Order files by extension
        self.__order_files__()

        if template == None:
            # Get template path
            self.__get_template__()
        else:
            self.template = template


    def _normalize_path(self, path):
        if path.startswith('/'):
            return path[1:]
        return path


    def __check_filename__(self, filename):
        valid_chars = "-_.() %s%s" % (string.ascii_letters, string.digits)
        for char in filename:
            if not(char in valid_chars):
                raise Error(6)
        return


    # Order files by extension
    def __order_files__(self):
        html = re.compile(r'\.x?html?$', re.I)
        xml = re.compile(r'\.xml$', re.I)
        text_file = re.compile(r'\.css$|\.js$')
        for (dirpath, dirname, filenames) in os.walk(self.path):
            for filename in filenames:
                # Check if filename is a valid filename
                self.__check_filename__(filename)
                # Get relative path
                path = os.path.join(dirpath, filename)
                path = path.split(self.path)[1]
                path = self._normalize_path(path)
                if html.search(filename):
                    self.html = path
                elif xml.search(filename):
                    self.xml.append(path)
                elif text_file.search(filename):
                    self.text_files.append(path)
                else:
                    self.other_files.append(path)


    # Search template file
    def __get_template__(self):
        # Check if file has template tag
        exp = re.compile(r'<template.*</template>', re.I | re.S)
        for path in self.xml:
            f = open(os.path.join(self.path, path), "r")
            content = f.read()
            f.close()
            if exp.search(content):
                # Relative path
                self.template = path
                return


    def _replace(self, path):
        # Read file
        f = open(path, "rb")
        content = f.read()
        f.close()

        # Remove pattern from content
        content = self.exp.sub("", content)

        # Write File
        f = open(path, "wb")
        f.write(content)
        f.close()


    def replace(self):
        for filename in (self.xml + self.text_files):
            path = os.path.join(self.path, filename)
            self._replace(path)


    def set_and_replace_html(self, html):
        self.html = self._normalize_path(html)
        self._replace(os.path.join(self.path, self.html))

#******************************************************************************
#******************************************************************************

class PackGadget:

    def __init__(self, path, dst_dir = None):
        # Check if the path is a directory
        self.workpath = os.path.abspath('.')
        self.path = os.path.abspath(self._normalize_path(path))
        self.tmp = None
        self.tmpgadget = None
        self.pack = None
        if dst_dir != None:
            self.dst_dir = os.path.abspath(dst_dir)
        else:
            self.dst_dir = self.path

        if not os.path.isdir(path):
            raise Error(5)


    def _normalize_path(self, path):
        path = os.path.normpath(path)
        if (path[-1] == '/'):
            return path[:-1]
        return path


    # Create tmp folder
    def tmp_dir(self):
        self.tmp = tempfile.mkdtemp()
        # Path to folder gadget in temporal folder
        self.tmpgadget = os.path.join(self.tmp, "src")


    # Move folder
    def move(self):
        # Check if src folder has read permissions
        if not os.access(self.path, os.R_OK):
            raise Error(3)

        shutil.copytree(self.path, self.tmpgadget, ignore=shutil.ignore_patterns('*~', '.*', "*.wgt"))


    # Remove temporal folder
    def rm_tmp_dir(self):
        shutil.rmtree(self.tmp)


    # Change work folder
    def change_working_folder(self, dir):
        os.chdir(dir)


    # Move wgt file into gadget folder
    def move_wgt(self):
        if ((self.pack == None) or (not os.access(self.dst_dir, os.W_OK))):
            raise Error(4)
        shutil.copy(self.pack+".wgt", self.dst_dir)


    # Pack gadget into zip file
    def pack_gadget(self, pattern=None, replace_base=False, template= None):
        # Create temporal folder
        self.tmp_dir()
        # Move gadget folder to temporal folder
        self.move()
        # Get Config Info
        config = ConfigInfo(self.tmpgadget, template, pattern)
        if pattern:
            config.replace()

        # Parser gadget's template
        parserTemplate = ParserTemplate(config)
        parserTemplate.parse()

        config.set_and_replace_html(parserTemplate.xhtml)

        parserTemplate.write()


        # Parser Html gadget and overwrite html file
        parserHtml = ParserHtml(config)
        parserHtml.parse(replace_base)
        parserHtml.write()

        # Write Config File
        configFile = ConfigFile(parserTemplate)
        configFile.write(self.tmpgadget)

        self.filename = "%s_%s_%s" % (configFile.vendor,
                                 configFile.name,
                                 configFile.version)
        self.pack = os.path.join(self.tmp, self.filename)
        # Change directory
        self.change_working_folder(self.tmpgadget)
        # Pack gadget into zip file
        wgtHandler = WgtPackageUtils()
        wgtHandler.create("./", self.pack)
        # Copy pack into gadget folder
        self.move_wgt()
        # Remove temporal dir
        self.rm_tmp_dir()
        self.change_working_folder(self.workpath)


#******************************************************************************
#******************************************************************************
if __name__ == '__main__':
    try:
        newP = None
        replace_base = True 
        pattern = None
        parameters = sys.argv
        version = sys.version_info

        # Check interpreter version
        if not (((version[0] == 2) and (version[1] >= 6)) or (version[0] > 2)):
            raise Error(-1)

        # Check arguments
        if (len(parameters) <= 1):
            raise Error(0)

        # Check if the user need help
        if parameters.count("--help") or parameters.count("-h"):
            raise Error(0)

        # Check if base tag should be replaced by ""
        if parameters.count("-nb") > 0:
            replace_base = False
            parameters.remove("-nb")

        # Check if pattern should be replaced by ""
        if parameters.count("-s") > 0:
            index = parameters.index("-s")
            pattern = parameters[index+1]
            # Remove flag -s and pattern
            parameters.remove("-s")
            parameters.remove(pattern)
            # Check parameters
            if (len(parameters) != 2):
                raise Error(0)

        # Pack elements
        for path in parameters[1:]:
            print "--------------------------------------------------------------------------------"
            print "Packing gadget ........ %s" % path
            newP = PackGadget(path)
            newP.pack_gadget(pattern, replace_base)
            print "New packed     ........ %s.wgt" % newP.filename
        print "--------------------------------------------------------------------------------"

    except Error, e:
        print e
        if (e.code > 0):
            print "--------------------------------------------------------------------------------"
    finally:
        if ((newP!=None) and (newP.tmp != None) and os.path.isdir(newP.tmp)):
            newP.rm_tmp_dir()
