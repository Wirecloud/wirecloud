# See license file (LICENSE.txt) for info about license terms.

DEFAULT_LAYOUT = 29
#EZWEB_URL = 'http://demo.ezweb.morfeo-project.org/lite' 
EZWEB_URL = 'http://localhost:8000/' 

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'ezweb',
    'gadget',
    'workspace',
    'igadget',
    'connectable',
    'catalogue',
    'context',
    'clms',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    'django.core.context_processors.auth',
    'django.core.context_processors.debug',
    'django.core.context_processors.i18n',
    'django.core.context_processors.media',
    'django.core.context_processors.request',
    'clms.context_processors.server_url',
    'clms.context_processors.is_anonymous',
    )

NUMBER_CONTENTS = 5

