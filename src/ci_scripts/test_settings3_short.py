
LANGUAGE_CODE = 'en'
DEFAULT_LANGUAGE = 'en'

INSTALLED_APPS += (
    'django_nose',
)

TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

# from selenium.webdriver.chrome.options import Options as ChromeOptions
# chromium_options = ChromeOptions()
# chromium_options.binary_location = "/usr/lib/chromium/chromium"

# WIRECLOUD_SELENIUM_TEST_BROWSERS = {
#     'Chromium': {
#         'CLASS': 'selenium.webdriver.Chrome',
#         'ARGS': {
#             'executable_path': '/usr/lib/chromium/chromedriver',
#             'chrome_options': chromium_options,
#         },
#     },
# }

from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
WIRECLOUD_SELENIUM_TEST_BROWSERS = {
   'Remote': {
       'CLASS': 'selenium.webdriver.Remote',
       'ARGS': {
           'command_executor': 'http://172.17.0.2:4444/wd/hub',
           'desired_capabilities': DesiredCapabilities.CHROME
       }
   },
}

import socket
socket.setdefaulttimeout(120)
