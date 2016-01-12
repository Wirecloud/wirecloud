from wirecloud.catalogue.tests.commands import AddToCatalogueCommandTestCase
from wirecloud.catalogue.tests.tests import CatalogueAPITestCase, WGTDeploymentTestCase, CatalogueSearchTestCase, CatalogueSuggestionTestCase, CatalogueMediaTestCase  # pyflakes:ignore
from wirecloud.catalogue.tests.utils import CatalogueUtilsTestCase
from wirecloud.catalogue.tests.selenium import *

import django
if django.VERSION[1] < 7:
    from wirecloud.catalogue.tests.south_migrations import CatalogueSouthMigrationsTestCase
