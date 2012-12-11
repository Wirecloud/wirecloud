from wirecloud.catalogue.tests.tests import AddWidgetTestCase, CatalogueAPITestCase, PublishTestCase, WGTDeploymentTestCase  # pyflakes:ignore

from wirecloud.commons.test import build_selenium_test_cases

build_selenium_test_cases(('wirecloud.catalogue.tests.selenium.CatalogueSeleniumTests',), locals())
