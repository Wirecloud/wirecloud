from wirecloud.catalogue.tests.commands import AddToCatalogueCommandTestCase
from wirecloud.catalogue.tests.tests import CatalogueAPITestCase, WGTDeploymentTestCase, CatalogueSearchTestCase, CatalogueSuggestionTestCase  # pyflakes:ignore
from wirecloud.catalogue.tests.south_migrations import CatalogueSouthMigrationsTestCase
from wirecloud.catalogue.tests.utils import CatalogueUtilsTestCase

from wirecloud.commons.utils.testcases import build_selenium_test_cases

build_selenium_test_cases(('wirecloud.catalogue.tests.selenium.CatalogueSeleniumTests',), locals())
