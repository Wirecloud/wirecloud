from catalogue.tests.tests import AddGadgetTestCase, CatalogueAPITestCase, WGTDeploymentTestCase  # pyflakes:ignore

from commons.test import build_selenium_test_cases

build_selenium_test_cases(('catalogue.tests.selenium.CatalogueSeleniumTests',), locals())
