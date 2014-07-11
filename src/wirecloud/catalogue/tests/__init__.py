from wirecloud.catalogue.tests.tests import AddWidgetTestCase, CatalogueAPITestCase, PublishTestCase, WGTDeploymentTestCase, CatalogueSearchTestCase, CatalogueSuggestionTestCase  # pyflakes:ignore
from wirecloud.catalogue.tests.commands import ResetSearchIndexesCommandTestCase

from wirecloud.commons.utils.testcases import build_selenium_test_cases

build_selenium_test_cases(('wirecloud.catalogue.tests.selenium.CatalogueSeleniumTests',), locals())
