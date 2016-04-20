INSTALLED_APPS += (
    'django_nose',
)

TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

import os
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
WIRECLOUD_SELENIUM_TEST_BROWSERS = {
   'Remote': {
       'CLASS': 'selenium.webdriver.Remote',
       'ARGS': {
           'command_executor': 'http://' + os.environ['BROWSER_HOST'] + ':' + os.environ['BROWSER_PORT'] + '/wd/hub',
           'desired_capabilities': getattr(DesiredCapabilities, os.environ.get('BROWSER_TYPE', 'FIREFOX'))
       }
   },
}

import socket
socket.setdefaulttimeout(120)
