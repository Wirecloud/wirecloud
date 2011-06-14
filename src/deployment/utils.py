import re
import os
from shutil import rmtree
from urllib import url2pathname

from django.conf import settings


def undeploy_wgt_gadget(resource):

    # pattern /deployment/gadgets/(username)/(vendor)/(name)/(version)/...
    exp = re.compile('/deployment/gadgets/(?P<path>.+/.+/.+/.+/).*$')
    if exp.search(resource.template_uri):
        v = exp.search(resource.template_uri)
        path = url2pathname(v.group('path'))
        path = os.path.join(settings.GADGETS_DEPLOYMENT_DIR, path).encode("utf8")
        if os.path.isdir(path):
            rmtree(path)
