import os
import time
import re

from django.core.cache import cache
from lxml import etree

try:
    from djangosanetesting.cases import SeleniumTestCase
except:
    class SeleniumTestCase(object):
        pass

from proxy.tests import ProxyTests


def format_selenium_command(func_name, arg1, arg2=None):
    text = func_name + '("' + arg1
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

    def assertText(self, locator, pattern):
        if self.selenium.get_text(pattern) != pattern:
            raise SeleniumAssertionFailure('The value of the element "' + locator + '" was not equal to "' + pattern + '"')

    def assertTextPresent(self, pattern):
        if not self.selenium.is_text_present(pattern):
            raise SeleniumAssertionFailure('text was not present: ' + pattern)

    def assertTextNotPresent(self, pattern):
        if self.selenium.is_text_present(pattern):
            raise SeleniumAssertionFailure('text was present: ' + pattern)

    def assertValue(self, locator, pattern):
        if self.selenium.get_value(pattern) != pattern:
            raise SeleniumAssertionFailure('The value of the input element "' + locator + '" was not equal to "' + pattern + '"')

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

    def storeValue(self, locator, variableName):
        self.values[variableName] = self.selenium.get_value(locator)

    def type(self, locator, text):
        self.selenium.type(locator, text)

    def verifyText(self, locator, pattern):
        if self.selenium.get_text(pattern) != pattern:
            raise SeleniumSoftAssertionFailure('The value of the element "' + locator + '" was not equal to "' + pattern + '"')

    def verifyTextPresent(self, pattern):
        if not self.selenium.is_text_present(pattern):
            raise SeleniumSoftAssertionFailure('text was not present: ' + pattern)

    def verifyValue(self, locator, pattern):
        if self.selenium.get_text(pattern) != pattern:
            raise SeleniumSoftAssertionFailure('The value of the element "' + locator + '" was not equal to "' + pattern + '"')

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
        else:
            return func(arg1)


class TestSelenium(SeleniumTestCase):

    fixtures = ['extra_data', 'selenium_test_data']

    def _process_selenium_html_test(self, path):
        xml = etree.parse(path, etree.XMLParser())
        steps = xml.xpath('//xhtml:table/xhtml:tbody/xhtml:tr',
            namespaces={'xhtml': 'http://www.w3.org/1999/xhtml'})

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
        from django.conf import settings

        tests_dir = os.path.join(settings.BASEDIR, '../tests')
        for test_dir_name in os.listdir(tests_dir):
            test_dir = os.path.join(tests_dir, test_dir_name)
            suite_path = os.path.join(test_dir, 'suite.html')
            if os.path.isdir(test_dir) and os.path.isfile(suite_path):
                for test in self._process_selenium_html_suite(suite_path):
                    yield self._process_selenium_html_test, os.path.join(test_dir, test)
