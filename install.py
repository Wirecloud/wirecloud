#!/usr/bin/env python

from shutil import *

copy('modified_resource.py', 'django_restapi/resource.py')

print "Finished!!. Patch applied!"
