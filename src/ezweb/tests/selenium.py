from commons.test import WirecloudSeleniumTestCase

class BasicSeleniumTests(WirecloudSeleniumTestCase):

    def test_basic_workspace_operations(self):

        self.login()
        self.create_workspace('Test')
        self.rename_workspace('test2')

    def test_add_widget_from_catalogue(self):

        self.login()
        self.assertEqual(self.count_iwidgets(), 0)
        self.add_widget_to_mashup('Test')
        self.assertEqual(self.count_iwidgets(), 1)
