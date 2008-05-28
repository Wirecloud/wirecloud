#!/usr/bin/env python
from django.core.management import execute_manager
from django.utils.translation import gettext_lazy as _
from django.utils.translation import string_concat

try:
    import settings # Assumed to be in the same directory.
except ImportError:
    import sys
    message1 = _("Error: cannot find the file 'settings.py' in the directory containing %(file)r.\n") % {'file': __file__} 
    message1 = string_concat (message1, _("It seems you have customized things.\n"))
    message1 = string_concat (message1, _("You will have to run django-admin.py, passing it your settings module.\n"))
    message1 = string_concat (message1, _("(If the file settings.py does indeed exist, it is causing an ImportError somehow.)\n"))
    sys.stderr.write(message1) 
    sys.exit(1)

if __name__ == "__main__":
    execute_manager(settings)
