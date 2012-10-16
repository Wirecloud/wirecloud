from wirecloudcommons.test import WirecloudSeleniumTestCase


__test__ = False


class MarketManagementTestCase(WirecloudSeleniumTestCase):

    def test_add_marketplace(self):

        self.login()

        self.add_marketplace('remote', 'http://localhost:8080', 'wirecloud')

    def test_delete_marketplace(self):

        self.login('user_with_markets', 'admin')

        self.delete_marketplace('deleteme')
