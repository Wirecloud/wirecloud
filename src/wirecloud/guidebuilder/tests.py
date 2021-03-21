# -*- coding: utf-8 -*-

# Copyright (c) 2015-2017 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import os
import time

from django.conf import settings
from django.contrib.auth.models import User
from django.urls import reverse
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.commons.utils.remote import ButtonTester, FormModalTester, MACFieldTester
from wirecloud.commons.utils.testcases import uses_extra_resources, WirecloudSeleniumTestCase, wirecloud_selenium_test_case, DynamicWebServer, LocalFileSystemServer, RealWebServer, uses_extra_workspace
from wirecloud.catalogue.models import CatalogueResource

__test__ = 'wirecloud.guidebuilder' in settings.INSTALLED_APPS

if __test__ is True:
    from PIL import Image

USER_GUIDE_IMAGES_PATH = '../docs/images/user_guide'
list_resources = ['CoNWeT_simple-history-module2linear-graph_2.3.2.wgt',
                  'CoNWeT_ngsi-source_3.0.7.wgt',
                  'CoNWeT_ngsientity2poi_3.0.3.wgt',
                  'CoNWeT_linear-graph_3.0.0b3.wgt',
                  '../../../../docs/attachments/CoNWeT_map-viewer_2.6.2.wgt']

RETINA_IMAGES = getattr(settings, "GUIDEBUILDER_RETINA", False)
DENSITY_FACTOR = 2 if RETINA_IMAGES else 1

# Common functions


def image_path(name, resource=False, prepath=None):
    name = name if name.endswith('.png') else "{}.png".format(name)
    if not resource:
        basepath = os.path.join(settings.BASEDIR, USER_GUIDE_IMAGES_PATH)
    else:
        basepath = os.path.join(os.path.dirname(__file__), 'resources')
    if prepath is not None:
        basepath = os.path.join(basepath, prepath)
        if not os.path.exists(basepath):
            os.mkdir(basepath)
    return os.path.join(basepath, name)


def take_capture(driver, name, prepath=None):
    path = image_path(name, prepath=prepath)
    driver.save_screenshot(path)
    return path


def midd_take_capture(*args, **kargs):
    name = kargs.get("name") or ""
    if kargs.get("name"):
        kargs.pop("name")
    prepath = kargs.get("prepath")
    if kargs.get("prepath"):
        kargs.pop("prepath")
    if len(args) > 1:  # args have name
        name = args[1]
        args = (args[0],) + args[2:]
    return globals()["take_capture"](*args, name=name, prepath=prepath, **kargs)


def merge_images(img1, img2, position):
    img1.paste(img2, position, img2)


def add_image(imgp, position, imagename):
    lp = image_path(imagename, resource=True)
    base = Image.open(imgp)
    image = Image.open(lp)
    merge_images(base, image, position)
    base.save(imgp)


def add_pointer(imgp, position, pointer=True):
    mousefn = 'select_{}.png' if pointer else 'arrow_{}.png'
    mousefn = mousefn.format('r' if RETINA_IMAGES else 'l')
    mousefn = os.path.join('mouse', mousefn)
    mousep = image_path(mousefn, resource=True)
    base = Image.open(imgp)
    mouse = Image.open(mousep)
    base.paste(mouse, position, mouse)
    base.save(imgp)


def crop_image(imgp, left=0, upper=0, right=None, lower=None):
    image = Image.open(imgp)
    w, h = image.size
    right = right if right is not None else w
    lower = lower if lower is not None else h
    image.crop((left, upper, right, lower)).save(imgp)


def crop_down(imgp, widg, offs=10):
    offs = offs * DENSITY_FACTOR
    lower_cut = get_position(widg, 1.0, 1.0)[1] + offs
    crop_image(imgp, lower=lower_cut)


def get_position(widg, xoff=0.75, yoff=0.75):
    widg = getattr(widg, 'element', widg)
    return (int(widg.location['x'] + xoff * widg.size['width']) * DENSITY_FACTOR,
            int(widg.location['y'] + yoff * widg.size['height']) * DENSITY_FACTOR)


def create_box(widg, offs=3):
    widg = getattr(widg, 'element', widg)
    return (int(widg.location['x'] - offs) * DENSITY_FACTOR,
            int(widg.location['y'] - offs) * DENSITY_FACTOR,
            int(widg.location['x'] + widg.size['width'] + offs) * DENSITY_FACTOR,
            int(widg.location['y'] + widg.size['height'] + offs) * DENSITY_FACTOR)


def get_by_condition(driver, css, f):
    for d in driver.find_elements_by_css_selector(css):
        if f(d):
            return d
    return None


def get_by_text(driver, css, text):
    return get_by_condition(driver, css, lambda x: x.text == text)


def get_by_contains(driver, css, text):
    return get_by_condition(driver, css, lambda x: text in x.text)


def get_first_displayed(driver, css):
    return get_by_condition(driver, css, lambda x: x.is_displayed())


def move_elem(driver, elem, x, y):
    ActionChains(driver).click_and_hold(
        elem).move_by_offset(x, y).release().perform()


def resize_widget(driver, widget, width, height):

    driver.execute_script('''
        var widget = Wirecloud.UserInterfaceManager.views.workspace.findWidget(arguments[0]);
        widget.setShape({width: arguments[1], height: arguments[2]}, false, true);
    ''', widget.id, width, height)


def read_response_file(*response):
    f = open(market_path_base(*response))
    contents = f.read()
    f.close()
    return contents


def market_path_base(*args):
    return os.path.join(os.path.dirname(__file__), 'test-data', *args)


@wirecloud_selenium_test_case
class BasicSeleniumGuideTests(WirecloudSeleniumTestCase):
    fixtures = ('selenium_test_data', 'guide_test_data')
    servers = {
        'http': {
            'marketplace.example.com': DynamicWebServer(),
            'repository.example.com': LocalFileSystemServer(market_path_base('responses', 'repository')),
            'static.example.com': LocalFileSystemServer(market_path_base('responses', 'static')),
            'store.example.com': DynamicWebServer(fallback=LocalFileSystemServer(market_path_base('responses', 'store'))),
            'store2.example.com': DynamicWebServer(fallback=LocalFileSystemServer(market_path_base('responses', 'store2'))),
            'orion.lab.fiware.org:1026': RealWebServer(),
            'api.wunderground.com': RealWebServer(),
        },
        'https': {
            'store.lab.fiware.org': RealWebServer(),
            'ngsiproxy.lab.fiware.org': RealWebServer(),
        }
    }

    tags = ('wirecloud-guide',)

    @classmethod
    def setUpClass(cls):

        if not os.path.exists(os.path.join(settings.BASEDIR, USER_GUIDE_IMAGES_PATH)):
            os.makedirs(os.path.join(settings.BASEDIR, USER_GUIDE_IMAGES_PATH))

        WirecloudSeleniumTestCase.setUpClass.__func__(cls)

    def setUp(self):
        access_token = settings.GUIDEBUILDER_AUTH_ACCESS_TOKEN
        User.objects.get(username='admin').social_auth.create(provider='fiware', uid='admin', extra_data={"access_token": access_token, "expires_on": time.time() + 30000})
        components = ['TestOperator', 'test-mashup', 'Test', 'test-mashup-dependencies']
        for c in components:
            CatalogueResource.objects.get(short_name=c).delete()

        self.store_list_response = read_response_file(
            'responses', 'marketplace', 'store_list.xml')
        self.store1_offerings = read_response_file(
            'responses', 'marketplace', 'store1_offerings.xml')
        self.store2_offerings = read_response_file(
            'responses', 'marketplace', 'store2_offerings.xml')
        super(BasicSeleniumGuideTests, self).setUp()

        self.network._servers['http']['marketplace.example.com'].clear()
        self.network._servers['http']['marketplace.example.com'].add_response(
            'GET', '/registration/stores/', {'content': self.store_list_response})
        self.network._servers['http']['marketplace.example.com'].add_response(
            'GET', '/offering/store/WStore%20FIWARE%20Lab/offerings', {'content': self.store1_offerings})
        self.network._servers['http']['marketplace.example.com'].add_response(
            'GET', '/offering/store/CoNWeT/offerings', {'content': self.store2_offerings})
        self.network._servers['http']['marketplace.example.com'].add_response(
            'GET', '/offering/store/Another%20Store/offerings', {'content': self.store2_offerings})

    def configure_ngsi_source(self, source):
        popup = source.show_preferences()
        setts_btn = popup.get_entry("Settings")
        ActionChains(self.driver).move_to_element(setts_btn).perform()
        time.sleep(0.3)  # wait entry to be highlighted
        imgp = take_capture(self.driver, prepath="wiring", name='ngsisource_settings')
        box = create_box(popup.element, 40)
        box = (box[0] - 120 * DENSITY_FACTOR, box[1], box[2], box[3])
        add_pointer(imgp, get_position(setts_btn, 0.8, 0.5), True)
        crop_image(imgp, *box)
        setts_btn.click()

        dialog = FormModalTester(self, self.wait_element_visible(".wc-component-preferences-modal"))
        dialog.get_field("ngsi_server").set_value('http://orion.lab.fiware.org:1026/')
        dialog.get_field("ngsi_proxy").set_value('https://ngsiproxy.lab.fiware.org')
        dialog.get_field("ngsi_entities").set_value('Node, AMMS, Regulator')
        dialog.get_field("ngsi_update_attributes").set_value('Latitud, Longitud, presence, batteryCharge, illuminance, ActivePower, ReactivePower, electricPotential, electricalCurrent')
        dialog.accept()

    def configure_ngsi_entity(self, source):
        dialog = source.show_settings()
        dialog.get_field("coordinates_attr").set_value('Latitud, Longitud')
        dialog.accept()

    @uses_extra_resources(list_resources)
    def test_creating_new_workspace(self):
        def take_capture(*args, **kargs):
            return midd_take_capture(*args, prepath="create_workspace", **kargs)

        # Intitialization
        self.driver.set_window_size(1024, 768)
        self.login()
        self.create_workspace('My Multimedia Workspace')
        self.create_workspace('Issue Trouble')
        self.open_menu().click_entry('Workspace')
        self.wait_wirecloud_ready()

        menu_widg = self.driver.find_element_by_css_selector(
            '.wirecloud_header_nav .fa-bars')

        # Empty workspace screenshot
        imgp = take_capture(self.driver, 'empty_workspace')

        # Workspace list screenshot
        menu = self.open_menu()
        imgp = take_capture(self.driver, 'workspace_menu')
        box = create_box(menu.element, 10)
        box = (box[0], box[1] - 40 * DENSITY_FACTOR, box[2], box[3])
        add_pointer(imgp, get_position(menu_widg))  # Add the mouse
        crop_image(imgp, *box)

        # Capture new workspace
        newworkspace_menu = menu.get_entry('New workspace')
        ActionChains(self.driver).move_to_element(newworkspace_menu).perform()
        time.sleep(0.2)  # Wait hover effect
        imgp = take_capture(self.driver, 'new_workspace_entry')
        add_pointer(imgp, get_position(newworkspace_menu, 0.8, 0.5))
        crop_down(imgp, menu.element)  # Crop down the image

        # Capture writing new workspace name
        newworkspace_menu.click()
        dialog = FormModalTester(self, self.wait_element_visible(".wc-new-workspace-modal"))
        dialog.get_field("name").set_value('History Info')
        time.sleep(0.2)
        imgp = take_capture(self.driver, 'new_workspace_dialog')
        crop_image(imgp, *create_box(dialog))

        # Wait complete and capture state
        dialog.accept()
        self.wait_wirecloud_ready()
        imgp = take_capture(self.driver, 'new_workspace')
        crop_down(
            imgp, self.driver.find_element_by_css_selector('.wc-initial-message'))

        # Workspace Settings
        self.open_menu().click_entry('Settings')
        dialog = FormModalTester(self, self.wait_element_visible(".wc-workspace-preferences-modal"))
        time.sleep(0.2)  # Wait hover effect
        imgp = take_capture(self.driver, 'workspace_settings')
        crop_image(imgp, *create_box(dialog))

    test_creating_new_workspace.tags = tags + ('wirecloud-guide-creating-new-workspace',)

    @uses_extra_resources(list_resources)
    def test_browsing_bae(self):
        def take_capture(*args, **kargs):
            return midd_take_capture(*args, prepath="bae", **kargs)

        self.driver.set_window_size(1024, 768)
        self.login()

        with self.marketplace_view as marketplace:
            marketplace.switch_to('origin')
            marketplace.delete()
            marketplace.switch_to('FIWARE Lab')
            marketplace.delete()

            # Create a real FIWARE Lab marketplace
            marketplace.open_menu().get_entry('Add new marketplace').click()
            dialog = FormModalTester(self, self.wait_element_visible(".wc-add-external-catalogue-modal"))
            dialog.get_field("title").set_value('FIWARE Lab')
            dialog.get_field("url").set_value('https://store.lab.fiware.org')
            dialog.get_field("type").set_value('fiware-bae')
            dialog.accept()

            # Summary
            time.sleep(7)  # wait marketplace loaded
            imgp = take_capture(self.driver, "summary")

            # Add marketplace
            # Menu entry
            popup_menu = marketplace.open_menu()
            m_menu = popup_menu.get_entry('Add new marketplace')
            ActionChains(self.driver).move_to_element(m_menu).perform()
            time.sleep(0.3)  # wait entry to be highlighted
            imgp = take_capture(self.driver, 'add_new_marketplace_entry')
            add_pointer(imgp, get_position(m_menu, 0.8, 0.5))
            crop_down(imgp, popup_menu.element, 80)

            # Adding marketplace
            # Modal
            m_menu.click()
            dialog = FormModalTester(self, self.wait_element_visible(".wc-add-external-catalogue-modal"))
            dialog.get_field("title").set_value('FIWARE Lab')
            dialog.get_field("url").set_value('https://store.lab.fiware.org')
            dialog.get_field("type").set_value('fiware-bae')
            imgp = take_capture(self.driver, 'add_new_marketplace_dialog')
            crop_image(imgp, *create_box(dialog.element))
            dialog.cancel()

            # Marketplace dropdown screenshot
            popup_menu = marketplace.open_menu()
            m_menu = popup_menu.get_entry('FIWARE Lab')
            ActionChains(self.driver).move_to_element(m_menu).perform()
            time.sleep(0.3)  # wait entry to be highlighted
            imgp = take_capture(self.driver, "marketplace_dropdown")
            add_pointer(imgp, get_position(m_menu, 0.8, 0.5))
            crop_down(imgp, popup_menu.element, 80)

    test_browsing_bae.tags = tags + ('wirecloud-guide-browsing-bae',)

    @uses_extra_resources(list_resources)
    def test_browsing_marketplace(self):
        def take_capture(*args, **kargs):
            return midd_take_capture(*args, prepath="browsing_marketplace", **kargs)

        self.driver.set_window_size(1024, 768)
        self.login()

        with self.marketplace_view as marketplace:
            marketplace.switch_to('origin')
            marketplace.delete()
            marketplace.switch_to('FIWARE Lab')
            select = self.driver.find_element_by_css_selector(
                '.se-select select')

            # Where are my resources
            btn = self.find_navbar_button('wc-show-myresources-button')
            ActionChains(self.driver).move_to_element(btn.element).perform()
            time.sleep(0.3)  # wait tooltip animation
            imgp = take_capture(self.driver, "my_resources_button")
            add_pointer(imgp, get_position(btn, 0.8, 0.5))
            crop_down(imgp, select, 80)

        with self.myresources_view as myresources:
            # Resources
            imgp = take_capture(self.driver, "my_resources")

            btn = self.find_navbar_button('wc-upload-mac-button')
            # Where are upload button
            ActionChains(self.driver).move_to_element(btn.element).perform()
            time.sleep(0.3)  # wait tooltip animation
            imgp = take_capture(self.driver, "upload_button")
            add_pointer(imgp, get_position(btn, 0.5, 0.5))
            crop_down(imgp, myresources.search_in_results('Map Viewer'), 80)

            # Upload dialog
            btn.click()
            dialog = FormModalTester(self, self.wait_element_visible(".wc-upload-mac-modal"))
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'upload_dialog')
            crop_image(imgp, *create_box(dialog))
            dialog.cancel()

            # Click in a widget for details
            container = get_first_displayed(
                # self.driver, '.se-bl-center-container .resource_list')
                self.driver, '.resource_list')
            widg = get_by_contains(
                container, '.resource.click_for_details', 'widget')
            ActionChains(self.driver).move_to_element(widg).perform()
            time.sleep(0.4)  # Wait hover effect
            imgp = take_capture(self.driver, 'component_details')
            add_pointer(imgp, get_position(widg, 0.5, 0.5))
            crop_down(imgp, widg, 50)

            # Publish button
            widg.click()
            time.sleep(0.2)
            container = get_first_displayed(
                self.driver, '.advanced_operations')
            btn = ButtonTester(self, get_by_text(container, '.se-btn', 'Publish'))
            self.driver.execute_script("return arguments[0].scrollIntoView();", btn.element)
            ActionChains(self.driver).move_to_element(btn.element).perform()  # wait?
            imgp = take_capture(self.driver, "publish_button")
            add_pointer(imgp, get_position(btn, 0.8, 0.8))

            # Publish dialog
            btn.click()
            dialog = self.driver.find_element_by_css_selector(
                '.window_menu.publish_resource')
            dialog.find_element_by_css_selector(
                'input[value="admin/FIWARE Lab"]').click()
            select = dialog.find_element_by_css_selector('.se-select select')
            imgp = take_capture(
                self.driver, 'publish_resource_store_select')
            add_image(imgp, get_position(select, 0.0, 1.0), 'store_list.png')
            add_pointer(imgp, get_position(select, 0.7, 1.8), False)
            crop_image(imgp, *create_box(dialog))

            get_by_text(dialog, 'button', 'Cancel').click()
            self.driver.find_element_by_css_selector(
                '.wirecloud_header_nav .wc-back-button').click()
    test_browsing_marketplace.tags = tags + ('wirecloud-guide-browsing-marketplace',)

    @uses_extra_resources(list_resources)
    def test_building_mashup(self):
        def take_capture(*args, **kargs):
            return midd_take_capture(*args, prepath="building_mashup", **kargs)

        self.driver.set_window_size(1024, 768)
        self.login()

        self.create_workspace('History Info')

        # Get more components
        btn = self.find_navbar_button('wc-show-marketplace-button')
        ActionChains(self.driver).move_to_element(btn.element).perform()
        time.sleep(0.2)
        imgp = take_capture(self.driver, "get_more_components")
        add_pointer(imgp, get_position(btn, 0.8, 0.5))
        crop_down(
            imgp, self.driver.find_element_by_css_selector('.wc-initial-message'))

        # Open widget wallet
        add_widget_button = self.find_navbar_button('wc-show-component-sidebar-button')
        ActionChains(self.driver).move_to_element(add_widget_button.element).perform()
        time.sleep(0.3)  # wait tooltip animation
        imgp = take_capture(self.driver, "add_widget_button")
        add_pointer(imgp, get_position(add_widget_button, 0.8, 0.5))
        crop_down(imgp, self.driver.find_element_by_css_selector('.wc-initial-message'))

        # Add to workspace
        with self.resource_sidebar as sidebar:
            resource = sidebar.search_in_results(title='Linear Graph')
            self.driver.execute_script("return arguments[0].scrollIntoView();", resource.element)

            btn = resource.find_element(".wc-create-resource-component")
            ActionChains(self.driver).move_to_element(btn).perform()
            time.sleep(0.3)  # wait tooltip animation
            imgp = take_capture(self.driver, "add_linear_graph")
            add_pointer(imgp, get_position(btn, 0.8, 0.8))
            crop_down(imgp, resource.element)

            linear_graph_widget = resource.create_component()

        # Initial layout
        resize_widget(self.driver, linear_graph_widget, 12, 41)
        ActionChains(self.driver).move_to_element(linear_graph_widget.element).perform()
        time.sleep(0.6)  # Wait until all the effects are applied
        imgp = take_capture(self.driver, "initial_linear_graph_layout")
        crop_down(imgp, linear_graph_widget)

        # Add a Map Viewer Widget
        map_viewer_widget = self.create_widget('Map Viewer')
        map_viewer_widget.open_menu().get_entry('Settings').click()
        dialog = FormModalTester(self, self.wait_element_visible('.wc-component-preferences-modal'))
        dialog.get_field('apiKey').set_value(settings.GMAPS_KEY)
        dialog.accept()
        map_viewer_widget.open_menu().get_entry("Reload").click()

        resize_widget(self.driver, map_viewer_widget, 8, 41)
        ActionChains(self.driver).move_to_element(linear_graph_widget.element).perform()
        # Wait until map viewer is loaded
        with map_viewer_widget:
            WebDriverWait(self.driver, timeout=60).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, ".gm-err-container")))
        imgp = take_capture(self.driver, "final_layout")

        # Widget menu button
        widg_menu = map_viewer_widget.element.find_element_by_css_selector('.wc-widget-heading')
        setts_btn = widg_menu.find_element_by_css_selector('.wc-menu-button')
        ActionChains(self.driver).move_to_element(setts_btn).perform()
        time.sleep(0.3)  # Wait menu button hover effect
        imgp = take_capture(self.driver, "widget_menu_button")
        box = create_box(widg_menu, 40)
        box = (box[0] + 37 * DENSITY_FACTOR, box[1] + 37 * DENSITY_FACTOR, box[2] - 37 * DENSITY_FACTOR, box[3])
        add_pointer(imgp, get_position(setts_btn, 0.5, 0.5))
        crop_image(imgp, *box)

        # Settings option
        popup_menu = map_viewer_widget.open_menu()
        btn = popup_menu.get_entry('Settings')
        ActionChains(self.driver).move_to_element(btn).perform()
        time.sleep(0.3)  # Wait hover effect
        imgp = take_capture(self.driver, "widget_menu_dropdown")
        add_pointer(imgp, get_position(btn))
        crop_image(imgp, *create_box(map_viewer_widget.element))

        # Map Viewer settings
        btn.click()
        dialog = FormModalTester(self, self.wait_element_visible('.wc-component-preferences-modal'))
        dialog.get_field('centerPreference').set_value('Santander, Spain')
        dialog.get_field('initialZoom').set_value('14')
        dialog.get_field('zoomPreference').set_value('17')
        dialog.get_field('apiKey').set_value("********")
        imgp = take_capture(self.driver, "mapviewer_settings")
        crop_image(imgp, *create_box(dialog))

        dialog.get_field('apiKey').set_value(settings.GMAPS_KEY)
        dialog.accept()
        time.sleep(0.2)

        # Reload map viewer widget so it updates the view using the initial zoom and initial location
        popup = map_viewer_widget.open_menu()
        setts_btn = popup.get_entry("Reload")
        ActionChains(self.driver).move_to_element(setts_btn).perform()
        imgp = take_capture(self.driver, name='mapviewer_reload_entry')
        box = create_box(popup.element, 40)
        box = (box[0] - 60 * DENSITY_FACTOR, box[1], box[2], box[3])
        add_pointer(imgp, get_position(setts_btn, 0.8, 0.5), True)
        crop_image(imgp, *box)
        setts_btn.click()

        # Take a capture now that the map viewer widget is correctly placed
        map_viewer_widget.wait_loaded()
        time.sleep(0.3)
        imgp = take_capture(self.driver, name="mapviewer_configured")
        crop_image(imgp, *create_box(map_viewer_widget.element))

        imgp = take_capture(self.driver, "workspace_mapviewer_configured")
        crop_down(
            imgp, get_by_contains(self.driver, '.wc-widget', 'Linear Graph'))

        # Wiring button
        btn = self.find_navbar_button("wc-show-wiring-button")
        ActionChains(self.driver).move_to_element(btn.element).perform()
        time.sleep(0.4)  # Wait tooltip
        imgp = take_capture(self.driver, 'wiring_button')
        add_pointer(imgp, get_position(btn, 0.8, 0.5))
        crop_down(imgp, btn, 60)

        #
        # After this point we are going to create the images for the wiring documentation
        #
        def take_capture(*args, **kargs):
            return midd_take_capture(*args, prepath="wiring", **kargs)

        with self.wiring_view as wiring:
            ActionChains(self.driver).move_by_offset(0, 50).perform()
            self.wait_element_visible('.wc-workspace-wiring .se-alert-static-top')
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'empty_wiring')
            crop_down(
                imgp, self.driver.find_element_by_css_selector(".wc-workspace-view .se-alert-static-top"), 40)

            # Click in Find Components
            btn = self.find_navbar_button('we-show-component-sidebar-button')
            ActionChains(self.driver).move_to_element(btn.element).perform()
            time.sleep(0.3)
            imgp = take_capture(self.driver, 'find_components_button')
            add_pointer(imgp, get_position(btn, 0.8, 0.5))
            crop_down(imgp, btn, 60)

            with self.wiring_view.component_sidebar as sidebar:
                # Create operator
                component_group = sidebar.find_component_group("operator", "CoNWeT/ngsi-source")
                self.driver.execute_script("return arguments[0].scrollIntoView();", component_group.element)
                btn = component_group.btn_create.element
                ActionChains(self.driver).move_to_element(btn).perform()
                time.sleep(0.3)
                imgp = take_capture(self.driver, "create_operator_button")
                add_pointer(imgp, get_position(btn, 0.5, 0.5))
                crop_down(imgp, btn, 60)

                ent_oper = component_group.create_component()

                time.sleep(20)

                # Dragging the NGSI source operator
                ActionChains(self.driver).move_to_element(ent_oper.element).perform()
                time.sleep(0.3)
                imgp = take_capture(self.driver, "add_ngsisource_sidebar")
                add_pointer(imgp, get_position(ent_oper, 0.8, 0.5))
                crop_down(imgp, ent_oper, 60)

                ActionChains(self.driver).click_and_hold(ent_oper.element).perform()
                time.sleep(0.05)  # Wait the operator is extracted from the side panel
                imgp = take_capture(self.driver, "add_ngsisource_drag")

                clon = get_by_contains(self.driver, ".panel.panel-default.component-draggable.component-operator.cloned.dragging", "NGSI source")
                add_pointer(imgp, get_position(clon, 0.5, 0.6))
                crop_down(imgp, clon, 100)

                # NGSI source added
                ActionChains(self.driver).move_to_element_with_offset(wiring.body, 10, 10).release().perform()
                time.sleep(0.2)

                # NGSI source added
                entservc = wiring.find_draggable_component("operator", title="NGSI source")
                imgp = take_capture(self.driver, "add_ngsisource_finish")
                add_pointer(imgp, get_position(entservc, 0.5, 0.5))
                crop_down(imgp, entservc.element, 250)

                ngsi_source_operator = sidebar.find_draggable_component("operator", title="NGSI source")

                # Configure NGSI source
                self.configure_ngsi_source(ngsi_source_operator)
                time.sleep(20)

                # Capture the map-viewer panel
                component_group = sidebar.find_component_group("widget", "CoNWeT/map-viewer")
                component = component_group.find_component(id=map_viewer_widget.id)
                self.driver.execute_script("return arguments[0].scrollIntoView();", component_group.element)
                ActionChains(self.driver).move_to_element(component.element).perform()
                time.sleep(0.3)
                imgp = take_capture(self.driver, "add_mapviewer_sidebar")
                add_pointer(imgp, get_position(component, 0.8, 0.5))
                crop_down(imgp, component.element, 60)

                # Create widget button
                btn = component_group.btn_create.element
                ActionChains(self.driver).move_to_element(btn).perform()
                time.sleep(0.3)
                imgp = take_capture(self.driver, "create_widget_button")
                add_pointer(imgp, get_position(btn, 0.5, 0.5))
                crop_down(imgp, btn, 60)

                # Add map iwidget
                mapsercvcomp = sidebar.add_component("widget", "CoNWeT/map-viewer", id=map_viewer_widget.id, x=500, y=10)
                mapservc = mapsercvcomp.element
                component_group = sidebar.find_component_group("widget", "CoNWeT/map-viewer")
                self.driver.execute_script("return arguments[0].scrollIntoView();", component_group.element)
                time.sleep(0.5)
                imgp = take_capture(self.driver, 'wiring_after_adding_mapviewer')
                add_pointer(imgp, get_position(mapservc, 0.5, 0.15), False)
                crop_down(imgp, mapservc, 10)

                # Hover endpoint label
                labelprovideent = entservc.find_endpoint("source", title='Provide entity')
                ActionChains(self.driver).move_to_element(labelprovideent.element).perform()
                time.sleep(0.6)  # wait for color transition
                imgp = take_capture(self.driver, 'missing_connection_recommendations')
                add_pointer(imgp, get_position(labelprovideent, 0.6, 0.5))
                crop_down(imgp, mapservc, 10)

                component_group = sidebar.find_component_group("operator", "CoNWeT/ngsientity2poi")
                poi_temp = component_group.create_component()
                sidebar.create_component_draggable(poi_temp, x=140, y=200)
                time.sleep(0.2)

                poi_oper_w = sidebar.find_draggable_component("operator", title="NGSI Entity To PoI")
                self.configure_ngsi_entity(poi_oper_w)

            imgp = take_capture(self.driver, 'wiring_after_adding_ngsientity2poi')
            add_pointer(imgp, get_position(poi_oper_w, 0.5, 0.45))
            crop_down(imgp, mapservc, 10)

            ActionChains(self.driver).move_to_element(labelprovideent.element).perform()
            time.sleep(0.6)  # wait for color transition
            imgp = take_capture(self.driver, 'endpoint_recommendation')
            add_pointer(imgp, get_position(labelprovideent, 0.6, 0.5))
            crop_down(imgp, mapservc, 10)

            # Connect NGSI source with the NGSI Entity 2 PoI operator
            labelentity = poi_oper_w.find_endpoint("target", title='Entity')

            ActionChains(self.driver).click_and_hold(labelprovideent.element).move_by_offset(-100, 100).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'ngsientity2poi_connection_dragging')
            pos = get_position(labelprovideent, 0.5, 0.5)
            pos = (pos[0] - 100 * DENSITY_FACTOR, pos[1] + 100 * DENSITY_FACTOR)
            add_pointer(imgp, pos)
            crop_down(imgp, mapservc, 10)

            ActionChains(self.driver).move_to_element(labelentity.element).release().perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'ngsientity2poi_connection_created')
            add_pointer(imgp, get_position(labelentity, 0.6, 0.5))
            crop_down(imgp, mapservc, 10)

            # Connect the NGSI Entity 2 PoI operator with the map viewer widget
            source_endpoint = poi_oper_w.find_endpoint('source', title='PoI')
            target_endpoint = mapsercvcomp.find_endpoint('target', title='Insert/Update PoI')
            source_endpoint.create_connection(target_endpoint)
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'wiring_after_connecting_ngsientity2poin_and_mapviewer')
            add_pointer(imgp, get_position(target_endpoint, 0.6, 0.5))
            crop_down(imgp, mapsercvcomp.element, 10)

        # Out wiring_view
        self.change_current_workspace('History Info')
        linear_graph_widget, map_viewer_widget = self.widgets

        with map_viewer_widget:
            self.driver.execute_script('mapViewer.map.setMapTypeId("satellite");')
            WebDriverWait(self.driver, timeout=120).until(lambda driver: driver.execute_script('return Object.keys(mapViewer.mapPoiManager.getPoiList()).length !== 0;'))
        time.sleep(10)  # Wait until market icons are loaded
        imgp = take_capture(self.driver, 'mapviewer_with_entities')

        with map_viewer_widget:
            self.driver.execute_script('mapViewer.mapPoiManager.selectPoi(new Poi({id:"OUTSMART.NODE_3509"}));mapViewer.map.setZoom(16);')
        with linear_graph_widget:
            WebDriverWait(self.driver, timeout=30).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '#loadLayer.on')))
        time.sleep(10)  # Wait until market icons are loaded
        imgp = take_capture(self.driver, 'mapviewer_entity_details')

        with self.wiring_view as wiring:
            mapservcw = wiring.find_draggable_component("widget", title="Map Viewer")

            #
            # Modify the PoI - insert/Update PoI connection
            #
            mycon = wiring.find_connections()[1]
            mycon.click()

            source_endpoint = mapservcw.find_endpoint('target', title='Insert/Update PoI')
            target_endpoint = mapservcw.find_endpoint('target', title='Insert/Update Centered PoI')

            ActionChains(self.driver).move_to_element(source_endpoint.element).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'modify_connection1')
            add_pointer(imgp, get_position(source_endpoint, 0.6, 0.5))
            crop_down(imgp, mapservcw, 50)

            ActionChains(self.driver).click_and_hold(source_endpoint.element).move_by_offset(-100, 25).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'modify_connection2')
            pos = get_position(source_endpoint, 0.5, 0.5)
            pos = (pos[0] - 100 * DENSITY_FACTOR, pos[1] + 25 * DENSITY_FACTOR)
            add_pointer(imgp, pos)
            crop_down(imgp, mapservcw, 50)

            ActionChains(self.driver).move_to_element(target_endpoint.element).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'modify_connection3')
            add_pointer(imgp, get_position(target_endpoint, 0.6, 0.5))
            crop_down(imgp, mapservcw, 50)

            ActionChains(self.driver).release().perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'modify_connection4')
            add_pointer(imgp, get_position(target_endpoint, 0.6, 0.5))
            crop_down(imgp, mapservcw, 50)

            # Restore the connection
            mycon = wiring.find_connections()[1]
            ActionChains(self.driver).drag_and_drop(target_endpoint.element, source_endpoint.element).perform()

            #
            # Reshape arrow screenshots
            #

            mycon = wiring.find_connections()[1]
            cprefs = mycon.show_preferences()

            # Enable connection customize mode
            custb = cprefs.get_entry("Customize")
            ActionChains(self.driver).move_to_element(custb).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'reshape_arrow_pre')
            add_pointer(imgp, get_position(custb, 0.3, 0.3))
            crop_down(imgp, mapservcw, 50)
            # Captura reshape_arrow_pre
            cprefs.click_entry("Customize")
            _, ball_handler = mycon.element.find_elements_by_css_selector(".we-connection-handle-ball")

            move_elem(self.driver, ball_handler, 30, -30)
            _, ball_handler = mycon.element.find_elements_by_css_selector(".we-connection-handle-ball")
            imgp = take_capture(self.driver, 'reshape_arrow2')
            add_pointer(imgp, get_position(ball_handler, 0.3, 0.3))
            crop_down(imgp, mapservcw, 10)

            move_elem(self.driver, ball_handler, -30, 30)

            _, ball_handler = mycon.element.find_elements_by_css_selector(".we-connection-handle-ball")
            imgp = take_capture(self.driver, 'reshape_arrow1')
            add_pointer(imgp, get_position(ball_handler, 0.3, 0.3))
            crop_down(imgp, mapservcw, 10)

            # Stop customizing the connection
            popup_menu = mycon.show_preferences()
            stopbutton = popup_menu.get_entry("Stop customizing")
            ActionChains(self.driver).move_to_element(stopbutton).perform()
            time.sleep(0.3)  # Wait hover effect
            imgp = take_capture(self.driver, 'reshape_arrow_stop')
            add_pointer(imgp, get_position(stopbutton, 0.3, 0.3))
            crop_down(imgp, popup_menu, 10)
            stopbutton.click()

            #
            # Delete connection screenshots
            #

            ActionChains(self.driver).move_to_element(mycon.btn_remove.element).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'delete_arrow1')
            add_pointer(imgp, get_position(mycon.btn_remove, 0.5, 0.4))
            crop_down(imgp, mapservcw, 50)

            # Deselect the connection
            mycon.click()

            #
            # Minimize screenshots
            #

            ngsisw = wiring.find_draggable_component("operator", title="NGSI source")
            collbtn = ngsisw.show_preferences().get_entry("Collapse")
            ActionChains(self.driver).move_to_element(collbtn).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, 'minimize_option')
            add_pointer(imgp, get_position(collbtn, 0.3, 0.3))
            crop_down(imgp, mapservcw, 10)
            collbtn.click()

            wiring.find_draggable_component("operator", title="NGSI Entity To PoI").collapse_endpoints()

            imgp = take_capture(self.driver, 'collapsed_operators')
            crop_down(imgp, mapservcw, 10)

            movew = wiring.find_draggable_component("widget", title="Map Viewer")
            move_elem(self.driver, movew.element, -70, 0)

            movew = wiring.find_draggable_component("operator", title="NGSI Entity To PoI")
            move_elem(self.driver, movew.element, -20, 0)

            # Add all the missing components
            with wiring.component_sidebar as sidebar:
                linw = sidebar.add_component("widget", "CoNWeT/linear-graph", id=linear_graph_widget.id, x=750, y=10)
                histw = sidebar.add_component("operator", "CoNWeT/simple-history-module2linear-graph", x=750, y=152)

            # Create the misssing wiring connections
            endp1 = mapservcw.find_endpoint("source", title="PoI selected")
            endp2 = histw.find_endpoint("target", title="Sensor Id")
            endp3 = histw.find_endpoint("source", title="Historic Info")
            endp4 = linw.find_endpoint("target", title="Data in")

            endp1.create_connection(endp2)
            endp3.create_connection(endp4)

            move_elem(self.driver, histw.element, 0, 35)

            take_capture(self.driver, 'final_wiring')

        with linear_graph_widget:
            WebDriverWait(self.driver, timeout=30).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '#loadLayer.on')))

        with map_viewer_widget:
            self.driver.execute_script('''
                var poi = mapViewer.mapPoiManager.getPoiList()["OUTSMART.NODE_3506"].poi;
                mapViewer.mapPoiManager.selectPoi(poi);
                mapViewer.map.setZoom(16);
                MashupPlatform.wiring.pushEvent('poiOutput', JSON.stringify(poi))
            ''')
            self.driver.execute_script('mapViewer.map.setMapTypeId("roadmap");')

        with linear_graph_widget:
            WebDriverWait(self.driver, timeout=120).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '#loadLayer.on')))
        take_capture(self.driver, 'final_mashup')

        with linear_graph_widget:
            ActionChains(self.driver).move_to_element_with_offset(self.driver.find_element_by_css_selector('canvas'), 150, 0).click_and_hold().move_by_offset(40, 0).perform()

        lg_path = take_capture(self.driver, 'linear_graph_zoom1')
        add_pointer(lg_path, get_position(linear_graph_widget, 0.37, 0.5), False)
        crop_image(lg_path, *create_box(linear_graph_widget))

        ActionChains(self.driver).release().perform()
        lg_path = take_capture(self.driver, 'linear_graph_zoom2')
        crop_image(lg_path, *create_box(linear_graph_widget))

        # Share entry
        popup_menu = self.open_menu()
        m_menu = popup_menu.get_entry('Share')
        ActionChains(self.driver).move_to_element(m_menu).perform()
        time.sleep(0.2)  # Wait hover effect
        imgp = take_capture(self.driver, 'share_workspace_entry')
        add_pointer(imgp, get_position(m_menu, 0.8, 0.5))
        crop_down(imgp, popup_menu, 80)
        m_menu.click()

        # Share workspace dialog
        dialog = FormModalTester(self, self.wait_element_visible(".wc-dashboard-share-modal"))
        time.sleep(0.2)
        public_b = dialog.element.find_element_by_css_selector('input[value="public"]')
        public_b.click()
        imgp = take_capture(self.driver, 'share_workspace_dialog')
        add_pointer(imgp, get_position(public_b, 0.5, 0.5))
        crop_image(imgp, *create_box(dialog))
        dialog.cancel()

        # Embed mashup entry
        popup_menu = self.open_menu()
        m_menu = popup_menu.get_entry('Embed')
        ActionChains(self.driver).move_to_element(m_menu).perform()
        time.sleep(0.2)  # Wait hover effect
        imgp = take_capture(self.driver, 'embed_workspace_entry')
        add_pointer(imgp, get_position(m_menu, 0.8, 0.5))
        crop_down(imgp, popup_menu.element, 80)
        m_menu.click()

        # Embed mashup dialog
        dialog = FormModalTester(self, self.wait_element_visible(".wc-embed-code-modal"))
        time.sleep(0.2)
        imgp = take_capture(self.driver, 'embed_workspace_dialog')
        crop_image(imgp, *create_box(dialog))
        dialog.cancel()

    test_building_mashup.tags = tags + ('wirecloud-guide-building-mashup',)

    @uses_extra_workspace('admin', 'CoNWeT_History_Info_2.0.wgt')
    @uses_extra_workspace('admin', 'CoNWeT_MWD_Tutorial_2.0.wgt')
    def test_behaviour_mashup(self):
        def take_capture(*args, **kargs):
            return midd_take_capture(*args, prepath="behaviour_oriented_wiring", **kargs)
        self.driver.set_window_size(1024, 768)
        self.login(username="admin", next="/admin/History Info")

        with self.wiring_view as wiring:
            btnbehav = wiring.btn_behaviours.element
            ActionChains(self.driver).move_to_element(btnbehav)
            time.sleep(0.2)
            imgp = take_capture(self.driver, "list_behaviours_button")
            add_pointer(imgp, get_position(btnbehav, 0.8, 0.5))
            crop_down(imgp, btnbehav, 30)

            self.driver.execute_script("document.querySelector('.wc-workspace-view .wiring-diagram').style.cssText = 'box-shadow: none; border: none;'")
            wc = self.driver.find_element_by_css_selector(".we-connections-layer")

            with wiring.behaviour_sidebar as sidebar:
                sidebar.find_behaviour(title="Show lampposts on map").activate()
            imgp = take_capture(self.driver, "santander_behaviour1")
            crop_image(imgp, *create_box(wc))

            with wiring.behaviour_sidebar as sidebar:
                sidebar.find_behaviour(title="Show lamppost details").activate()
            imgp = take_capture(self.driver, "santander_behaviour2")
            crop_image(imgp, *create_box(wc))

            with wiring.behaviour_sidebar as sidebar:
                self.driver.execute_script("arguments[0].style.cssText = ''", wiring.body)

                # Lock
                panelhead = sidebar.panel.find_element_by_css_selector('.panel-heading')

                ActionChains(self.driver).move_to_element(sidebar.btn_enable.element).perform()
                time.sleep(0.2)
                tooltip = self.driver.find_element_by_css_selector(".tooltip.fade.bottom.in")
                imgp = take_capture(self.driver, "disable_behaviours_button")
                add_pointer(imgp, get_position(sidebar.btn_enable, 0.5, 0.5))
                panelheads = create_box(panelhead, 7)
                crop_image(imgp, left=panelheads[0], upper=panelheads[1], right=get_position(tooltip, 1.0, 1.0)[0] + 10, lower=get_position(tooltip, 1.0, 1.0)[1] + 10)

        self.change_current_workspace('MWD Tutorial')
        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.find_behaviour(title="Locate technicians").activate()
                time.sleep(1)
                take_capture(self.driver, "general_aspect")

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                btncreate = sidebar.btn_create
                ActionChains(self.driver).move_to_element(btncreate.element).perform()
                time.sleep(0.2)
                imgp = take_capture(self.driver, "create_behaviour_button")
                add_pointer(imgp, get_position(btncreate, 0.5, 0.5))
                btncreate.click()

                dialog = FormModalTester(self, self.wait_element_visible(".we-new-behaviour-modal"))
                time.sleep(0.2)
                imgp = take_capture(self.driver, "new_behaviour_dialog")
                crop_image(imgp, *create_box(dialog))
                dialog.cancel()

                firstbehav = sidebar.active_behaviour
                prefs = firstbehav.show_preferences()
                btnprefs = prefs.get_entry("Settings")
                ActionChains(self.driver).move_to_element(btnprefs).perform()
                time.sleep(0.2)
                imgp = take_capture(self.driver, "behaviour_settings_option")
                add_pointer(imgp, get_position(btnprefs, 0.5, 0.5))
                prefs.close()

                btnrm = firstbehav.btn_remove
                ActionChains(self.driver).move_to_element(btnrm.element).perform()
                time.sleep(0.2)
                imgp = take_capture(self.driver, "remove_behaviour_button")
                add_pointer(imgp, get_position(btnrm, 0.5, 0.5))

            techniciancomponent = wiring.find_draggable_component("widget", title="Technician List")
            rmbtn = techniciancomponent.btn_remove
            ActionChains(self.driver).move_to_element(rmbtn.element).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, "remove_component")
            add_pointer(imgp, get_position(rmbtn, 0.5, 0.5))

            targetend = techniciancomponent.find_endpoint("target", title="Technician")
            connection = [x for x in wiring.find_connections() if x.target_id == targetend.id][0]
            rmbtn = connection.btn_remove
            ActionChains(self.driver).move_to_element(rmbtn.element).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, "remove_connection")
            add_pointer(imgp, get_position(rmbtn, 0.5, 0.5))

            with wiring.behaviour_sidebar as sidebar:

                # Enable behaviour list order mode button
                ActionChains(self.driver).move_to_element(sidebar.btn_order.element).perform()
                time.sleep(0.2)
                tooltip = self.driver.find_element_by_css_selector(".tooltip.fade.bottom.in")
                imgp = take_capture(self.driver, "order_behaviours_button")
                add_pointer(imgp, get_position(sidebar.btn_order, 0.5, 0.5))
                panelheads = create_box(panelhead, 7)
                crop_image(imgp, left=panelheads[0], upper=panelheads[1], right=get_position(tooltip, 1.0, 1.0)[0] + 10, lower=get_position(tooltip, 1.0, 1.0)[1] + 80 * DENSITY_FACTOR)

                # Target order:
                # - Display technician profiles
                # - Locate Technicians
                # - Allow technician searches
                behaviour1 = sidebar.find_behaviour("Allow technician searches")
                sidebar.find_behaviour("Display technician profiles")
                behaviour3 = sidebar.find_behaviour("Locate technicians")

                # Reorder the behaviours
                sidebar.btn_order.click()
                pos = get_position(behaviour3.element.find_element_by_css_selector('.panel-heading'), 0.5, 0.6)
                ActionChains(self.driver).click_and_hold(behaviour3.element).move_by_offset(0, -50).perform()
                time.sleep(0.2)
                imgp = take_capture(self.driver, "ordering_behaviours")
                pos = (pos[0], pos[1] - 50 * DENSITY_FACTOR)
                add_pointer(imgp, pos)
                crop_image(imgp, *create_box(sidebar.panel))

                ActionChains(self.driver).move_by_offset(0, 50).release().perform()
                behaviour1.change_position(behaviour3)

                # Exit from the behaviour ordering mode
                ActionChains(self.driver).move_to_element(sidebar.btn_order.element).perform()
                time.sleep(0.2)
                tooltip = self.driver.find_element_by_css_selector(".tooltip.fade.bottom.in")
                imgp = take_capture(self.driver, "exit_order_behaviours_mode")
                add_pointer(imgp, get_position(sidebar.btn_order, 0.5, 0.5))
                panelheads = create_box(panelhead, 7)
                crop_image(imgp, left=panelheads[0], upper=panelheads[1], right=get_position(tooltip, 1.0, 1.0)[0] + 10, lower=get_position(tooltip, 1.0, 1.0)[1] + 80 * DENSITY_FACTOR)

                sidebar.btn_order.click()

                # Create a new behaviour
                sidebar.create_behaviour("Test", "Testing").activate()

            techniciancomponent = wiring.find_draggable_component("widget", title="Technician List")
            addbtn = techniciancomponent.btn_add
            ActionChains(self.driver).move_to_element(addbtn.element).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, "component_share_button")
            add_pointer(imgp, get_position(addbtn, 0.5, 0.5))

            targetend = techniciancomponent.find_endpoint("target", title="Query")
            connection = [x for x in wiring.find_connections() if x.target_id == targetend.id][0]
            addbtn = connection.btn_add
            ActionChains(self.driver).move_to_element(addbtn.element).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, "connection_share_button")
            add_pointer(imgp, get_position(addbtn, 0.5, 0.5))

        self.create_workspace('Enable Behaviour Work')
        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                # UnLock
                panelhead = sidebar.panel.find_element_by_css_selector('.panel-heading')

                ActionChains(self.driver).move_to_element(sidebar.btn_enable.element).perform()
                time.sleep(0.2)
                tooltip = self.driver.find_element_by_css_selector(".tooltip.fade.bottom.in")
                imgp = take_capture(self.driver, "enable_behaviours_button")
                add_pointer(imgp, get_position(sidebar.btn_enable, 0.5, 0.5))
                panelheads = create_box(panelhead, 7)
                crop_image(imgp, left=panelheads[0], upper=panelheads[1], right=get_position(tooltip, 1.0, 1.0)[0] + 10, lower=get_position(tooltip, 1.0, 1.0)[1] + 10)

    test_behaviour_mashup.tags = tags + ('wirecloud-guide-behaviour-mashup',)

    def test_sanity_check(self):

        def take_capture(*args, **kargs):
            return midd_take_capture(*args, prepath="../installation_guide", **kargs)

        # Intitialization
        self.driver.set_window_size(1024, 768)

        # Login screen
        url = self.live_server_url
        url += reverse('login')
        self.driver.get(url)
        self.wait_element_visible('#wc-login-form')

        time.sleep(0.3)
        imgp = take_capture(self.driver, "login")
        crop_down(imgp, self.driver.find_element_by_css_selector('body'), 80)

        # Log into WireCloud
        self.login(next="/?theme=wirecloud.defaulttheme")

        # My Resources button
        btn = self.find_navbar_button('wc-show-myresources-button')
        ActionChains(self.driver).move_to_element(btn.element).perform()
        time.sleep(0.3)  # wait tooltip animation
        imgp = take_capture(self.driver, "my_resources_button")
        add_pointer(imgp, get_position(btn, 0.8, 0.5))
        crop_down(imgp, self.driver.find_element_by_css_selector('.wc-initial-message'))

        with self.myresources_view as myresources:

            # Upload button
            btn = self.find_navbar_button('wc-upload-mac-button')
            ActionChains(self.driver).move_to_element(btn.element).perform()
            time.sleep(0.3)  # wait tooltip animation
            imgp = take_capture(self.driver, "upload_button")
            add_pointer(imgp, get_position(btn, 0.5, 0.5))
            crop_down(imgp, self.driver.find_element_by_css_selector('.catalogueEmptyBox'))

            myresources.upload_resource('CoNWeT_weather-mashup-example_1.0.2.wgt', 'Weather Mashup Example')

            # Used resources
            myresources.search('')
            time.sleep(0.3)
            imgp = take_capture(self.driver, "used_resources")
            crop_down(imgp, myresources.search_in_results('Weather Mashup Example'))

            # Back button
            catalogue_base_element = myresources.wait_catalogue_ready()
            btn = self.driver.find_element_by_css_selector('.wirecloud_header_nav .wc-back-button')
            ActionChains(self.driver).move_to_element(btn).perform()
            time.sleep(0.3)  # wait tooltip animation
            imgp = take_capture(self.driver, "back_button")
            add_pointer(imgp, get_position(btn, 0.5, 0.5))
            crop_down(imgp, catalogue_base_element.find_element_by_css_selector('.simple_search_text'), 80)

        # Capture new workspace entry
        menu = self.open_menu()
        newworkspace_menu = menu.get_entry('New workspace')
        ActionChains(self.driver).move_to_element(newworkspace_menu).perform()
        time.sleep(0.2)  # Wait hover effect
        imgp = take_capture(self.driver, 'new_workspace_entry')
        add_pointer(imgp, get_position(newworkspace_menu, 0.8, 0.5))
        crop_down(imgp, menu)  # Crop down the Image

        # New workspace dialog
        newworkspace_menu.click()
        form = FormModalTester(self, self.wait_element_visible('.wc-new-workspace-modal'))

        with MACFieldTester(self, form.element.find_element_by_css_selector('.se-mac-field')) as select_dialog:
            resource = select_dialog.search_in_results('Weather Mashup Example')
            resource.select()

        time.sleep(0.3)
        imgp = take_capture(self.driver, 'new_workspace_dialog')
        crop_image(imgp, *create_box(form))

        form.accept()

        # Final weather dashboard
        self.wait_wirecloud_ready()
        for iwidget in self.widgets:
            iwidget.wait_loaded()

        time.sleep(3)
        imgp = take_capture(self.driver, "weather_dashboard")

        # import ipdb; ipdb.sset_trace()
        imgp = take_capture(self.driver, "example_usage")
    test_sanity_check.tags = tags + ('wirecloud-guide-sanity-check',)
