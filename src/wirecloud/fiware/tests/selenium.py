from wirecloud.commons.test import iwidget_context, WirecloudSeleniumTestCase


__test__ = False


class FiWareSeleniumTestCase(WirecloudSeleniumTestCase):

    def test_add_fiware_marketplace(self):

        self.login()

        self.add_marketplace('fiware', 'http://localhost:8080', 'fiware')
    test_add_fiware_marketplace.tags = ('fiware-ut-8',)

    def test_delete_fiware_marketplace(self):

        self.login()

        self.add_marketplace('fiware', 'http://localhost:8080', 'fiware')
        self.delete_marketplace('fiware')
    test_delete_fiware_marketplace.tags = ('fiware-ut-8',)

    def test_ngsi_available_to_widgets(self):

        self.login()

        resource = self.add_packaged_resource_to_catalogue('Wirecloud_ngsi-test-widget_1.0.wgt', 'Wirecloud NGSI API test widget')
        iwidget = self.instantiate(resource)

        with iwidget_context(self.driver, iwidget['id']):
            body = self.driver.find_element_by_tag_name('body')
            self.assertEqual(body.text, 'Success')
    test_ngsi_available_to_widgets.tags = ('fiware-ut-7',)
