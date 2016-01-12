from wirecloud.fiware.tests.marketplace import MarketplaceTestCase
from wirecloud.fiware.tests.store import StoreTestCase
from wirecloud.fiware.tests.proxy import ProxyTestCase
from wirecloud.fiware.tests.views import FIWAREViewsTestCase
from wirecloud.fiware.tests.selenium import *
from wirecloud.fiware.tests.social_backend import *

import django
if django.VERSION[1] < 7:
    from wirecloud.fiware.tests.south_migrations import FIWARESouthMigrationsTestCase
