# -*- coding: utf-8 -*-

# Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid

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
import shutil

from django.conf import settings
from django.contrib.auth.models import User
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

from wirecloud.commons.utils.testcases import uses_extra_resources, WirecloudSeleniumTestCase, wirecloud_selenium_test_case, DynamicWebServer, LocalFileSystemServer, RealWebServer
from wirecloud.catalogue.models import CatalogueResource

__test__ = 'wirecloud.guidebuilder' in settings.INSTALLED_APPS

if __test__ is True:
    from PIL import Image

USER_GUIDE_IMAGES_PATH = '../docs/images/user_guide'
list_resources = ['CoNWeT_simple-history-module2linear-graph_2.3.2.wgt',
                  'CoNWeT_ngsi-source_3.0.2.wgt',
                  'CoNWeT_ngsientity2poi_3.0.3.wgt',
                  'CoNWeT_linear-graph_3.0.0b3.wgt',
                  'CoNWeT_map-viewer_2.5.6.wgt']


# Common functions


def image_path(name='Wirecloud_UG.png', extra=None, resource=False):
    if extra is not None:
        name = name if not name.endswith('.png') else name[:-4]
        name = '{}_{}.png'.format(name, extra)
    name = name if name.endswith('.png') else "{}.png".format(name)
    if not resource:
        basepath = os.path.join(settings.BASEDIR, USER_GUIDE_IMAGES_PATH)
    else:
        basepath = os.path.join(os.path.dirname(__file__), 'resources')
    return os.path.join(basepath, name)


def take_capture(driver, name='Wirecloud_UG.png', extra=None):
    path = image_path(name, extra)
    driver.save_screenshot(path)
    return path


def merge_images(img1, img2, position):
    img1.paste(img2, position, img2)


def add_image(imgp, position, imagename):
    lp = image_path(imagename, resource=True)
    base = Image.open(imgp)
    l = Image.open(lp)
    merge_images(base, l, position)
    base.save(imgp)


def add_pointer(imgp, position, pointer=True):
    mousefn = 'select_l.png' if pointer else 'arrow_l.png'
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
    lower_cut = get_position(widg, 1.0, 1.0)[1] + offs
    crop_image(imgp, lower=lower_cut)


def get_position(widg, xoff=0.75, yoff=0.75):
    return (int(widg.location['x'] + xoff * widg.size['width']),
            int(widg.location['y'] + yoff * widg.size['height']))


def create_box(widg, offs=3):
    return (int(widg.location['x'] - offs),
            int(widg.location['y'] - offs),
            int(widg.location['x'] + widg.size['width'] + offs),
            int(widg.location['y'] + widg.size['height'] + offs))


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


def get_anchors(w1, w2, label1, label2):
    froml = get_by_text(w1, '.labelDiv', label1)
    tol = get_by_text(w2, '.labelDiv', label2)
    fromc = froml.find_element_by_css_selector('.anchor.icon-circle')
    toc = tol.find_element_by_css_selector('.anchor.icon-circle')
    return (fromc, toc)


def connect_anchors(driver, w1, w2, label1, label2):
    fromc, toc = get_anchors(w1, w2, label1, label2)
    ActionChains(driver).drag_and_drop(fromc, toc).perform()


def move_elem(driver, elem, x, y):
    ActionChains(driver).click_and_hold(
        elem).move_by_offset(x, y).release().perform()


def resize_widget(driver, widget, width, height):

    driver.execute_script('''
        var iwidget = Wirecloud.activeWorkspace.getIWidget(arguments[0]);
        iwidget.setSize(arguments[1], arguments[2]);
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
    fixtures = ('initial_data', 'selenium_test_data', 'guide_test_data')
    servers = {
        'http': {
            'marketplace.example.com': DynamicWebServer(),
            'repository.example.com': LocalFileSystemServer(market_path_base('responses', 'repository')),
            'static.example.com': LocalFileSystemServer(market_path_base('responses', 'static')),
            'store.example.com': DynamicWebServer(fallback=LocalFileSystemServer(market_path_base('responses', 'store'))),
            'store2.example.com': DynamicWebServer(fallback=LocalFileSystemServer(market_path_base('responses', 'store2'))),
            'orion.lab.fiware.org:1026': RealWebServer()
        },
        'https': {
            'ngsiproxy.lab.fiware.org': RealWebServer()
        }
    }

    tags = ('wirecloud-guide',)

    @classmethod
    def setUpClass(cls):

        if not os.path.exists(os.path.join(settings.BASEDIR, USER_GUIDE_IMAGES_PATH)):
            os.makedirs(os.path.join(settings.BASEDIR, USER_GUIDE_IMAGES_PATH))

        WirecloudSeleniumTestCase.setUpClass.__func__(cls)

    def setUp(self):
        User.objects.get(username='admin').social_auth.create(provider='fiware', uid='admin', extra_data={"access_token": "BdNiSTjfjsZJfdxyeYsTqDrIZyFUxa"})
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
            'GET', '/offering/store/FIWARE%20Lab/offerings', {'content': self.store1_offerings})
        self.network._servers['http']['marketplace.example.com'].add_response(
            'GET', '/offering/store/FIWARE/offerings', {'content': self.store2_offerings})

    def configure_ngsi_source(self, source):
        source.show_settings_modal()

        dialog = get_first_displayed(self.driver, '.window_menu')
        self.fill_form_input(dialog.find_element_by_css_selector('input[name="ngsi_server"]'),
                             'http://orion.lab.fiware.org:1026/')
        self.fill_form_input(dialog.find_element_by_css_selector('input[name="ngsi_proxy"]'),
                             'https://ngsiproxy.lab.fiware.org')
        self.fill_form_input(dialog.find_element_by_css_selector('input[name="ngsi_entities"]'),
                             'Node, AMMS, Regulator')
        self.fill_form_input(dialog.find_element_by_css_selector(
            'input[name="ngsi_update_attributes"]'), 'Latitud, Longitud, presence, batteryCharge, illuminance, ActivePower, ReactivePower, electricPotential, electricalCurrent')
        dialog.find_element_by_css_selector('.btn-primary').click()

    def configure_ngsi_entity(self, source):
        source.show_settings_modal()
        dialog = get_first_displayed(self.driver, '.window_menu')
        self.fill_form_input(dialog.find_element_by_css_selector('input[name="coordinates_attr"]'),
                             'Latitud, Longitud')
        dialog.find_element_by_css_selector('.btn-primary').click()

    @uses_extra_resources(list_resources)
    def test_creating_new_workspace(self):
        # Intitialization
        self.driver.set_window_size(1024, 768)
        self.login()
        self.create_workspace('My Multimedia Workspace')
        self.create_workspace('Issue Trouble')
        self.open_menu().click_entry('Workspace')
        self.wait_wirecloud_ready()

        menu_widg = self.driver.find_element_by_css_selector(
            '.wirecloud_header_nav .icon-reorder')

        # Empty workspace screenshot
        imgp = take_capture(self.driver, extra=1)

        # Workspace list screenshot
        menu = self.open_menu()
        imgp = take_capture(self.driver, extra=3)
        add_pointer(imgp, get_position(menu_widg))  # Add the mouse
        crop_down(imgp, menu.element)  # Crop down the image

        # Capture new workspace
        newworkspace_menu = menu.get_entry('New workspace')
        ActionChains(self.driver).move_to_element(newworkspace_menu).perform()
        imgp = take_capture(self.driver, extra=4)
        add_pointer(imgp, get_position(newworkspace_menu, 0.8, 0.5))
        crop_down(imgp, menu.element)  # Crop down the image

        # Capture writing new workspace name
        newworkspace_menu.click()
        dialog = self.driver.find_element_by_css_selector(
            '.window_menu.new_workspace')
        self.fill_form_input(dialog.find_element_by_css_selector('input[name="name"]'),
                             'History Info')
        imgp = take_capture(self.driver, extra=5)
        crop_image(imgp, *create_box(dialog))

        # Wait complete and capture state
        # dialog.find_element_by_xpath("//*[text()='Accept']").click()
        dialog.find_element_by_css_selector(
            'button.btn-primary.se-btn').click()
        self.wait_wirecloud_ready()
        imgp = take_capture(self.driver, extra='HistoryInfoWorkspace')
        crop_down(
            imgp, self.driver.find_element_by_css_selector('.emptyWorkspaceInfoBox'))

        btn = self.driver.find_element_by_css_selector(
            '.wc-toolbar .icon-shopping-cart')
        ActionChains(self.driver).move_to_element(btn).perform()
        time.sleep(0.2)
        imgp = take_capture(self.driver, extra=17)
        add_pointer(imgp, get_position(btn, 0.8, 0.5))
        crop_down(
            imgp, self.driver.find_element_by_css_selector('.emptyWorkspaceInfoBox'))

        # Workspace Settings
        self.open_menu().click_entry('Settings')
        dialog = self.driver.find_element_by_css_selector(
            '.window_menu.workspace_preferences')
        imgp = take_capture(self.driver, extra='WorkspaceSettings')
        crop_image(imgp, *create_box(dialog))

    @uses_extra_resources(list_resources)
    def test_browsing_marketplace(self):
        self.driver.set_window_size(1024, 768)
        self.login()

        with self.marketplace_view as marketplace:
            marketplace.switch_to('origin')
            marketplace.delete()
            marketplace.switch_to('FIWARE Lab')
            select = self.driver.find_element_by_css_selector(
                '.se-select select')

            # Market list screenshot
            imgp = take_capture(
                self.driver, 'Wirecloud_Marketplace_plus_stores.png')
            add_image(imgp, get_position(select, 0.0, 1.0), 'store_filter.png')
            add_pointer(imgp, get_position(select, 0.7, 1.8), False)
            crop_down(imgp, select, 80)

            # marketplaces screenshot
            popup_menu = marketplace.open_menu()
            m_menu = popup_menu.get_entry('FIWARE Lab')
            ActionChains(self.driver).move_to_element(m_menu).perform()
            imgp = take_capture(self.driver, extra=8)
            add_pointer(imgp, get_position(m_menu, 0.8, 0.5))
            crop_down(imgp, popup_menu.element, 80)

            # Copy the previous to other one that uses it after
            shutil.copy2(imgp, image_path(extra=10))

            # Add marketplace
            m_menu = popup_menu.get_entry('Add new marketplace')
            ActionChains(self.driver).move_to_element(m_menu).perform()
            imgp = take_capture(self.driver, extra='AddNewMarketplace')
            add_pointer(imgp, get_position(m_menu, 0.8, 0.5))
            crop_down(imgp, popup_menu.element, 80)

            # Adding marketplace
            m_menu.click()
            dialog = self.driver.find_elements_by_css_selector(
                '.window_menu')[1]
            self.fill_form_input(dialog.find_element_by_css_selector('input[name="name"]'),
                                 'FIWARE Lab')
            self.fill_form_input(dialog.find_element_by_css_selector('input[name="url"]'),
                                 'https://marketplace.lab.fiware.org')
            Select(dialog.find_element_by_css_selector(
                'select')).select_by_index(1)
            imgp = take_capture(self.driver, extra='AddingFiwareMarketplace')
            crop_image(imgp, *create_box(dialog))

            # Cancel marketplace creation
            button = dialog.find_element_by_css_selector('button.se-btn:not(.btn-primary)')
            button.click()

            #marketplace.switch_to('FIWARE Lab')
            # Where are my resources
            btn = self.driver.find_element_by_css_selector(
                '.wc-toolbar .icon-archive')
            ActionChains(self.driver).move_to_element(btn).perform()
            time.sleep(0.3) # wait tooltip animation
            imgp = take_capture(self.driver, "Wirecloud_switch_to_local")
            add_pointer(imgp, get_position(btn, 0.8, 0.5))
            crop_down(imgp, select, 80)

        with self.myresources_view as myresources:
            # Resources
            imgp = take_capture(self.driver, extra=9)

            btn = self.driver.find_element_by_css_selector(
                '.wc-toolbar .icon-cloud-upload')
            # Where are upload button
            ActionChains(self.driver).move_to_element(btn).perform()
            time.sleep(0.3) # wait tooltip animation
            imgp = take_capture(self.driver, extra="UploadButton")
            add_pointer(imgp, get_position(btn, 0.5, 0.5))
            crop_down(imgp, myresources.search_in_results('Map Viewer').element, 80)

            # Upload dialog
            btn.click()
            dialog = self.driver.find_element_by_css_selector(
                '.window_menu.wc-upload-mac-dialog.wc-upload-mac-dialog-empty')
            imgp = take_capture(self.driver, extra='uploadNew')
            crop_image(imgp, *create_box(dialog))
            dialog.find_element_by_css_selector(
                '.btn-default.se-btn').click()  # cancel

            # Click in a widget for details
            container = get_first_displayed(
                # self.driver, '.se-bl-center-container .resource_list')
                self.driver, '.resource_list')
            widg = get_by_contains(
                container, '.resource.click_for_details', 'widget')
            # widg = container.find_element_by_css_selector('.resource.click_for_details')
            ActionChains(self.driver).move_to_element(widg).perform()
            imgp = take_capture(self.driver, 'Wirecloud_open_details')
            add_pointer(imgp, get_position(widg, 0.5, 0.5))
            crop_down(imgp, widg, 50)

            # Publish button
            widg.click()
            time.sleep(0.2)
            container = get_first_displayed(
                self.driver, '.advanced_operations')
            btn = get_by_text(container, '.se-btn', 'Publish')
            ActionChains(self.driver).move_to_element(btn).perform()  # wait?
            imgp = take_capture(self.driver, "Wirecloud_click_publish")
            add_pointer(imgp, get_position(btn, 0.8, 0.8))

            # Publish dialog
            btn.click()
            dialog = self.driver.find_element_by_css_selector(
                '.window_menu.publish_resource')
            dialog.find_element_by_css_selector(
                'input[value="admin/FIWARE Lab"]').click()
            select = dialog.find_element_by_css_selector('.se-select select')
            imgp = take_capture(
                self.driver, 'Wirecloud_publish_resource_store_select')
            add_image(imgp, get_position(select, 0.0, 1.0), 'store_list.png')
            add_pointer(imgp, get_position(select, 0.7, 1.8), False)
            crop_image(imgp, *create_box(dialog))

            get_by_text(dialog, 'button', 'Cancel').click()
            self.driver.find_element_by_css_selector(
                '.wirecloud_header_nav .btn-large .icon-caret-left').click()
    test_browsing_marketplace.tags = ('wirecloud-guide', 'ui-marketplace')

    @uses_extra_resources(list_resources)
    def test_building_mashup(self):
        self.driver.set_window_size(1024, 768)
        self.login()
        self.create_workspace('History Info')
        self.open_menu().click_entry('History Info')
        self.wait_wirecloud_ready()

        add_widget_button = self.driver.find_element_by_css_selector('.wc-toolbar .icon-plus')
        ActionChains(self.driver).move_to_element(add_widget_button).perform()
        time.sleep(0.3) # wait tooltip animation
        imgp = take_capture(self.driver, extra="19")
        add_pointer(imgp, get_position(add_widget_button, 0.8, 0.5))
        crop_down(imgp, self.driver.find_element_by_css_selector('.emptyWorkspaceInfoBox'))

        # Add to workspace
        with self.wallet as wallet:
            resource = wallet.search_in_results('Linear Graph')

            btn = resource.element.find_element_by_css_selector('.mainbutton')
            ActionChains(self.driver).move_to_element(btn).perform()
            time.sleep(0.3) # wait tooltip animation
            imgp = take_capture(self.driver, extra=20)
            add_pointer(imgp, get_position(btn, 0.8, 0.8))
            crop_down(imgp, resource.element)

            widget = resource.instantiate()

        resize_widget(self.driver, widget, 12, 41)

        # get the widget and crop down
        imgp = take_capture(self.driver, extra=21)
        crop_down(imgp, widget.element)

        # Add a Map Viewer Widget
        map_viewer_widget = self.add_widget_to_mashup('Map Viewer')
        resize_widget(self.driver, map_viewer_widget, 8, 41)
        # get the widget and crop down
        ActionChains(self.driver).move_to_element(self.driver.find_element_by_css_selector('.fiware-logo')).perform()
        time.sleep(0.3) # Wait widget menu transition
        imgp = take_capture(self.driver, extra=22)

        widg_menu = map_viewer_widget.element.find_element_by_css_selector('.widget_menu')
        setts_btn = widg_menu.find_element_by_css_selector(
            '.buttons .icon-cogs')
        ActionChains(self.driver).move_to_element(setts_btn).perform()
        time.sleep(0.2)

        # get the widget and crop down
        imgp = take_capture(self.driver, extra=23)
        box = create_box(widg_menu, 40)
        box = (box[0] + 37, box[1] + 37, box[2] - 37, box[3])
        add_pointer(imgp, get_position(setts_btn, 0.5, 0.5))
        crop_image(imgp, *box)

        popup_menu = map_viewer_widget.open_menu()
        btn = popup_menu.get_entry('Settings')
        ActionChains(self.driver).move_to_element(btn).perform()
        # get the widget and crop down
        imgp = take_capture(self.driver, extra=24)
        box = create_box(popup_menu.element, 130)
        box = (box[0], box[1], box[2] + 100, box[3] + 100)
        add_pointer(imgp, get_position(btn))
        crop_image(imgp, *box)

        btn.click()
        dialog = get_first_displayed(self.driver, '.window_menu')
        self.fill_form_input(dialog.find_element_by_css_selector(
            'input[name="centerPreference"]'), 'Santander')
        self.fill_form_input(dialog.find_element_by_css_selector('input[name="initialZoom"]'), '14')
        self.fill_form_input(dialog.find_element_by_css_selector('input[name="zoomPreference"]'), '17')
        imgp = take_capture(self.driver, extra=25)
        crop_image(imgp, *create_box(dialog))

        dialog.find_element_by_css_selector(
            'button.btn-primary.se-btn').click()
        time.sleep(0.2)

        # Reload map viewer widget so it updates the view using the initial zoom and initial location
        map_viewer_widget.open_menu().get_entry('Reload').click()
        map_viewer_widget.wait_loaded()
        time.sleep(0.3)
        imgp = take_capture(self.driver, extra=26)
        crop_image(imgp, *create_box(map_viewer_widget.element))

        imgp = take_capture(self.driver, extra=27)
        crop_down(
            imgp, get_by_contains(self.driver, '.fade.iwidget.in', 'Linear Graph'))

        dialog = self.driver.find_element_by_css_selector(
            '.wirecloud_app_bar')
        btn = dialog.find_element_by_css_selector(
            '.wc-toolbar .icon-puzzle-piece')
        ActionChains(self.driver).move_to_element(btn).perform()
        time.sleep(0.3)
        imgp = take_capture(self.driver, extra=28)
        add_pointer(imgp, get_position(btn, 0.8, 0.5))
        crop_down(imgp, btn, 60)

        with self.wiring_view:
            ActionChains(self.driver).move_by_offset(20, 20).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, extra='Empty_Wiring_Operators')
            crop_down(
                # imgp, self.driver.find_element_by_css_selector('.wiringEmptyBox'), 40)
                imgp, self.driver.find_element_by_css_selector(".alert.alert-info.se-alert-static-top"), 40)

            # Click in Find Components
            dialog = self.driver.find_element_by_css_selector('.wirecloud_app_bar')
            btn = dialog.find_element_by_css_selector('.wc-toolbar .icon-archive')
            ActionChains(self.driver).move_to_element(btn).perform()
            time.sleep(0.3)
            imgp = take_capture(self.driver, extra="Open_Find_Components")
            add_pointer(imgp, get_position(btn, 0.8, 0.5))
            crop_down(imgp, btn, 60)

            with self.wiring_view.component_sidebar as sidebar:
                # Create operator
                panel = self.driver.find_element_by_css_selector(".panel.panel-default.panel-components")
                btn = panel.find_element_by_css_selector(".se-btn.btn-create")
                ActionChains(self.driver).move_to_element(btn).perform()
                time.sleep(0.3)
                imgp = take_capture(self.driver, extra="Click_Create_Operator")
                add_pointer(imgp, get_position(btn, 0.8, 0.5))
                crop_down(imgp, btn, 60)

                sidebar.create_operator("NGSI source")

                # Dragging the NGSI source operator
                ent_oper = sidebar.find_operator_group_by_title("NGSI source").components[0].element
                ActionChains(self.driver).move_to_element(ent_oper).perform()

                time.sleep(0.3)

                imgp = take_capture(self.driver, extra="Wiring_NGSISource_Show")
                add_pointer(imgp, get_position(ent_oper, 0.8, 0.5))
                crop_down(imgp, ent_oper, 60)

                # ActionChains(self.driver).click_and_hold(ent_oper).move_by_offset(40, 20).perform()
                ActionChains(self.driver).click_and_hold(ent_oper).perform()
                imgp = take_capture(self.driver, extra='Wiring_NGSISource_drag')

                clon = get_by_contains(self.driver, ".panel.panel-default.component-draggable.component-operator.cloned.dragging", "NGSI source")
                add_pointer(imgp, get_position(clon, 0.5, 0.6), False)
                crop_down(imgp, clon, 100)

                # NGSI source added
                ActionChains(self.driver).move_to_element_with_offset(sidebar.section_diagram, 10, 10).release().perform()
                time.sleep(0.2)

                # NGSI source added
                entservc = get_by_contains(self.driver, ".panel.panel-default.component-draggable.component-operator", "NGSI source")
                imgp = take_capture(self.driver, extra='Wiring_NGSISource')
                add_pointer(imgp, get_position(entservc, 0.5, 0.5), False)
                crop_down(imgp, entservc, 250)

                conf_widg = get_by_contains(self.driver, ".panel.panel-default.component-draggable.component-operator", "NGSI source")

                # Add map iwidget
                mapsercvcomp = sidebar.add_component("widget", "Map Viewer", 250, 10)
                mapservc = mapsercvcomp.element
                imgp = take_capture(self.driver, extra='Wiring_NGSISource_MapViewer')
                add_pointer(imgp, get_position(mapservc, 0.5, 0.15), False)
                crop_down(imgp, mapservc, 10)


                # Over label
                labelprovideent = get_by_text(entservc, '.endpoint', 'Provide entity')
                ActionChains(self.driver).move_to_element(labelprovideent).perform()
                time.sleep(0.6)  # wait for color transition
                imgp = take_capture(self.driver, extra='Wiring_NGSISource_MapViewer_rec')
                # add_image(imgp, get_position(labelprovideent, 0.7, 0.7), 'popup1.png')
                add_pointer(imgp, get_position(labelprovideent, 0.6, 0.5), False)
                crop_down(imgp, mapservc, 10)

                sidebar.create_operator("NGSI Entity To PoI")
                poi_temp = sidebar.find_operator_group_by_title("NGSI Entity To PoI").components[0].element
                ActionChains(self.driver).click_and_hold(poi_temp).move_to_element_with_offset(sidebar.section_diagram, -30, 210).release().perform()
                time.sleep(0.2)

                poi_oper_w = sidebar._find_component_by_title("operator", "NGSI Entity To PoI")
                poiservc = poi_oper_w.element
                conf_widg = sidebar._find_component_by_title("operator", "NGSI source")

                # configure
                self.configure_ngsi_source(conf_widg)
                self.configure_ngsi_entity(poi_oper_w)  # poiservc)

            imgp = take_capture(self.driver, extra='Wiring_NGSIEntity2PoI')
            add_pointer(imgp, get_position(poiservc, 0.5, 0.45), False)
            crop_down(imgp, mapservc, 10)

            ActionChains(self.driver).move_to_element(labelprovideent).perform()
            time.sleep(0.6)  # wait for color transition
            imgp = take_capture(self.driver, extra='Wiring_NGSIEntity2PoI_rec')
            add_pointer(imgp, get_position(labelprovideent, 0.6, 0.5), False)
            crop_down(imgp, mapservc, 10)

            # PoI connection
            fromc = labelprovideent.find_element_by_css_selector('.endpoint-anchor')
            labelentity = get_by_text(poiservc, '.endpoint', 'Entity')
            toc = labelentity.find_element_by_css_selector('.endpoint-anchor')

            ActionChains(self.driver).click_and_hold(fromc).move_by_offset(-100, 100).perform()
            time.sleep(0.2)
            imgp = take_capture(
                self.driver, extra='Wiring_NGSIEntity2PoI_connection')
            pos = get_position(fromc, 0.5, 0.5)
            pos = (pos[0] - 100, pos[1] + 100)
            add_pointer(imgp, pos, False)
            crop_down(imgp, mapservc, 10)

            ActionChains(self.driver).move_to_element(toc).release().perform()
            imgp = take_capture(self.driver, extra='Wiring_NGSIEntity2PoI_c_done')
            add_pointer(imgp, get_position(labelentity, 0.6, 0.5), False)
            crop_down(imgp, mapservc, 10)

            labelPoI = get_by_text(poiservc, '.endpoint', 'PoI')
            fromc = labelPoI.find_element_by_css_selector('.endpoint-anchor')
            labelInsertUpdate = get_by_text(mapservc, '.endpoint', 'Insert/Update PoI')
            toc = labelInsertUpdate.find_element_by_css_selector('.endpoint-anchor')
            ActionChains(self.driver).drag_and_drop(
                fromc, toc).move_to_element(labelInsertUpdate).perform()
            time.sleep(0.6)
            imgp = take_capture(self.driver, extra='Wiring_End_1st_ph')
            add_pointer(imgp, get_position(labelInsertUpdate, 0.6, 0.5), False)
            crop_down(imgp, mapservc, 10)

        # Out wiring_view
        time.sleep(1)
        with map_viewer_widget:
            self.driver.execute_script('mapViewer.map.setMapTypeId("satellite");');
        time.sleep(1)
        imgp = take_capture(self.driver, extra='32')

        with map_viewer_widget:
            self.driver.execute_script('mapViewer.mapPoiManager.selectPoi(new Poi({id:"OUTSMART.NODE_3509"}));mapViewer.map.setZoom(16);');
        # with widget:
        with map_viewer_widget:
            WebDriverWait(self.driver, timeout=30).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '#loadLayer.on')))
        imgp = take_capture(self.driver, extra='MapViewerWithEntities')

        with self.wiring_view as wiring:
            cons = wiring.find_connections()
            mapservcw = wiring.find_component_by_title("widget", "Map Viewer")
            mapservc = mapservcw.element

            #
            # Reshape arrow screenshots
            #

            mycon = cons[1]  # Can we know exactly if it's this?
            cprefs = mycon.display_preferences()

            custb  = cprefs.get_entry("Customize")
            ActionChains(self.driver).move_to_element(custb).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, extra='reshape_arrow_pre')
            add_pointer(imgp, get_position(custb, 0.3, 0.3), False)
            crop_down(imgp, mapservc, 10)
            # Captura reshape_arrow_pre
            cprefs.click_entry("Customize")

            editablecon = [x for x in wiring.find_connections() if "editable" in x.class_list][0]

            upball, downball = editablecon.element.find_elements_by_css_selector(".handle-ball")

            move_elem(self.driver, downball, 30, -30)
            upball, downball = editablecon.element.find_elements_by_css_selector(".handle-ball")
            imgp = take_capture(self.driver, extra='reshape_arrow1')
            add_pointer(imgp, get_position(upball, 0.3, 0.3), False)
            crop_down(imgp, mapservc, 10)

            move_elem(self.driver, downball, -30, 30)
            editablecons = [x for x in wiring.find_connections() if "editable" in x.class_list]
            if len(editablecons) == 0:
                wiring.find_connections()[1].display_preferences().click_entry("Customize")
                editablecon = [x for x in wiring.find_connections() if "editable" in x.class_list][0]

            upball, downball = editablecon.element.find_elements_by_css_selector(".handle-ball")
            imgp = take_capture(self.driver, extra='reshape_arrow2')
            add_pointer(imgp, get_position(downball, 0.3, 0.3), False)
            crop_down(imgp, mapservc, 10)

            minb = [x for x in wiring.find_connections() if "editable" in x.class_list][0].display_preferences().get_entry("Stop customizing")
            imgp = take_capture(self.driver, extra='reshape_arrow_stop')
            add_pointer(imgp, get_position(minb, 0.3, 0.3), False)
            crop_down(imgp, mapservc, 10)
            minb.click()

            #
            # Delete arrow screenshots
            #

            delcon = wiring.find_connections()[1]
            rmbtn = delcon.btn_remove
            ActionChains(self.driver).move_to_element(rmbtn.element).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, extra='delete_arrow1')
            add_pointer(imgp, get_position(rmbtn.element, 0.5, 0.4), False)
            crop_down(imgp, mapservc, 10)

            #
            # Minimize screenshots
            #

            ngsisw = wiring.find_component_by_title("operator", "NGSI source")
            collbtn = ngsisw.display_preferences().get_entry("Collapse")
            ActionChains(self.driver).move_to_element(collbtn).perform()
            time.sleep(0.2)
            imgp = take_capture(self.driver, extra='minimize_option')
            add_pointer(imgp, get_position(collbtn, 0.3, 0.3), False)
            crop_down(imgp, mapservc, 10)
            collbtn.click()

            wiring.find_component_by_title("operator", "NGSI Entity To PoI").collapse_endpoints()

            imgp = take_capture(self.driver, extra=33)
            crop_down(imgp, mapservc, 10)


            movew = wiring.find_component_by_title("widget", "Map Viewer")
            move_elem(self.driver, movew.element, -70, 0)

            movew = wiring.find_component_by_title("operator", "NGSI Entity To PoI")
            move_elem(self.driver, movew.element, -20, 0)

            # Configure all other elements
            with wiring.component_sidebar as sidebar:
                sidebar.add_component("widget", "Linear Graph", 500, 10)
            with wiring.component_sidebar as sidebar:
                sidebar.create_operator("History Module to Linear Graph")
                sidebar.add_component("operator", "History Module to Linear Graph", 500, 100)

            mapw = wiring.find_component_by_title("widget", "Map Viewer")
            linw = wiring.find_component_by_title("widget", "Linear Graph")
            histw = wiring.find_component_by_title("operator", "History Module to Linear Graph")

            endp1 = mapw.find_endpoint_by_title("source", "PoI selected")
            endp2 = histw.find_endpoint_by_title("target", "Sensor Id")
            endp3 = histw.find_endpoint_by_title("source", "Historic Info")
            endp4 = linw.find_endpoint_by_title("target", "Data in")

            endp1.connect(endp2)
            endp3.connect(endp4)

            move_elem(self.driver, histw.element, 0, 35)

            take_capture(self.driver, extra='FinalWiring')

            popup = histw.display_preferences()
            setts_btn = popup.get_entry("Settings")
            ActionChains(self.driver).move_to_element(setts_btn).perform()
            imgp = take_capture(self.driver, extra='HistoryOperatorSettings1')
            box = create_box(popup.element, 40)
            box = (box[0], box[1], box[2] + 60, box[3])
            add_pointer(imgp, get_position(setts_btn, 0.7, 0.5), True)
            crop_image(imgp, *box)
            setts_btn.click()

            dialog = get_first_displayed(self.driver, '.window_menu')
            imgp = take_capture(self.driver, extra='HistoryOperatorSettings2')
            crop_image(imgp, *create_box(dialog))
            dialog.find_element_by_css_selector('button.btn-primary.se-btn').click()

        with widget:
            WebDriverWait(self.driver, timeout=30).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '#loadLayer.on')))

        with map_viewer_widget:
            self.driver.execute_script('''
                var poi = mapViewer.mapPoiManager.getPoiList()["OUTSMART.NODE_3506"].poi;
                mapViewer.mapPoiManager.selectPoi(poi);
                mapViewer.map.setZoom(16);
                MashupPlatform.wiring.pushEvent('poiOutput', JSON.stringify(poi))
            ''')
            self.driver.execute_script('mapViewer.map.setMapTypeId("roadmap");')

        with widget:
            WebDriverWait(self.driver, timeout=30).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '#loadLayer.on')))
        imgp = take_capture(self.driver, extra=34)

        lg_path = image_path(extra=35)
        shutil.copy2(imgp, lg_path)
        crop_image(
            lg_path, *create_box(get_by_contains(self.driver, '.fade.iwidget.in', 'Linear Graph')))
        shutil.copy2(lg_path, image_path(extra='LinearGraphZoom1'))

        # Public workspace!
        popup_menu = self.open_menu()
        m_menu = popup_menu.get_entry('Settings')
        ActionChains(self.driver).move_to_element(m_menu).perform()
        imgp = take_capture(self.driver, extra='Public_Workspace_Menu')
        add_pointer(imgp, get_position(m_menu, 0.8, 0.5))
        crop_down(imgp, popup_menu.element, 80)
        m_menu.click()
        dialog = get_first_displayed(
            self.driver, '.window_menu.workspace_preferences')
        public_b = dialog.find_element_by_css_selector('input[name="public"]')
        public_b.click()
        imgp = take_capture(self.driver, extra='Public_Workspace_Settings')
        add_pointer(imgp, get_position(public_b, 0.5, 0.5))
        crop_image(imgp, *create_box(dialog))
        dialog.find_element_by_css_selector('.btn-primary').click()

        # Embed mashup!
        popup_menu = self.open_menu()
        m_menu = popup_menu.get_entry('Embed')
        ActionChains(self.driver).move_to_element(m_menu).perform()
        imgp = take_capture(self.driver, extra='Embed_Workspace_Menu')
        add_pointer(imgp, get_position(m_menu, 0.8, 0.5))
        crop_down(imgp, popup_menu.element, 80)
        m_menu.click()
        dialog = get_first_displayed(
            self.driver, '.window_menu.embed-code-window-menu')
        imgp = take_capture(self.driver, extra='Embed_Dialog')
        crop_image(imgp, *create_box(dialog))
        dialog.find_element_by_css_selector('.btn-primary').click()

    test_building_mashup.tags = ('wirecloud-guide', 'ui-build-mashup')
