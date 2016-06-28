INSTALLED_APPS += (
    'django_nose',
)
TEST_RUNNER = 'django_nose.NoseTestSuiteRunner'

# By default, no selenium test is passed
WIRECLOUD_SELENIUM_TEST_BROWSERS = {}
