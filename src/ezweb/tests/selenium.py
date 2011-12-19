import os
import time
import re

from django.conf import settings
from django.core.cache import cache
from lxml import etree

try:
    from djangosanetesting.cases import SeleniumTestCase
except:
    class SeleniumTestCase(object):
        pass

# Avoid nose to repeat these tests (they are run through ezweb/tests/__init__.py)
__test__ = False



def format_selenium_command(func_name, arg1, arg2=None):
    text = func_name + '("'
    if arg1 is not None:
        text += arg1

        if arg2 is not None:
            text += '", "' + arg2

    text += '")'

    return text


class SeleniumWrapperException(Exception):

    def __init__(self, command, args):
        self.command = command
        self.cmd_args = args

    def __str__(self):
        return format_selenium_command(self.command, *self.cmd_args)


class SeleniumAssertionFailure(Exception):

    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return self.msg


class SeleniumSoftAssertionFailure(Exception):

    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return self.msg


class SeleniumHTMLWrapper(object):

    values = {}
    _RE = re.compile(r'\$\{([\w]+)\}')

    def __init__(self, selenium):
        self.selenium = selenium

    def _parseVariables(self, text):
        values = self.values
        return self._RE.sub(lambda x: values[x.group(1)], text)

    def addSelection(self, locator, optionLocator):
        self.selenium.add_selection(locator, optionLocator)

    def allowNativeXpath(self, allow):
        self.selenium.allow_native_xpath(allow)

    def assertElementNotPresent(self, locator):
        if self.selenium.is_element_present(locator):
            msg = '"%(locator)s" element is present'
            raise SeleniumAssertionFailure(msg % {'locator': locator})

    def assertElementPresent(self, locator):
        if not self.selenium.is_element_present(locator):
            msg = '"%(locator)s" element is not present'
            raise SeleniumAssertionFailure(msg % {'locator': locator})

    def assertText(self, locator, pattern):
        text = self._parseVariables(pattern)
        element_text = self.selenium.get_text(locator)
        if element_text != text:
            msg = '"%(locator)s" text content is not equal to "%(text)s" (real content: "%(element_text)s")'
            raise SeleniumAssertionFailure(msg % {'locator': locator, 'text': text, 'element_text': element_text})

    def assertNotText(self, locator, pattern):
        text = self._parseVariables(pattern)
        element_text = self.selenium.get_text(locator)
        if element_text == text:
            msg = '"%(locator)s" text content is equal to "%(text)s"'
            raise SeleniumAssertionFailure(msg % {'locator': locator, 'text': text})

    def assertNotVisible(self, locator):
        if self.selenium.is_visible(locator):
            msg = '"%(locator)s" is visible'
            raise SeleniumAssertionFailure(msg % {'locator': locator})

    def assertTextPresent(self, pattern):
        text = self._parseVariables(pattern)
        if not self.selenium.is_text_present(text):
            raise SeleniumAssertionFailure('text is not present: ' + text)

    def assertTextNotPresent(self, pattern):
        text = self._parseVariables(pattern)
        if self.selenium.is_text_present(text):
            raise SeleniumAssertionFailure('text is present: ' + text)

    def assertValue(self, locator, pattern):
        text = self._parseVariables(pattern)
        element_text = self.selenium.get_value(locator)
        if element_text != text:
            msg = '"%(locator)s" value is not equal to "%(text)s" (real value: "%(element_text)s")'
            raise SeleniumAssertionFailure(msg % {'locator': locator, 'text': text, 'element_text': element_text})

    def assertVisible(self, locator):
        if not self.selenium.is_visible(locator):
            msg = '"%(locator)s" is not visible'
            raise SeleniumAssertionFailure(msg % {'locator': locator})

    def assertXpathCount(self, locator, expected_count):
        count = self.selenium.get_xpath_count(locator)
        if count != expected_count:
            msg = 'XPath count for "%(locator)s" do not match %(count)s (real value: "%(real_value)s")'
            raise SeleniumAssertionFailure(msg % {'locator': locator, 'count': expected_count, 'real_value': count})

    def click(self, locator):
        self.selenium.click(locator)

    def clickAndWait(self, locator, timeout):
        if timeout == '':
            timeout = '30000'
        self.selenium.click(locator)
        self.selenium.wait_for_page_to_load(timeout)

    def keyPress(self, locator, keySequence):
        self.selenium.key_press(locator, keySequence)

    def open(self, url):
        url = self._parseVariables(url)
        self.selenium.open(url)

    def pause(self, timeout):
        time.sleep(float(timeout) / 1000)

    def refresh(self):
        self.selenium.refresh()

    def select(self, selectLocator, optionLocator):
        self.selenium.select(selectLocator, optionLocator)

    def storeValue(self, locator, variableName):
        self.values[variableName] = self.selenium.get_value(locator)

    def type(self, locator, text):
        text = self._parseVariables(text)
        self.selenium.type(locator, text)

    def verifyElementNotPresent(self, locator):
        if self.selenium.is_element_present(locator):
            msg = '"%(locator)s" element is present'
            raise SeleniumSoftAssertionFailure(msg % {'locator': locator})

    def verifyElementPresent(self, locator):
        if not self.selenium.is_element_present(locator):
            msg = '"%(locator)s" element is not present'
            raise SeleniumSoftAssertionFailure(msg % {'locator': locator})

    def verifytNotText(self, locator, pattern):
        text = self._parseVariables(pattern)
        element_text = self.selenium.get_text(locator)
        if element_text == text:
            msg = '"%(locator)s" text content is equal to "%(text)s"'
            raise SeleniumSoftAssertionFailure(msg % {'locator': locator, 'text': text})

    def verifyNotVisible(self, locator):
        if self.selenium.is_visible(locator):
            msg = '"%(locator)s" is visible'
            raise SeleniumSoftAssertionFailure(msg % {'locator': locator})

    def verifyText(self, locator, pattern):
        text = self._parseVariables(pattern)
        element_text = self.selenium.get_text(locator)
        if element_text != text:
            msg = '"%(locator)s" text content is not equal to "%(text)s" (real content: "%(element_text)s")'
            raise SeleniumSoftAssertionFailure(msg % {'locator': locator, 'text': text, 'element_text': element_text})

    def verifyTextPresent(self, pattern):
        text = self._parseVariables(pattern)
        if not self.selenium.is_text_present(text):
            raise SeleniumSoftAssertionFailure('text is not present: ' + text)

    def verifyTextNotPresent(self, pattern):
        text = self._parseVariables(pattern)
        if not self.selenium.is_text_present(text):
            raise SeleniumSoftAssertionFailure('text is present: ' + text)

    def verifyValue(self, locator, pattern):
        text = self._parseVariables(pattern)
        element_text = self.selenium.get_value(locator)
        if element_text != text:
            msg = '"%(locator)s" value is not equal to "%(text)s" (real value: "%(element_text)s")'
            raise SeleniumSoftAssertionFailure(msg % {'locator': locator, 'text': text, 'element_text': element_text})

    def verifyVisible(self, locator):
        if not self.selenium.is_visible(locator):
            msg = '"%(locator)s" is not visible'
            raise SeleniumSoftAssertionFailure(msg % {'locator': locator})

    def assertXpathCount(self, locator, expected_count):
        count = self.selenium.get_xpath_count(locator)
        if count != expected_count:
            msg = 'XPath count for "%(locator)s" do not match %(count)s (real value: "%(real_value)s")'
            raise SeleniumSoftAssertionFailure(msg % {'locator': locator, 'count': expected_count, 'real_value': count})

    def waitForElementPresent(self, locator):
        self.selenium.wait_for_element_present(locator)

    def waitForPopUp(self, windowId, timeout):
        self.selenium.wait_for_pop_up(windowId, timeout)

    def __call__(self, func_name, arg1, arg2):
        if not hasattr(self, func_name):
            raise SeleniumWrapperException(func_name, [arg1, arg2])

        func = getattr(self, func_name)
        if func.im_func.func_code.co_argcount == 3:
            if arg2 is None:
                arg2 = ''
            return func(arg1, arg2)
        elif func.im_func.func_code.co_argcount == 2:
            return func(arg1)
        else:
            return func()


class TestSelenium(SeleniumTestCase):

    fixtures = ['extra_data', 'selenium_test_data']
    __test__ = False

    def _process_selenium_html_test(self, path):
        xml = etree.parse(path, etree.XMLParser())
        steps = xml.xpath('//xhtml:table/xhtml:tbody/xhtml:tr',
            namespaces={'xhtml': 'http://www.w3.org/1999/xhtml'})

        self.wrapper.values['GWT_GADGETS_DIR'] = os.path.join(settings.BASEDIR, '..', 'tests', 'ezweb-data')

        counter = 0
        for step in steps:
            func_name = step[0].text

            try:
                self.wrapper(func_name, step[1].text, step[2].text)
            except SeleniumSoftAssertionFailure, e:
                self.verificationErrors.append(str(e))
            except SeleniumAssertionFailure, e:
                command = format_selenium_command(func_name, step[1].text, step[2].text)
                self.fail(str(e) + ' | line: ' + str(counter) + ', cmd: ' + str(command))
            except Exception, e:
                if hasattr(e, 'message') and e.message.startswith('Timed out'):
                    msg = 'command "%(command)s" timed out on line: %(line)s'
                    command = format_selenium_command(func_name, step[1].text, step[2].text)
                    self.fail(msg % {'command': command, 'line': counter})
                else:
                    raise e

            counter += 1

        self.assertEqual([], self.verificationErrors)

    def _process_selenium_html_suite(self, path):
        xml = etree.parse(path, etree.XMLParser())

        tests = xml.xpath('//xhtml:table/xhtml:tbody/xhtml:tr/xhtml:td/xhtml:a',
            namespaces={'xhtml': 'http://www.w3.org/1999/xhtml'})

        for entry in tests:
            yield entry.get('href')

    def setUp(self):
        super(TestSelenium, self).setUp()
        self.wrapper = SeleniumHTMLWrapper(self.selenium)
        self.verificationErrors = []
        cache.clear()

    def test_selenium(self):
        tests_dir = os.path.join(settings.BASEDIR, '../tests')
        for test_dir_name in os.listdir(tests_dir):
            test_dir = os.path.join(tests_dir, test_dir_name)
            suite_path = os.path.join(test_dir, 'suite.html')
            if os.path.isdir(test_dir) and os.path.isfile(suite_path):
                for test in self._process_selenium_html_suite(suite_path):
                    yield self._process_selenium_html_test, os.path.join(test_dir, test)


browsers = getattr(settings, 'WIRECLOUD_SELENIUM_BROWSER_COMMANDS', {
    'Firefox': '*firefox',
    'GoogleChrome': '*googlechrome',
})

for browser_name in browsers:
    browser = browsers[browser_name]
    class_name = browser_name + 'SeleniumTestCase'
    locals()[class_name] = type(
        class_name,
        (TestSelenium,),
        dict(
            __test__ = True,
            selenium_browser_command = browser,
        )
    )
