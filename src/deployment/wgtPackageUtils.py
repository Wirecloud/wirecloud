import os
import re
import urllib
import zipfile

from django.conf import settings
from django.utils.translation import ugettext as _


WGT_URI_PATTERN_RE = re.compile(r'^[/]?deployment/gadgets/')

def get_wgt_local_path(uri):

    path = re.sub(WGT_URI_PATTERN_RE, '', uri)
    if path == uri:
        # uri does not starts with r"[/]?deployment/gadgets/"
        raise Exception(_('Invalid path'))

    path = urllib.url2pathname(path.encode("utf8"))

    return os.path.join(settings.GADGETS_DEPLOYMENT_DIR, path)


class WgtPackageUtils:

    def __init__(self):
        self.extension = ".wgt"

    def create(self, folder, filename, templateFileContents, templateFileName):
        """create a new widget package"""
        templateFileName = os.path.normpath(templateFileName)

        zip_file = zipfile.ZipFile(filename + self.extension, 'w')

        self.addFolder(zip_file, folder, templateFileName)

        # Template file
        zip_file.writestr(str(templateFileName.encode("utf-8").replace(os.sep, '/')), templateFileContents.encode("utf-8"))

        zip_file.close()

    def addFolder(self, zip_file, folder, templateFileName):
        """Add a folder to wgt file"""
        # check if folder is empty
        if len(os.listdir(folder)) == 0:
            zip_file.write(folder + os.sep)
            return

        for file in os.listdir(folder):
            full_path = os.path.normpath(os.path.join(folder, file))

            if full_path == templateFileName:
                continue

            if os.path.isfile(full_path):
                zip_file.write(full_path)
            elif os.path.isdir(full_path):
                self.addFolder(zip_file, full_path, templateFileName)

    # Extract a wgt file
    def extract(self, file, path):
        zip_file = zipfile.ZipFile(file)

        if not os.path.exists(path) or not os.path.isdir(path):
            os.mkdir(path, 0777)

        for name in zip_file.namelist():
            listnames = name.split("/")[:-1]
            folder = path
            if name.endswith("/"):
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if (not os.path.exists(folder)
                        or (os.path.exists(folder) and not os.path.isdir(folder))):
                        os.mkdir(folder)
            else:
                for namedir in listnames:
                    folder += os.sep + namedir.replace("/", os.sep)
                    if (not os.path.exists(folder)
                        or (os.path.exists(folder) and not os.path.isdir(folder))):
                        os.mkdir(folder)
                outfile = open(os.path.join(path, name.replace("/", os.sep)), 'wb')
                outfile.write(zip_file.read(name))
                outfile.close()
