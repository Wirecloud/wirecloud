from catalogue.tests.tests import AddWidgetTestCase, CatalogueAPITestCase, PublishTestCase, WGTDeploymentTestCase  # pyflakes:ignore

from commons.test import build_selenium_test_cases

build_selenium_test_cases(('catalogue.tests.selenium.CatalogueSeleniumTests',), locals())
